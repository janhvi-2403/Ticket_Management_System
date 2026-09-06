import { createClient, type RedisClientType } from 'redis';
import type { Logger } from 'pino';

import type { AppConfig } from '../../config/index.js';

export interface RedisConnection {
  connect(): Promise<void>;
  checkConnection(): Promise<void>;
  close(): Promise<void>;
}

export class RedisClient implements RedisConnection {
  private readonly client: RedisClientType;

  public constructor(config: Pick<AppConfig, 'REDIS_URL'>, logger: Logger) {
    this.client = createClient({ url: config.REDIS_URL });
    this.client.on('error', (error) => {
      logger.error({ err: error }, 'Redis client error');
    });
  }

  public async connect(): Promise<void> {
    if (!this.client.isOpen) {
      await this.client.connect();
    }
  }

  public async checkConnection(): Promise<void> {
    if (!this.client.isReady) {
      throw new Error('Redis client is not ready');
    }
    await this.client.ping();
  }

  public async close(): Promise<void> {
    if (this.client.isOpen) {
      await this.client.close();
    }
  }
}
