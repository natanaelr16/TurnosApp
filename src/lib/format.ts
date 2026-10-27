// Formatos de presentación (docs/DISENO.md): `$ 1.234.567`, `7 h 30 min`, `vie 24 oct`.
import { dayOfWeek, makeDate } from '@/domain/time';
import type { LocalDate } from '@/domain/types';

const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const DAYS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];

export function formatCOP(value: number): string {
  const n = Math.round(value);
  const digits = Math.abs(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${n < 0 ? '−' : ''}$ ${digits}`;
}

export function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

/** 'vie 24 oct' */
export function formatShortDate(date: LocalDate): string {
  const [, m, d] = date.split('-').map(Number);
  return `${DAYS[dayOfWeek(date)]} ${d} ${MONTHS[m - 1].slice(0, 3)}`;
}

/** 'octubre 2026' */
export function formatMonth(year: number, month: number): string {
  return `${MONTHS[month - 1]} ${year}`;
}

/** 'Oct' */
export function formatMonthShort(month: number): string {
  const name = MONTHS[month - 1];
  return name.slice(0, 1).toUpperCase() + name.slice(1, 3);
}

/** '1 – 15 oct 2026' */
export function formatPeriod(start: LocalDate, end: LocalDate): string {
  const [y, m, d1] = start.split('-').map(Number);
  const d2 = Number(end.slice(8, 10));
  return `${d1} – ${d2} ${MONTHS[m - 1].slice(0, 3)} ${y}`;
}

/** 1.9 → '1,90' */
export function formatFactor(factor: number): string {
  return factor.toFixed(2).replace('.', ',');
}

/** Fecha local del dispositivo como 'YYYY-MM-DD'. */
export function todayLocal(now = new Date()): LocalDate {
  return makeDate(now.getFullYear(), now.getMonth() + 1, now.getDate());
}
