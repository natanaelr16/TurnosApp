/// <reference types="node" />
// Solo para pruebas: adapta el SQLite integrado de Node a la interfaz `Db` de la app.
import { DatabaseSync, type SQLInputValue } from 'node:sqlite';

import type { Db } from '../db';

type Params = SQLInputValue[];
const normalize = (params: unknown[]): Params => (params.length === 1 && Array.isArray(params[0]) ? params[0] : params) as Params;

export function createTestDb(): Db {
  const db = new DatabaseSync(':memory:');
  const adapter = {
    execAsync: async (sql: string) => {
      db.exec(sql);
    },
    runAsync: async (sql: string, ...params: unknown[]) => {
      const r = db.prepare(sql).run(...normalize(params));
      return { lastInsertRowId: Number(r.lastInsertRowid), changes: Number(r.changes) };
    },
    getAllAsync: async (sql: string, ...params: unknown[]) => db.prepare(sql).all(...normalize(params)),
    getFirstAsync: async (sql: string, ...params: unknown[]) => db.prepare(sql).get(...normalize(params)) ?? null,
    withTransactionAsync: async (task: () => Promise<void>) => {
      db.exec('BEGIN');
      try {
        await task();
        db.exec('COMMIT');
      } catch (e) {
        db.exec('ROLLBACK');
        throw e;
      }
    },
  };
  return adapter as unknown as Db;
}
