import { randomUUID } from 'node:crypto';

import type { RequestHandler } from 'express';

const REQUEST_ID_HEADER = 'x-request-id';
const MAX_REQUEST_ID_LENGTH = 128;
const SAFE_REQUEST_ID = /^[A-Za-z0-9._-]+$/;

export const requestIdMiddleware: RequestHandler = (request, response, next) => {
  const incoming = request.header(REQUEST_ID_HEADER);
  const requestId =
    incoming !== undefined &&
    incoming.length <= MAX_REQUEST_ID_LENGTH &&
    SAFE_REQUEST_ID.test(incoming)
      ? incoming
      : randomUUID();

  request.requestId = requestId;
  response.setHeader(REQUEST_ID_HEADER, requestId);
  next();
};
