import { Router } from 'express';

import type { Database } from '../infrastructure/database/database.js';
import type { RedisConnection } from '../infrastructure/redis/redis.js';

export interface Dependencies {
  database: Database;
  redis: RedisConnection;
}

export function createHealthRouter(dependencies: Dependencies): Router {
  const router = Router();

  router.get('/health', (_request, response) => {
    response.status(200).json({ status: 'ok' });
  });

  router.get('/readiness', async (_request, response) => {
    const [database, redis] = await Promise.allSettled([
      dependencies.database.checkConnection(),
      dependencies.redis.checkConnection(),
    ]);

    const services = {
      database: database.status === 'fulfilled' ? 'ok' : 'unavailable',
      redis: redis.status === 'fulfilled' ? 'ok' : 'unavailable',
    };
    const ready = database.status === 'fulfilled' && redis.status === 'fulfilled';

    response.status(ready ? 200 : 503).json({
      status: ready ? 'ready' : 'not_ready',
      services,
    });
  });

  return router;
}
