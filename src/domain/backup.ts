// Formato del respaldo que va embebido en el PDF exportado (PRD F7, D-014).
import { validateRecords, validateTemplate } from './records';
import { datePart, toEpochMinutes } from './time';
import type { AppData, AppSettings, Novelty, Shift, ShiftTemplate } from './types';

export const BACKUP_APP = 'TurnosApp';
/** Subir cuando cambie la forma de `AppData`, y agregar la migración en `parseBackup`. */
export const BACKUP_FORMAT = 2;
/** Clave con la que se guarda el JSON dentro del PDF. */
export const BACKUP_KEY = 'TurnosAppBackup';

export interface BackupFile {
  app: typeof BACKUP_APP;
  format: number;
  exportedAt: string;
  data: AppData;
}

export interface BackupSummary {
  shiftCount: number;
  firstDate: string | null;
  lastDate: string | null;
  baseSalary: number;
  exportedAt: string;
}

export type BackupError = 'JSON_INVALIDO' | 'NO_ES_RESPALDO' | 'VERSION_NO_SOPORTADA' | 'DATOS_INVALIDOS';
export type BackupParseResult = { ok: true; backup: BackupFile; summary: BackupSummary } | { ok: false; error: BackupError };

export function createBackup(data: AppData, exportedAt: string): string {
  const file: BackupFile = { app: BACKUP_APP, format: BACKUP_FORMAT, exportedAt, data };
  return JSON.stringify(file);
}

const DATETIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
const TIME = /^\d{2}:\d{2}$/;
const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isNum = (v: unknown, min = 0): v is number => typeof v === 'number' && Number.isFinite(v) && v >= min;
const isOptNum = (v: unknown) => v === undefined || isNum(v);
const isOptStr = (v: unknown) => v === undefined || typeof v === 'string';

function isSettings(v: unknown): v is AppSettings {
  if (!isObj(v) || !isObj(v.transportAllowance)) return false;
  const o = v.overrides;
  return (
    isNum(v.baseSalary) &&
    isOptNum(v.monthlyDivisor) &&
    isNum(v.dailyLimitHours) &&
    isNum(v.weeklyLimitHours) &&
    (v.payPeriod === 'quincenal' || v.payPeriod === 'mensual') &&
    typeof v.transportAllowance.enabled === 'boolean' &&
    isOptNum(v.transportAllowance.amount) &&
    (o === undefined || (isObj(o) && [o.nightPct, o.sundayPct, o.extraDayPct, o.extraNightPct].every(isOptNum))) &&
    (v.holidayOrdinaryPay === undefined || v.holidayOrdinaryPay === 'completa' || v.holidayOrdinaryPay === 'solo-recargo') &&
    isOptNum(v.monthlyDeductions) &&
    isOptStr(v.onboardingCompletedAt) &&
    isOptStr(v.legalNoticeAcceptedAt)
  );
}

const isShift = (v: unknown): v is Shift =>
  isObj(v) && typeof v.id === 'string' && typeof v.start === 'string' && DATETIME.test(v.start) &&
  typeof v.end === 'string' && DATETIME.test(v.end) && isOptStr(v.note) &&
  (v.fields === undefined || (Array.isArray(v.fields) && v.fields.every((f) => isObj(f) && typeof f.name === 'string' && (typeof f.value === 'string' || (typeof f.value === 'number' && Number.isFinite(f.value))))));

const isTemplate = (v: unknown): v is ShiftTemplate =>
  isObj(v) && typeof v.id === 'string' && typeof v.name === 'string' && typeof v.startTime === 'string' &&
  TIME.test(v.startTime) && isNum(v.durationMinutes, 1);

export function parseBackup(text: string): BackupParseResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: 'JSON_INVALIDO' };
  }
  if (!isObj(raw) || raw.app !== BACKUP_APP || !isNum(raw.format, 1)) return { ok: false, error: 'NO_ES_RESPALDO' };
  if (!Number.isInteger(raw.format) || raw.format > BACKUP_FORMAT) return { ok: false, error: 'VERSION_NO_SOPORTADA' };

  const d = raw.data;
  if (raw.format === 1 && isObj(d) && d.novelties === undefined) d.novelties = [];
  const valid =
    typeof raw.exportedAt === 'string' && isObj(d) && isSettings(d.settings) &&
    Array.isArray(d.shifts) && d.shifts.every(isShift) &&
    Array.isArray(d.templates) && d.templates.every(isTemplate) && d.templates.every((t) => validateTemplate(t).length === 0) &&
    Array.isArray(d.novelties) && d.novelties.every((n) => isObj(n) && typeof n.id === 'string' && typeof n.date === 'string' && typeof n.kind === 'string' && isOptStr(n.note)) &&
    validateRecords(d.shifts as Shift[], d.novelties as Novelty[]).length === 0;
  if (!valid) return { ok: false, error: 'DATOS_INVALIDOS' };

  const backup = { ...raw, format: BACKUP_FORMAT } as unknown as BackupFile;
  const dates = backup.data.shifts.map((s) => datePart(s.start)).sort();
  return {
    ok: true,
    backup,
    summary: {
      shiftCount: dates.length,
      firstDate: dates[0] ?? null,
      lastDate: dates[dates.length - 1] ?? null,
      baseSalary: backup.data.settings.baseSalary,
      exportedAt: backup.exportedAt,
    },
  };
}

/** Combina turnos importados con los existentes: los existentes mandan; se omiten ids repetidos y superposiciones. */
export function mergeShifts(existing: Shift[], incoming: Shift[]): { shifts: Shift[]; skipped: Shift[] } {
  const result = [...existing];
  const ids = new Set(existing.map((s) => s.id));
  const skipped: Shift[] = [];
  const overlaps = (a: Shift, b: Shift) =>
    toEpochMinutes(a.start) < toEpochMinutes(b.end) && toEpochMinutes(b.start) < toEpochMinutes(a.end);
  for (const s of incoming) {
    if (ids.has(s.id)) continue;
    if (result.some((e) => overlaps(e, s))) {
      skipped.push(s);
      continue;
    }
    result.push(s);
    ids.add(s.id);
  }
  return { shifts: result.sort((a, b) => a.start.localeCompare(b.start)), skipped };
}
