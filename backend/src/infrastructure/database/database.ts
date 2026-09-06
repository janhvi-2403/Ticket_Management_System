import { Pool, type QueryResultRow } from 'pg';
import type { Logger } from 'pino';

import type { AppConfig } from '../../config/index.js';

export interface Database {
  checkConnection(): Promise<void>;
  close(): Promise<void>;
}

export class PostgresDatabase implements Database {
  private readonly pool: Pool;

  public constructor(
    config: Pick<AppConfig, 'DATABASE_URL' | 'DATABASE_POOL_MAX'>,
    logger: Logger,
  ) {
    this.pool = new Pool({
      connectionString: config.DATABASE_URL,
      max: config.DATABASE_POOL_MAX,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
    });
    this.pool.on('error', (error) => {
      logger.error({ err: error }, 'PostgreSQL pool error');
    });
  }

  public async query<Row extends QueryResultRow>(text: string, values: unknown[] = []) {
    return this.pool.query<Row>(text, values);
  }

  public async checkConnection(): Promise<void> {
    await this.pool.query('SELECT 1');
  }

  public async close(): Promise<void> {
    await this.pool.end();
  }
}
