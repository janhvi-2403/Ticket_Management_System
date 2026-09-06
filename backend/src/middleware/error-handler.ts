import type { ErrorRequestHandler, RequestHandler } from 'express';
import type { Logger } from 'pino';

import { HttpError } from '../shared/http-error.js';

interface HttpStatusError extends Error {
  status: number;
  type?: string;
}

function isHttpStatusError(error: unknown): error is HttpStatusError {
  return (
    error instanceof Error &&
    'status' in error &&
    typeof error.status === 'number' &&
    error.status >= 400 &&
    error.status < 500
  );
}

export const notFoundHandler: RequestHandler = (request, _response, next) => {
  next(new HttpError(404, 'NOT_FOUND', `Route ${request.method} ${request.path} was not found`));
};

export function createErrorHandler(logger: Logger): ErrorRequestHandler {
  return (error: unknown, request, response, _next) => {
    const applicationError = error instanceof HttpError ? error : undefined;
    const clientError = isHttpStatusError(error) ? error : undefined;
    const knownError = applicationError !== undefined || clientError !== undefined;
    const statusCode = applicationError?.statusCode ?? clientError?.status ?? 500;
    const code = applicationError?.code ?? (statusCode === 413 ? 'PAYLOAD_TOO_LARGE' : 'BAD_REQUEST');
    const message = applicationError?.message ??
      (statusCode === 413 ? 'Request body is too large' : 'Invalid request body');

    if (!knownError || statusCode >= 500) {
      logger.error({ err: error, requestId: request.requestId }, 'Unhandled request error');
    }

    response.status(statusCode).json({
      success: false,
      error: {
        code,
        message: knownError ? message : 'An unexpected error occurred',
        requestId: request.requestId,
      },
    });
  };
}
