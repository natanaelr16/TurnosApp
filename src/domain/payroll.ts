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
import { emptyByCategory } from './shift-calc';
import { datePart, daysInMonth, makeDate } from './time';
import {
  MINUTE_CATEGORIES,
  type LocalDate,
  type PayPeriodType,
  type PeriodRange,
  type PeriodSummary,
  type Settings,
  type ShiftResult,
} from './types';

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
