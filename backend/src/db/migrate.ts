import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

import type { PoolClient } from 'pg';

import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { getDatabasePool } from './pool.js';

const migrationsDirectory = path.join(process.cwd(), 'src', 'db', 'migrations');
const migrationLockId = 36_003_601;

async function ensureMigrationsTable(client: PoolClient): Promise<void> {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function runMigrations(): Promise<void> {
  if (!env.DATABASE_URL) {
    throw new Error('DATABASE_URL must be configured before running migrations.');
  }

  const pool = getDatabasePool();
  const client = await pool.connect();

  try {
    await client.query('SELECT pg_advisory_lock($1)', [migrationLockId]);
    await ensureMigrationsTable(client);

    const files = (await readdir(migrationsDirectory))
      .filter((file) => file.endsWith('.sql'))
      .sort();

    for (const filename of files) {
      const alreadyApplied = await client.query<{ filename: string }>(
        'SELECT filename FROM schema_migrations WHERE filename = $1',
        [filename],
      );
      if (alreadyApplied.rowCount) continue;

      const sql = await readFile(path.join(migrationsDirectory, filename), 'utf8');
      logger.info({ migration: filename }, 'Applying database migration');

      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [filename]);
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    }

    logger.info({ count: files.length }, 'Database migrations complete');
  } finally {
    try {
      await client.query('SELECT pg_advisory_unlock($1)', [migrationLockId]);
    } finally {
      client.release();
      await pool.end();
    }
  }
}

runMigrations().catch((error: unknown) => {
  logger.error({ err: error }, 'Database migrations failed');
  process.exitCode = 1;
});
