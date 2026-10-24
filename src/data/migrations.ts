import { DEFAULT_TEMPLATES } from '@/domain/defaults';

import type { Db } from './db';

export const DATABASE_VERSION = 1;

/** Crea/actualiza el esquema según `PRAGMA user_version`. Agregar migraciones como `if (version === N)`. */
export async function migrateDbIfNeeded(db: Db): Promise<void> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let version = row?.user_version ?? 0;
  if (version >= DATABASE_VERSION) return;

  if (version === 0) {
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE settings (
        id INTEGER PRIMARY KEY NOT NULL CHECK (id = 1),
        json TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE TABLE shifts (
        id TEXT PRIMARY KEY NOT NULL,
        start TEXT NOT NULL,
        end TEXT NOT NULL,
        note TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE INDEX idx_shifts_start ON shifts (start);
      CREATE TABLE shift_templates (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        start_time TEXT NOT NULL,
        duration_minutes INTEGER NOT NULL,
        sort_order INTEGER NOT NULL
      );
    `);
    for (const [i, t] of DEFAULT_TEMPLATES.entries()) {
      await db.runAsync(
        'INSERT INTO shift_templates (id, name, start_time, duration_minutes, sort_order) VALUES (?, ?, ?, ?, ?)',
        [t.id, t.name, t.startTime, t.durationMinutes, i],
      );
    }
    version = 1;
  }

  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}
