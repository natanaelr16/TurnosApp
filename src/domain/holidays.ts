import { addDays, dayOfWeek, makeDate } from './time';
import type { LocalDate } from './types';

/** Domingo de Pascua (algoritmo anónimo gregoriano). */
export function easterSunday(year: number): LocalDate {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return makeDate(year, month, day);
}

const FIXED: [number, number][] = [[1, 1], [5, 1], [7, 20], [8, 7], [12, 8], [12, 25]];
const MOVED_TO_MONDAY: [number, number][] = [[1, 6], [3, 19], [6, 29], [8, 15], [10, 12], [11, 1], [11, 11]];
/** Días después de Pascua: Jueves y Viernes Santo; Ascensión, Corpus y Sagrado Corazón ya trasladados a lunes. */
const EASTER_OFFSETS = [-3, -2, 43, 64, 71];

const nextMonday = (date: LocalDate) => addDays(date, (8 - dayOfWeek(date)) % 7);

const cache = new Map<number, LocalDate[]>();

/** Festivos de Colombia del año, ordenados y sin duplicados (REGLAS_LEGALES §5). */
export function holidaysOf(year: number): LocalDate[] {
  const cached = cache.get(year);
  if (cached) return cached;
  const easter = easterSunday(year);
  const days = new Set<LocalDate>([
    ...FIXED.map(([m, d]) => makeDate(year, m, d)),
    ...MOVED_TO_MONDAY.map(([m, d]) => nextMonday(makeDate(year, m, d))),
    ...EASTER_OFFSETS.map((offset) => addDays(easter, offset)),
  ]);
  const list = [...days].sort();
  cache.set(year, list);
  return list;
}

export function isHoliday(date: LocalDate): boolean {
  return holidaysOf(Number(date.slice(0, 4))).includes(date);
}

/** Domingo o festivo: genera recargo dominical/festivo. */
export function isRestDay(date: LocalDate): boolean {
  return dayOfWeek(date) === 0 || isHoliday(date);
}
