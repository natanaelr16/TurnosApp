import type { LocalDate, LocalDateTime } from './types';

export const MINUTES_PER_DAY = 1440;

const pad = (n: number) => String(n).padStart(2, '0');

/** Minutos desde 1970-01-01T00:00 tratando la hora como local fija (Colombia no tiene horario de verano). */
export function toEpochMinutes(value: LocalDateTime): number {
  const [date, time] = value.split('T');
  const [y, m, d] = date.split('-').map(Number);
  const [h, min] = time.split(':').map(Number);
  return Date.UTC(y, m - 1, d, h, min) / 60_000;
}

export function dayNumber(date: LocalDate): number {
  return toEpochMinutes(`${date}T00:00`) / MINUTES_PER_DAY;
}

export function dateFromDayNumber(day: number): LocalDate {
  const d = new Date(day * MINUTES_PER_DAY * 60_000);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

export function datePart(value: LocalDateTime): LocalDate {
  return value.slice(0, 10);
}

export function addDays(date: LocalDate, days: number): LocalDate {
  return dateFromDayNumber(dayNumber(date) + days);
}

/** 0 = domingo … 6 = sábado. */
export function dayOfWeek(date: LocalDate): number {
  return (((dayNumber(date) + 4) % 7) + 7) % 7;
}

/** Lunes de la semana (lun–dom) a la que pertenece la fecha. */
export function mondayOf(date: LocalDate): LocalDate {
  return addDays(date, -((dayOfWeek(date) + 6) % 7));
}

export function makeDate(year: number, month: number, day: number): LocalDate {
  return `${year}-${pad(month)}-${pad(day)}`;
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}
