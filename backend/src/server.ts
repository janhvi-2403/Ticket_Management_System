import { createServer } from 'node:http';

import { createApp } from './app.js';
import { loadConfig } from './config/index.js';
import { PostgresDatabase } from './infrastructure/database/database.js';
import { createLogger } from './infrastructure/logging/logger.js';
import { RedisClient } from './infrastructure/redis/redis.js';

const config = loadConfig();
const logger = createLogger(config);
const database = new PostgresDatabase(config, logger);
const redis = new RedisClient(config, logger);
const app = createApp({ config, database, redis, logger });
const server = createServer(app);
let isShuttingDown = false;

async function shutdown(signal: string): Promise<void> {
  if (isShuttingDown) return;
  isShuttingDown = true;
  logger.info({ signal }, 'Graceful shutdown started');

  const forceExitTimer = setTimeout(() => {
    logger.error('Graceful shutdown timed out');
    process.exit(1);
  }, 10_000);
  forceExitTimer.unref();

  try {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error === undefined ? resolve() : reject(error)));
    });
    await Promise.all([database.close(), redis.close()]);
    logger.info('Graceful shutdown completed');
    process.exitCode = 0;
  } catch (error) {
    logger.error({ err: error }, 'Graceful shutdown failed');
    process.exitCode = 1;
  } finally {
    clearTimeout(forceExitTimer);
  }
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));

async function start(): Promise<void> {
  try {
    await new Promise<void>((resolve, reject) => {
      server.listen(config.PORT, config.HOST, () => resolve());
      server.once('error', reject);
    });
    logger.info({ host: config.HOST, port: config.PORT }, 'HTTP server listening');

    void redis.connect().catch((error: unknown) => {
      logger.error({ err: error }, 'Redis connection failed; readiness will remain unavailable');
    });
  } catch (error) {
    logger.fatal({ err: error }, 'Failed to start server');
    await Promise.allSettled([database.close(), redis.close()]);
    process.exitCode = 1;
  }
}

void start();
