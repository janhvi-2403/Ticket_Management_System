import type { RequestHandler } from 'express';
import type { Logger } from 'pino';

export function createRequestLogger(logger: Logger): RequestHandler {
  return (request, response, next) => {
    const start = process.hrtime.bigint();
    response.on('finish', () => {
      const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;
      logger.info(
        {
          requestId: request.requestId,
          method: request.method,
          route: request.route?.path ?? request.path,
          statusCode: response.statusCode,
          durationMs: Math.round(durationMs * 100) / 100,
        },
        'HTTP request completed',
      );
    });
    next();
  };
}
