import { Pool } from 'pg';

import { env } from '../config/env.js';

let pool: Pool | undefined;

export function getDatabasePool(): Pool {
  if (!env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required for database operations.');
  }

  pool ??= new Pool({
    connectionString: env.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
    ...(env.DATABASE_SSL ? { ssl: { rejectUnauthorized: true } } : {}),
  });

  return pool;
}

export async function checkDatabaseConnection(): Promise<void> {
  await getDatabasePool().query('SELECT 1');
}

export async function closeDatabasePool(): Promise<void> {
  if (!pool) return;
  await pool.end();
  pool = undefined;
}
