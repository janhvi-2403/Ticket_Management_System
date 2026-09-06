import pino, { type Logger } from 'pino';

import type { AppConfig } from '../../config/index.js';

export function createLogger(config: Pick<AppConfig, 'LOG_LEVEL' | 'NODE_ENV'>): Logger {
  const options = {
    level: config.LOG_LEVEL,
    redact: {
      paths: [
        'req.headers.authorization',
        'req.headers.cookie',
        '*.password',
        '*.token',
        '*.secret',
      ],
      censor: '[REDACTED]',
    },
  };

  if (config.NODE_ENV === 'development') {
    return pino({
      ...options,
      transport: { target: 'pino-pretty', options: { colorize: true } },
    });
  }

  return pino(options);
}
