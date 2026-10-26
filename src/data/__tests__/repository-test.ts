import { createBackup, parseBackup } from '@/domain/backup';
import { DEFAULT_SETTINGS, DEFAULT_TEMPLATES } from '@/domain/defaults';

import type { Db } from '../db';
import { DATABASE_VERSION, migrateDbIfNeeded } from '../migrations';
import {
    completeOnboarding,
    deleteAllData,
    deleteShift,
    loadAppData,
    loadSettings,
    loadShifts,
    replaceAppData,
    saveSettings,
    saveTemplates,
    upsertShift
} from '../repository';
import { createTestDb } from '../testing/node-sqlite-db';

let db: Db;
beforeEach(async () => {
  db = createTestDb();
  await migrateDbIfNeeded(db);
});

describe('migraciones', () => {
  test('crea el esquema, siembra plantillas y es idempotente', async () => {
    await migrateDbIfNeeded(db);
    expect((await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version'))?.user_version).toBe(DATABASE_VERSION);
    expect((await loadAppData(db)).templates).toEqual(DEFAULT_TEMPLATES);
  });
});

describe('configuración', () => {
  test('sin guardar devuelve los valores por defecto (onboarding pendiente)', async () => {
    const s = await loadSettings(db);
    expect(s).toEqual(DEFAULT_SETTINGS);
    expect(s.onboardingCompletedAt).toBeUndefined();
  });

  test('guarda y actualiza', async () => {
    await saveSettings(db, { ...DEFAULT_SETTINGS, baseSalary: 3_000_000 });
    await saveSettings(db, { ...DEFAULT_SETTINGS, baseSalary: 4_453_128, transportAllowance: { enabled: true, amount: 249_095 } });
    const s = await loadSettings(db);
    expect(s.baseSalary).toBe(4_453_128);
    expect(s.transportAllowance).toEqual({ enabled: true, amount: 249_095 });
  });
});

describe('onboarding', () => {
  test('guarda configuración y selección de plantillas juntas', async () => {
    const settings = { ...DEFAULT_SETTINGS, baseSalary: 3_000_000, onboardingCompletedAt: '2026-10-25T12:00:00Z', legalNoticeAcceptedAt: '2026-10-25T12:00:00Z' };
    await completeOnboarding(db, settings, [DEFAULT_TEMPLATES[1]]);
    expect((await loadAppData(db)).settings).toEqual(settings);
    expect((await loadAppData(db)).templates).toEqual([DEFAULT_TEMPLATES[1]]);
  });

  test('si falla una plantilla no completa el onboarding ni pierde las anteriores', async () => {
    await expect(completeOnboarding(db, { ...DEFAULT_SETTINGS, baseSalary: 1, onboardingCompletedAt: 'x' }, [DEFAULT_TEMPLATES[0], DEFAULT_TEMPLATES[0]])).rejects.toThrow();
    expect((await loadSettings(db)).onboardingCompletedAt).toBeUndefined();
    expect((await loadAppData(db)).templates).toEqual(DEFAULT_TEMPLATES);
  });
});

describe('turnos', () => {
  test('crear, editar, listar ordenado y eliminar', async () => {
    await upsertShift(db, { id: 'b', start: '2026-10-03T18:00', end: '2026-10-04T06:00' });
    await upsertShift(db, { id: 'a', start: '2026-10-01T06:00', end: '2026-10-01T18:00', note: 'día' });
    await upsertShift(db, { id: 'b', start: '2026-10-03T19:00', end: '2026-10-04T06:00' });
    expect(await loadShifts(db)).toEqual([
      { id: 'a', start: '2026-10-01T06:00', end: '2026-10-01T18:00', note: 'día' },
      { id: 'b', start: '2026-10-03T19:00', end: '2026-10-04T06:00' },
    ]);
    await deleteShift(db, 'a');
    expect((await loadShifts(db)).map((s) => s.id)).toEqual(['b']);
  });
});

describe('plantillas', () => {
  test('reemplaza y conserva el orden', async () => {
    await saveTemplates(db, [{ id: 't1', name: 'Medio turno', startTime: '14:00', durationMinutes: 240 }, DEFAULT_TEMPLATES[0]]);
    expect((await loadAppData(db)).templates.map((t) => t.id)).toEqual(['t1', 'tpl-dia']);
  });
});

describe('respaldo y borrado', () => {
  test('exportar → restaurar en un "teléfono nuevo" deja los mismos datos', async () => {
    await saveSettings(db, { ...DEFAULT_SETTINGS, baseSalary: 4_453_128, onboardingCompletedAt: '2026-10-24T10:00:00.000Z' });
    await upsertShift(db, { id: 'a', start: '2026-10-01T06:00', end: '2026-10-01T18:00' });
    const exported = createBackup(await loadAppData(db), '2026-10-24T12:00:00.000Z');

    const nuevo = createTestDb();
    await migrateDbIfNeeded(nuevo);
    const parsed = parseBackup(exported);
    if (!parsed.ok) throw new Error(parsed.error);
    await replaceAppData(nuevo, parsed.backup.data);
    expect(await loadAppData(nuevo)).toEqual(await loadAppData(db));
  });

  test('restaurar es atómico: si falla, no se pierde nada', async () => {
    await upsertShift(db, { id: 'a', start: '2026-10-01T06:00', end: '2026-10-01T18:00' });
    const roto = { settings: DEFAULT_SETTINGS, shifts: [{ id: 'x', start: '2026-10-05T06:00', end: null as unknown as string }], novelties: [], templates: [] };
    await expect(replaceAppData(db, roto)).rejects.toThrow();
    expect((await loadShifts(db)).map((s) => s.id)).toEqual(['a']);
  });

  test('borrar todos mis datos', async () => {
    await saveTemplates(db, []);
    await saveSettings(db, { ...DEFAULT_SETTINGS, baseSalary: 1, onboardingCompletedAt: 'x' });
    await upsertShift(db, { id: 'a', start: '2026-10-01T06:00', end: '2026-10-01T18:00' });
    await deleteAllData(db);
    const d = await loadAppData(db);
    expect(d.shifts).toEqual([]);
    expect(d.settings).toEqual(DEFAULT_SETTINGS);
    expect(d.templates).toEqual(DEFAULT_TEMPLATES);
  });
});
