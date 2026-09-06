import { describe, expect, it } from 'vitest';

import { loadConfig } from '../src/config/index.js';

describe('configuration', () => {
  it('rejects missing required connection settings', () => {
    expect(() => loadConfig({ NODE_ENV: 'test' })).toThrow('Invalid environment configuration');
  });

  it('parses valid configuration', () => {
    const config = loadConfig({
      NODE_ENV: 'test',
      DATABASE_URL: 'postgresql://localhost:5432/ticket_saas',
      REDIS_URL: 'redis://localhost:6379',
    });

    expect(config.PORT).toBe(3000);
    expect(config.NODE_ENV).toBe('test');
  });
});
