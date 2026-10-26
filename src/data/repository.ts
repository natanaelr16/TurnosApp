import { DEFAULT_SETTINGS, DEFAULT_TEMPLATES } from '@/domain/defaults';
import type { AppData, AppSettings, Shift, ShiftTemplate } from '@/domain/types';

import type { Db } from './db';

interface ShiftRow {
  id: string;
  start: string;
  end: string;
  note: string | null;
}

interface TemplateRow {
  id: string;
  name: string;
  start_time: string;
  duration_minutes: number;
}

const now = () => new Date().toISOString();

const toShift = (r: ShiftRow): Shift => ({ id: r.id, start: r.start, end: r.end, ...(r.note ? { note: r.note } : {}) });
const toTemplate = (r: TemplateRow): ShiftTemplate => ({
  id: r.id,
  name: r.name,
  startTime: r.start_time,
  durationMinutes: r.duration_minutes,
});

export async function loadSettings(db: Db): Promise<AppSettings> {
  const row = await db.getFirstAsync<{ json: string }>('SELECT json FROM settings WHERE id = 1');
  return row ? { ...DEFAULT_SETTINGS, ...(JSON.parse(row.json) as Partial<AppSettings>) } : DEFAULT_SETTINGS;
}

export async function saveSettings(db: Db, settings: AppSettings): Promise<void> {
  await db.runAsync(
    'INSERT INTO settings (id, json, updated_at) VALUES (1, ?, ?) ON CONFLICT(id) DO UPDATE SET json = excluded.json, updated_at = excluded.updated_at',
    [JSON.stringify(settings), now()],
  );
}

export async function loadShifts(db: Db): Promise<Shift[]> {
  return (await db.getAllAsync<ShiftRow>('SELECT id, start, end, note FROM shifts ORDER BY start')).map(toShift);
}

export async function upsertShift(db: Db, shift: Shift): Promise<void> {
  const ts = now();
  await db.runAsync(
    `INSERT INTO shifts (id, start, end, note, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET start = excluded.start, end = excluded.end, note = excluded.note, updated_at = excluded.updated_at`,
    [shift.id, shift.start, shift.end, shift.note ?? null, ts, ts],
  );
}

export async function deleteShift(db: Db, id: string): Promise<void> {
  await db.runAsync('DELETE FROM shifts WHERE id = ?', [id]);
}

export async function loadTemplates(db: Db): Promise<ShiftTemplate[]> {
  return (
    await db.getAllAsync<TemplateRow>('SELECT id, name, start_time, duration_minutes FROM shift_templates ORDER BY sort_order')
  ).map(toTemplate);
}

async function writeTemplates(db: Db, templates: ShiftTemplate[]): Promise<void> {
  await db.runAsync('DELETE FROM shift_templates');
  for (const [i, t] of templates.entries()) {
    await db.runAsync(
      'INSERT INTO shift_templates (id, name, start_time, duration_minutes, sort_order) VALUES (?, ?, ?, ?, ?)',
      [t.id, t.name, t.startTime, t.durationMinutes, i],
    );
  }
}

export async function saveTemplates(db: Db, templates: ShiftTemplate[]): Promise<void> {
  await db.withTransactionAsync(() => writeTemplates(db, templates));
}

export async function completeOnboarding(db: Db, settings: AppSettings, templates: ShiftTemplate[]): Promise<void> {
  await db.withTransactionAsync(async () => {
    await saveSettings(db, settings);
    await writeTemplates(db, templates);
  });
}

export async function loadAppData(db: Db): Promise<AppData> {
  return { settings: await loadSettings(db), shifts: await loadShifts(db), templates: await loadTemplates(db) };
}

/** Reemplaza todo (restaurar respaldo). Atómico: si algo falla no se pierde nada. */
export async function replaceAppData(db: Db, data: AppData): Promise<void> {
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM shifts');
    await saveSettings(db, data.settings);
    for (const s of data.shifts) await upsertShift(db, s);
    await db.runAsync('DELETE FROM shift_templates');
    for (const [i, t] of data.templates.entries()) {
      await db.runAsync(
        'INSERT INTO shift_templates (id, name, start_time, duration_minutes, sort_order) VALUES (?, ?, ?, ?, ?)',
        [t.id, t.name, t.startTime, t.durationMinutes, i],
      );
    }
  });
}

/** "Borrar todos mis datos" (CUMPLIMIENTO). Deja la app como recién instalada. */
export async function deleteAllData(db: Db): Promise<void> {
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM shifts');
    await db.runAsync('DELETE FROM settings');
    await writeTemplates(db, DEFAULT_TEMPLATES);
  });
}

/** Id único local para turnos y plantillas. */
export function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
