import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { closeDatabasePool } from './db/pool.js';

const server = createApp().listen(env.PORT, '0.0.0.0', () => {
  logger.info({ port: env.PORT }, 'Grama360 API started');
});

let isShuttingDown = false;

async function shutdown(signal: string): Promise<void> {
  if (isShuttingDown) return;
  isShuttingDown = true;
  logger.info({ signal }, 'Shutting down Grama360 API');

  server.close(async (error) => {
    if (error) logger.error({ err: error }, 'HTTP server shutdown failed');
    await closeDatabasePool();
    process.exit(error ? 1 : 0);
  });
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
