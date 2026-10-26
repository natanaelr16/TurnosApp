import { createBackup, parseBackup } from '@/domain/backup';
import { DEFAULT_SETTINGS } from '@/domain/defaults';
import type { Novelty, Shift } from '@/domain/types';
import { migrateDbIfNeeded } from '../migrations';
import { deleteAllData, deleteNovelty, loadAppData, replaceAppData, saveRecord, upsertNovelty, upsertShift } from '../repository';
import { createTestDb } from '../testing/node-sqlite-db';

const shift: Shift = { id: 's', start: '2026-10-25T18:00', end: '2026-10-26T06:00', fields: [{ name: 'Grúa', value: 'RTG19' }, { name: 'Movimientos', value: 42 }] };
const rest: Novelty = { id: 'n', date: '2026-10-26', kind: 'rest', note: 'Descanso remunerado' };

async function database() { const db = createTestDb(); await migrateDbIfNeeded(db); return db; }

test('guarda campos y novedades, conserva tipos y permite editar/eliminar', async () => {
  const db = await database();
  await upsertShift(db, shift);
  await upsertNovelty(db, rest);
  expect((await loadAppData(db)).shifts).toEqual([shift]);
  expect((await loadAppData(db)).novelties).toEqual([rest]);
  await upsertNovelty(db, { ...rest, kind: 'sick' });
  expect((await loadAppData(db)).novelties[0].kind).toBe('sick');
  await deleteNovelty(db, rest.id);
  expect((await loadAppData(db)).novelties).toEqual([]);
});

test('guardado validado rechaza superposiciones y conflictos sin perder registros', async () => {
  const db = await database();
  await saveRecord(db, { shift });
  await expect(saveRecord(db, { shift: { ...shift, id: 'other' } })).rejects.toThrow();
  await expect(saveRecord(db, { novelty: { ...rest, date: '2026-10-25' } })).rejects.toThrow();
  await saveRecord(db, { novelty: rest });
  await expect(saveRecord(db, { shift: { id: 'other', start: '2026-10-26T08:00', end: '2026-10-26T12:00' } })).rejects.toThrow();
  expect((await loadAppData(db)).shifts).toEqual([shift]);
  expect((await loadAppData(db)).novelties).toEqual([rest]);
});

test('respaldo nuevo conserva campos/novedades y borrar todo los limpia', async () => {
  const db = await database();
  await upsertShift(db, shift); await upsertNovelty(db, rest);
  const data = await loadAppData(db);
  const parsed = parseBackup(createBackup(data, '2026-10-25T12:00:00Z'));
  if (!parsed.ok) throw new Error(parsed.error);
  const other = await database();
  await replaceAppData(other, parsed.backup.data);
  expect(await loadAppData(other)).toEqual(data);
  await deleteAllData(db);
  expect((await loadAppData(db)).novelties).toEqual([]);
});

test('migración desde esquema 1 conserva turnos, configuración y plantillas', async () => {
  const db = createTestDb();
  await db.execAsync(`CREATE TABLE shifts (id TEXT PRIMARY KEY NOT NULL, start TEXT NOT NULL, end TEXT NOT NULL, note TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
    CREATE TABLE settings (id INTEGER PRIMARY KEY, json TEXT NOT NULL, updated_at TEXT NOT NULL);
    CREATE TABLE shift_templates (id TEXT PRIMARY KEY, name TEXT NOT NULL, start_time TEXT NOT NULL, duration_minutes INTEGER NOT NULL, sort_order INTEGER NOT NULL);
    INSERT INTO shifts VALUES ('old', '2026-10-01T06:00', '2026-10-01T18:00', 'original', 'x', 'x');
    INSERT INTO shift_templates VALUES ('custom', 'Personalizada', '14:00', 240, 0);
    PRAGMA user_version = 1;`);
  await db.runAsync('INSERT INTO settings VALUES (1, ?, ?)', [JSON.stringify(DEFAULT_SETTINGS), 'x']);
  await migrateDbIfNeeded(db); await migrateDbIfNeeded(db);
  const data = await loadAppData(db);
  expect(data.shifts).toEqual([{ id: 'old', start: '2026-10-01T06:00', end: '2026-10-01T18:00', note: 'original' }]);
  expect(data.novelties).toEqual([]);
  expect(data.settings).toEqual(DEFAULT_SETTINGS);
  expect(data.templates).toEqual([{ id: 'custom', name: 'Personalizada', startTime: '14:00', durationMinutes: 240 }]);
});
