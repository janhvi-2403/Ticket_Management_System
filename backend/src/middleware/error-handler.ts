import type { ErrorRequestHandler, RequestHandler } from 'express';
import type { Logger } from 'pino';

import type { AppConfig } from '../config/index.js';
import { HttpError } from '../shared/http-error.js';

export const notFoundHandler: RequestHandler = (request, _response, next) => {
  next(new HttpError(404, 'NOT_FOUND', `Route ${request.method} ${request.path} was not found`));
};

export function createErrorHandler(
  logger: Logger,
  config: Pick<AppConfig, 'NODE_ENV'>,
): ErrorRequestHandler {
  return (error: unknown, request, response, _next) => {
    const knownError = error instanceof HttpError;
    const statusCode = knownError ? error.statusCode : 500;
    const message = knownError
      ? error.message
      : 'An unexpected error occurred';
    const code = knownError ? error.code : 'INTERNAL_SERVER_ERROR';

    if (!knownError || statusCode >= 500) {
      logger.error({ err: error, requestId: request.requestId }, 'Unhandled request error');
    }

    response.status(statusCode).json({
      success: false,
      error: {
        code,
        message: config.NODE_ENV === 'production' && !knownError ? 'An unexpected error occurred' : message,
        requestId: request.requestId,
      },
    });
  };
}
