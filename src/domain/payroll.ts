import {
    BENEFITS_CAP_PCT,
    BENEFITS_CAP_UVT_YEAR,
    EXEMPT_INCOME_CAP_UVT_YEAR,
    EXEMPT_INCOME_PCT,
    fspPercent,
    HEALTH_PCT,
    PENSION_PCT,
    WITHHOLDING_TABLE,
    yearlyParams,
} from './legal-params';
import { emptyByCategory, factorTable } from './shift-calc';
import { datePart, daysInMonth, makeDate } from './time';
import {
    MINUTE_CATEGORIES,
    type LocalDate,
    type MinuteCategory,
    type Novelty,
    type PayPeriodType,
    type PeriodRange,
    type PeriodSummary,
    type Settings,
    type ShiftResult,
} from './types';

/** Orden y nombres del "cuadro de liquidación" de la planilla empresarial (D-024). */
export const LIQUIDATION_ROWS: { category: MinuteCategory; label: string }[] = [
    { category: 'extraDay', label: 'Horas extras diurnas' },
    { category: 'ordinaryNight', label: 'Recargo nocturno' },
    { category: 'extraNight', label: 'Horas extras nocturnas' },
    { category: 'ordinaryDayHoliday', label: 'Dominical o festivo diurno' },
    { category: 'extraDayHoliday', label: 'Extra diurna festiva' },
    { category: 'ordinaryNightHoliday', label: 'Festivo ordinario nocturno' },
    { category: 'extraNightHoliday', label: 'Extra nocturna festiva' },
];

export interface LiquidationRow {
    category: MinuteCategory;
    label: string;
    factor: number;
    hours: number;
    amount: number;
}

export interface LiquidationTable {
    rows: LiquidationRow[];
    /** Minutos ordinarios + extras trabajados en el periodo. */
    workedMinutes: number;
    /** Suma de recargos + extras (lo que la planilla paga adicional al básico). */
    totalAmount: number;
}

/** Acumulados del periodo por factor, como la tabla "Factor · Cant. Horas · Valor" de la planilla (D-024). */
export function liquidationTable(results: ShiftResult[], settings: Settings, period: PeriodRange): LiquidationTable {
    const inPeriod = results.filter((r) => {
        const d = datePart(r.shift.start);
        return d >= period.start && d <= period.end;
    });
    const factors = factorTable(period.start, settings);
    const rows = LIQUIDATION_ROWS.map(({ category, label }) => ({
        category,
        label,
        factor: factors[category],
        hours: inPeriod.reduce((s, r) => s + r.minutes[category], 0) / 60,
        amount: inPeriod.reduce((s, r) => s + r.amounts[category], 0),
    }));
    return {
        rows,
        workedMinutes: inPeriod.reduce((s, r) => s + r.totalMinutes, 0),
        totalAmount: rows.reduce((s, r) => s + r.amount, 0),
    };
}

/** Porcentaje del promedio devengado que paga la empresa por incapacidad (D-016/D-027). */
export const SICK_DAY_PCT = 75;

export interface BasicPay {
  /** Valor del día básico: salario mensual / 30 (regla de la planilla real). */
  daily: number;
  /** Días pagos completos: turnos, descansos y permisos remunerados. */
  fullDays: number;
  sickDays: number;
  unpaidDays: number;
  fullAmount: number;
  /** Promedio diario devengado: (básico de días completos + recargos + extras) / días completos. */
  avgDaily: number;
  /** Valor del día de incapacidad: 75 % del promedio devengado (como la nómina real). */
  sickDaily: number;
  sickAmount: number;
  /** Básico del periodo: días completos + incapacidades al 75 % del promedio. */
  amount: number;
}

/** Básico prorrateado por días pagos, como en la nómina real del usuario (D-016/D-027).
 *  Un día con turno cuenta una vez aunque haya varios turnos; la novedad solo cuenta
 *  si el día no tiene turno registrado. La incapacidad paga el 75 % del promedio
 *  diario devengado del periodo (básico + recargos + extras), no del básico puro. */
export function basicPayDetail(results: ShiftResult[], novelties: Novelty[], settings: Settings, period: PeriodRange): BasicPay {
  const daily = Math.round(settings.baseSalary / 30);
  const worked = new Set(
    results.map((r) => datePart(r.shift.start)).filter((d) => d >= period.start && d <= period.end),
  );
  let fullDays = worked.size, sickDays = 0, unpaidDays = 0;
  for (const n of novelties) {
    if (n.date < period.start || n.date > period.end || worked.has(n.date)) continue;
    if (n.kind === 'sick') sickDays++;
    else if (n.kind === 'unpaid-leave') unpaidDays++;
    else fullDays++;
  }
  const fullAmount = fullDays * daily;
  const accrued = results
    .filter((r) => { const d = datePart(r.shift.start); return d >= period.start && d <= period.end; })
    .reduce((s, r) => s + r.surchargeTotal + r.extraTotal, 0);
  const avgDaily = fullDays ? Math.round((fullAmount + accrued) / fullDays) : daily;
  const sickDaily = Math.round((avgDaily * SICK_DAY_PCT) / 100);
  const sickAmount = sickDays * sickDaily;
  return { daily, fullDays, sickDays, unpaidDays, fullAmount, avgDaily, sickDaily, sickAmount, amount: fullAmount + sickAmount };
}

export function periodFor(date: LocalDate, type: PayPeriodType): PeriodRange {
  const [y, m, d] = date.split('-').map(Number);
  const last = makeDate(y, m, daysInMonth(y, m));
  if (type === 'mensual') return { start: makeDate(y, m, 1), end: last };
  return d <= 15 ? { start: makeDate(y, m, 1), end: makeDate(y, m, 15) } : { start: makeDate(y, m, 16), end: last };
}

interface WithholdingInput {
  laborIncome: number;
  /** Ingresos no constitutivos de renta: salud + pensión + FSP del trabajador. */
  nonTaxable: number;
  deductions: number;
  uvt: number;
}

/** Retención en la fuente mensual, procedimiento 1 — ESTIMADO (REGLAS_LEGALES §7, D-007). */
export function withholdingMonthly({ laborIncome, nonTaxable, deductions, uvt }: WithholdingInput): number {
  const subtotal = Math.max(0, laborIncome - nonTaxable);
  const exempt = Math.min(EXEMPT_INCOME_PCT * Math.max(0, subtotal - deductions), (EXEMPT_INCOME_CAP_UVT_YEAR / 12) * uvt);
  const benefits = Math.min(deductions + exempt, BENEFITS_CAP_PCT * subtotal, (BENEFITS_CAP_UVT_YEAR / 12) * uvt);
  const baseUvt = (subtotal - benefits) / uvt;
  const row = WITHHOLDING_TABLE.find(([from]) => baseUvt > from);
  if (!row) return 0;
  const [from, rate, fixed] = row;
  return Math.round((((baseUvt - from) * rate + fixed) * uvt) / 1000) * 1000;
}

/** Resumen de pago estimado del periodo. Incluye los turnos cuya fecha de inicio cae en el periodo. */
export function computePeriod(results: ShiftResult[], settings: Settings, period: PeriodRange): PeriodSummary {
  const inPeriod = results.filter((r) => {
    const d = datePart(r.shift.start);
    return d >= period.start && d <= period.end;
  });
  const { smmlv, uvt, transportAllowance: legalTransport } = yearlyParams(Number(period.start.slice(0, 4)));
  const fraction = settings.payPeriod === 'quincenal' ? 0.5 : 1;

  const minutes = emptyByCategory();
  for (const r of inPeriod) for (const c of MINUTE_CATEGORIES) minutes[c] += r.minutes[c];
  const surcharges = inPeriod.reduce((s, r) => s + r.surchargeTotal, 0);
  const extras = inPeriod.reduce((s, r) => s + r.extraTotal, 0);
  const basePay = Math.round(settings.baseSalary * fraction);
  const transport = settings.transportAllowance.enabled
    ? Math.round((settings.transportAllowance.amount ?? legalTransport) * fraction)
    : 0;

  const contributionBase = Math.max(basePay + surcharges + extras, Math.round(smmlv * fraction));
  const health = Math.round((contributionBase * HEALTH_PCT) / 100);
  const pension = Math.round((contributionBase * PENSION_PCT) / 100);
  const solidarityFund = Math.round((contributionBase * fspPercent(contributionBase / fraction / smmlv, period.start)) / 100);

  const monthlyWithholding = withholdingMonthly({
    laborIncome: (basePay + surcharges + extras + transport) / fraction,
    nonTaxable: (health + pension + solidarityFund) / fraction,
    deductions: settings.monthlyDeductions ?? 0,
    uvt,
  });
  const withholding = Math.round(monthlyWithholding * fraction);

  const gross = basePay + surcharges + extras + transport;
  const totalDeductions = health + pension + solidarityFund + withholding;
  return {
    period,
    shiftCount: inPeriod.length,
    minutes,
    basePay,
    surcharges,
    extras,
    transportAllowance: transport,
    gross,
    contributionBase,
    health,
    pension,
    solidarityFund,
    withholding,
    totalDeductions,
    net: gross - totalDeductions,
  };
}
