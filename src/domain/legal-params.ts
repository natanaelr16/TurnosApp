// Parámetros legales por fecha. Fuente: docs/REGLAS_LEGALES.md — mantener sincronizado.
import type { LocalDate } from './types';

interface Dated<T> {
  from: LocalDate;
  value: T;
}

/** Valor vigente en `date` de una tabla ordenada por `from` ascendente. */
function valueOn<T>(table: Dated<T>[], date: LocalDate): T {
  let current = table[0].value;
  for (const row of table) if (row.from <= date) current = row.value;
  return current;
}

const WORKWEEK: Dated<{ weeklyHours: number; divisor: number }>[] = [
  { from: '0000-01-01', value: { weeklyHours: 48, divisor: 240 } },
  { from: '2023-07-15', value: { weeklyHours: 47, divisor: 235 } },
  { from: '2024-07-15', value: { weeklyHours: 46, divisor: 230 } },
  { from: '2025-07-15', value: { weeklyHours: 44, divisor: 220 } },
  { from: '2026-07-15', value: { weeklyHours: 42, divisor: 210 } },
];

const NIGHT_START: Dated<number>[] = [
  { from: '0000-01-01', value: 21 * 60 },
  { from: '2025-12-25', value: 19 * 60 },
];

const SUNDAY_PCT: Dated<number>[] = [
  { from: '0000-01-01', value: 75 },
  { from: '2025-07-01', value: 80 },
  { from: '2026-07-01', value: 90 },
  { from: '2027-07-01', value: 100 },
];

export interface LegalRates {
  weeklyHours: number;
  divisor: number;
  nightStartMinute: number;
  nightEndMinute: number;
  nightPct: number;
  sundayPct: number;
  extraDayPct: number;
  extraNightPct: number;
}

export function legalRatesOn(date: LocalDate): LegalRates {
  return {
    ...valueOn(WORKWEEK, date),
    nightStartMinute: valueOn(NIGHT_START, date),
    nightEndMinute: 6 * 60,
    nightPct: 35,
    sundayPct: valueOn(SUNDAY_PCT, date),
    extraDayPct: 25,
    extraNightPct: 75,
  };
}

export interface YearlyParams {
  smmlv: number;
  transportAllowance: number;
  uvt: number;
}

const YEARLY: Record<number, YearlyParams> = {
  2025: { smmlv: 1_423_500, transportAllowance: 200_000, uvt: 49_799 },
  2026: { smmlv: 1_750_905, transportAllowance: 249_095, uvt: 52_374 },
};

/** `false` si el año usa parámetros de otro año (la UI debe avisar). */
export function hasYearlyParams(year: number): boolean {
  return year in YEARLY;
}

/** Parámetros del año; si el año aún no está cargado, usa el último conocido (ver /actualizar-normativa). */
export function yearlyParams(year: number): YearlyParams {
  const known = Object.keys(YEARLY).map(Number).sort((a, b) => a - b);
  const usable = known.filter((y) => y <= year);
  return YEARLY[usable.length ? usable[usable.length - 1] : known[0]];
}

/** Tramos del FSP: primer tramo (de mayor a menor) cuyo mínimo cumpla el IBC en SMMLV. */
type FspBracket = { min: number; inclusive: boolean; pct: number };

const FSP: Dated<FspBracket[]>[] = [
  {
    from: '0000-01-01', // Ley 100 de 1993 art. 27, mod. Ley 797 de 2003
    value: [
      { min: 20, inclusive: false, pct: 2 },
      { min: 19, inclusive: true, pct: 1.8 },
      { min: 18, inclusive: true, pct: 1.6 },
      { min: 17, inclusive: true, pct: 1.4 },
      { min: 16, inclusive: true, pct: 1.2 },
      { min: 4, inclusive: true, pct: 1 },
    ],
  },
  {
    from: '2027-04-01', // Ley 2381 de 2024 art. 20 (Sentencia C-264 de 2026)
    value: [
      { min: 20, inclusive: false, pct: 3 },
      { min: 19, inclusive: true, pct: 2.8 },
      { min: 11, inclusive: true, pct: 2.5 },
      { min: 7, inclusive: true, pct: 1.8 },
      { min: 4, inclusive: true, pct: 1.5 },
    ],
  },
];

export function fspPercent(ibcInSmmlv: number, date: LocalDate): number {
  const bracket = valueOn(FSP, date).find((b) => (b.inclusive ? ibcInSmmlv >= b.min : ibcInSmmlv > b.min));
  return bracket?.pct ?? 0;
}

/** Tabla Art. 383 ET: [desde UVT, tarifa, impuesto base en UVT]. */
export const WITHHOLDING_TABLE: [number, number, number][] = [
  [2300, 0.39, 770],
  [945, 0.37, 268],
  [640, 0.35, 162],
  [360, 0.33, 69],
  [150, 0.28, 10],
  [95, 0.19, 0],
];

export const EXEMPT_INCOME_PCT = 0.25;
export const EXEMPT_INCOME_CAP_UVT_YEAR = 790;
export const BENEFITS_CAP_PCT = 0.4;
export const BENEFITS_CAP_UVT_YEAR = 1340;
export const HEALTH_PCT = 4;
export const PENSION_PCT = 4;
export const MAX_DAILY_EXTRA_MINUTES = 2 * 60;
export const MAX_WEEKLY_EXTRA_MINUTES = 12 * 60;
