import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import type { Logger } from 'pino';

import type { AppConfig } from './config/index.js';
import { createErrorHandler, notFoundHandler } from './middleware/error-handler.js';
import { createRequestLogger } from './middleware/request-logger.js';
import { requestIdMiddleware } from './middleware/request-id.js';
import { createHealthRouter, type Dependencies } from './routes/health.js';

export interface CreateAppOptions extends Dependencies {
  config: Pick<AppConfig, 'NODE_ENV' | 'CORS_ORIGIN'>;
  logger: Logger;
}

export function createApp(options: CreateAppOptions): Express {
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(
    cors({
      origin: options.config.CORS_ORIGIN ?? false,
      credentials: false,
    }),
  );
  app.use(express.json({ limit: '100kb' }));
  app.use(express.urlencoded({ extended: false, limit: '100kb' }));
  app.use(requestIdMiddleware);
  app.use(createRequestLogger(options.logger));
  app.use(createHealthRouter(options));
  app.use(notFoundHandler);
  app.use(createErrorHandler(options.logger, options.config));

  return app;
}
