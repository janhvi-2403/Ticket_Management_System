import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import pino from 'pino';

import { createApp } from '../src/app.js';
import type { Database } from '../src/infrastructure/database/database.js';
import type { RedisConnection } from '../src/infrastructure/redis/redis.js';

function createTestApp(database: Database, redis: RedisConnection) {
  return createApp({
    config: { NODE_ENV: 'test', CORS_ORIGIN: undefined },
    database,
    redis,
    logger: pino({ enabled: false }),
  });
}

function healthyDatabase(): Database {
  return { checkConnection: vi.fn().mockResolvedValue(undefined), close: vi.fn().mockResolvedValue(undefined) };
}

function healthyRedis(): RedisConnection {
  return {
    connect: vi.fn().mockResolvedValue(undefined),
    checkConnection: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
  };
}

describe('runtime foundation', () => {
  it('serves the liveness endpoint without checking dependencies', async () => {
    const database = healthyDatabase();
    const redis = healthyRedis();
    const response = await request(createTestApp(database, redis)).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
    expect(database.checkConnection).not.toHaveBeenCalled();
    expect(redis.checkConnection).not.toHaveBeenCalled();
  });

  it('reports ready when dependencies are healthy', async () => {
    const response = await request(createTestApp(healthyDatabase(), healthyRedis())).get('/readiness');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: 'ready',
      services: { database: 'ok', redis: 'ok' },
    });
  });

  it('reports unavailable dependencies without exposing their errors', async () => {
    const database: Database = {
      checkConnection: vi.fn().mockRejectedValue(new Error('connection details')),
      close: vi.fn().mockResolvedValue(undefined),
    };
    const response = await request(createTestApp(database, healthyRedis())).get('/readiness');

    expect(response.status).toBe(503);
    expect(response.body).toEqual({
      status: 'not_ready',
      services: { database: 'unavailable', redis: 'ok' },
    });
  });

  it('returns and preserves valid request IDs', async () => {
    const app = createTestApp(healthyDatabase(), healthyRedis());
    const generated = await request(app).get('/health');
    const provided = await request(app).get('/health').set('X-Request-Id', 'gateway-request-42');

    expect(generated.headers['x-request-id']).toMatch(/^[0-9a-f-]{36}$/);
    expect(provided.headers['x-request-id']).toBe('gateway-request-42');
  });

  it('uses a consistent error response for unknown routes', async () => {
    const response = await request(createTestApp(healthyDatabase(), healthyRedis())).get('/missing');

    expect(response.status).toBe(404);
    expect(response.body.error).toMatchObject({ code: 'NOT_FOUND' });
    expect(response.body.error.requestId).toBe(response.headers['x-request-id']);
  });

  it('returns a client error for malformed JSON', async () => {
    const response = await request(createTestApp(healthyDatabase(), healthyRedis()))
      .post('/health')
      .set('Content-Type', 'application/json')
      .send('{');

    expect(response.status).toBe(400);
    expect(response.body.error).toMatchObject({ code: 'BAD_REQUEST', message: 'Invalid request body' });
    expect(response.body.error.requestId).toBe(response.headers['x-request-id']);
  });
});
