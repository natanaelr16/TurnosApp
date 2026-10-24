import type { SQLiteDatabase } from 'expo-sqlite';

export const DATABASE_NAME = 'turnosapp.db';

/** Subconjunto de la API de expo-sqlite que usa la app (permite probar con SQLite real en Node). */
export type Db = Pick<SQLiteDatabase, 'execAsync' | 'runAsync' | 'getAllAsync' | 'getFirstAsync' | 'withTransactionAsync'>;
