import { isRestDay } from './holidays';
import { legalRatesOn, MAX_DAILY_EXTRA_MINUTES, MAX_WEEKLY_EXTRA_MINUTES, type LegalRates } from './legal-params';
import { dateFromDayNumber, datePart, MINUTES_PER_DAY, mondayOf, toEpochMinutes } from './time';
import {
  MINUTE_CATEGORIES,
  type ByCategory,
  type LocalDate,
  type MinuteCategory,
  type Settings,
  type Shift,
  type ShiftResult,
  type ShiftValidationError,
  type ShiftWarning,
} from './types';

const MAX_SHIFT_MINUTES = 24 * 60;

export const emptyByCategory = (): ByCategory =>
  Object.fromEntries(MINUTE_CATEGORIES.map((c) => [c, 0])) as ByCategory;

/** Porcentajes legales del día con los reemplazos del usuario aplicados (D-005). */
export function effectiveRates(date: LocalDate, settings: Settings): LegalRates {
  const legal = legalRatesOn(date);
  const o = settings.overrides ?? {};
  return {
    ...legal,
    divisor: settings.monthlyDivisor ?? legal.divisor,
    nightPct: o.nightPct ?? legal.nightPct,
    sundayPct: o.sundayPct ?? legal.sundayPct,
    extraDayPct: o.extraDayPct ?? legal.extraDayPct,
    extraNightPct: o.extraNightPct ?? legal.extraNightPct,
  };
}

/** Factor sobre el valor hora que se paga adicional al salario (REGLAS_LEGALES §4.1). */
function factorFor(isExtra: boolean, isNight: boolean, isHoliday: boolean, r: LegalRates, settings: Settings): number {
  const fullHour = isExtra || (isHoliday && settings.holidayOrdinaryPay !== 'solo-recargo') ? 1 : 0;
  const pct = isExtra ? (isNight ? r.extraNightPct : r.extraDayPct) : isNight ? r.nightPct : 0;
  return fullHour + (pct + (isHoliday ? r.sundayPct : 0)) / 100;
}

/** Tabla de factores vigente en una fecha (como el "Detalle de liquidación" de una planilla de nómina). */
export function factorTable(date: LocalDate, settings: Settings): ByCategory {
  const r = effectiveRates(date, settings);
  const table = emptyByCategory();
  for (const c of MINUTE_CATEGORIES) {
    table[c] = factorFor(c.startsWith('extra'), c.includes('Night'), c.endsWith('Holiday'), r, settings);
  }
  return table;
}

function categoryOf(isExtra: boolean, isNight: boolean, isHoliday: boolean): MinuteCategory {
  return `${isExtra ? 'extra' : 'ordinary'}${isNight ? 'Night' : 'Day'}${isHoliday ? 'Holiday' : ''}` as MinuteCategory;
}

/**
 * Calcula todos los turnos en orden cronológico, clasificando cada minuto (REGLAS_LEGALES §4).
 * Recibe todos los turnos conocidos para que los límites semanales consideren semanas completas.
 */
export function computeShifts(shifts: Shift[], settings: Settings): ShiftResult[] {
  const sorted = [...shifts].sort((a, b) => a.start.localeCompare(b.start));
  const dailyOrdinary = new Map<LocalDate, number>();
  const weeklyOrdinary = new Map<LocalDate, number>();
  const dailyExtra = new Map<LocalDate, number>();
  const weeklyExtra = new Map<LocalDate, number>();
  const dailyLimit = settings.dailyLimitHours * 60;
  const weeklyLimit = settings.weeklyLimitHours * 60;

  return sorted.map((shift) => {
    const workDay = datePart(shift.start);
    const week = mondayOf(workDay);
    const hourValue = settings.baseSalary / effectiveRates(workDay, settings).divisor;
    const minutes = emptyByCategory();
    const rawAmounts = emptyByCategory();
    const startMin = toEpochMinutes(shift.start);
    const endMin = toEpochMinutes(shift.end);

    let day = Number.NaN;
    let date = '';
    let rates = effectiveRates(workDay, settings);
    let holiday = false;

    for (let t = startMin; t < endMin; t++) {
      const currentDay = Math.floor(t / MINUTES_PER_DAY);
      if (currentDay !== day) {
        day = currentDay;
        date = dateFromDayNumber(day);
        rates = effectiveRates(date, settings);
        holiday = isRestDay(date);
      }
      const minuteOfDay = t - day * MINUTES_PER_DAY;
      const isNight = minuteOfDay >= rates.nightStartMinute || minuteOfDay < rates.nightEndMinute;
      const dayOrd = dailyOrdinary.get(workDay) ?? 0;
      const weekOrd = weeklyOrdinary.get(week) ?? 0;
      const isExtra = dayOrd >= dailyLimit || weekOrd >= weeklyLimit;

      if (isExtra) {
        dailyExtra.set(workDay, (dailyExtra.get(workDay) ?? 0) + 1);
        weeklyExtra.set(week, (weeklyExtra.get(week) ?? 0) + 1);
      } else {
        dailyOrdinary.set(workDay, dayOrd + 1);
        weeklyOrdinary.set(week, weekOrd + 1);
      }
      const category = categoryOf(isExtra, isNight, holiday);
      minutes[category] += 1;
      rawAmounts[category] += (hourValue * factorFor(isExtra, isNight, holiday, rates, settings)) / 60;
    }

    const amounts = emptyByCategory();
    for (const c of MINUTE_CATEGORIES) amounts[c] = Math.round(rawAmounts[c]);
    const extraTotal = MINUTE_CATEGORIES.filter((c) => c.startsWith('extra')).reduce((s, c) => s + amounts[c], 0);
    const surchargeTotal = MINUTE_CATEGORIES.filter((c) => c.startsWith('ordinary')).reduce((s, c) => s + amounts[c], 0);
    const extraMinutes = MINUTE_CATEGORIES.filter((c) => c.startsWith('extra')).reduce((s, c) => s + minutes[c], 0);

    const warnings: ShiftWarning[] = [];
    if (extraMinutes > 0 && (dailyExtra.get(workDay) ?? 0) > MAX_DAILY_EXTRA_MINUTES) warnings.push('EXTRA_DIARIO_EXCEDIDO');
    if (extraMinutes > 0 && (weeklyExtra.get(week) ?? 0) > MAX_WEEKLY_EXTRA_MINUTES) warnings.push('EXTRA_SEMANAL_EXCEDIDO');

    return {
      shift,
      hourValue,
      totalMinutes: endMin - startMin,
      extraMinutes,
      minutes,
      amounts,
      surchargeTotal,
      extraTotal,
      total: surchargeTotal + extraTotal,
      warnings,
    };
  });
}

/** Errores que impiden guardar un turno: fin ≤ inicio, más de 24 h o superposición. */
export function validateShifts(shifts: Shift[]): ShiftValidationError[] {
  const errors: ShiftValidationError[] = [];
  const sorted = [...shifts].sort((a, b) => a.start.localeCompare(b.start));
  sorted.forEach((s, i) => {
    const duration = toEpochMinutes(s.end) - toEpochMinutes(s.start);
    if (duration <= 0) errors.push({ shiftId: s.id, code: 'FIN_ANTES_DE_INICIO' });
    else if (duration > MAX_SHIFT_MINUTES) errors.push({ shiftId: s.id, code: 'DURACION_EXCESIVA' });
    const prev = sorted[i - 1];
    if (prev && s.start < prev.end) errors.push({ shiftId: s.id, code: 'SUPERPUESTO', otherShiftId: prev.id });
  });
  return errors;
}
