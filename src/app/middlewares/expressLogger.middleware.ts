/**
 * Required Modules.
 */
import { pinoLogger } from '@libs';
import type { Request, Response } from 'express';
import httpContext from 'express-http-context';
import pinoHttp, { type HttpLogger } from 'pino-http';

/**
 * @type ResponseLocals
 * @description Type for Express response locals,
 * including optional error from error-catching middleware.
 */
export type ResponseLocals = {
  error?: Error;
};

/**
 * @type PinoResponse
 * @description Custom response type extending Express Response
 * with pino-http's responseTime property.
 */
export type PinoResponse = Response<ResponseLocals> & {
  responseTime?: number;
};

/**
 * @function expressLogger
 * @description Customized Pino HTTP logger middleware for Express.
 * Logs HTTP requests with structured JSON output, including:
 * - Request metadata: headers, query, and body.
 * - Custom metadata: type ('http_request'), route, and error
 * (for status codes ≥ 400, from res.locals.error).
 * - Request name set in express-http-context for correlation with other logs.
 * - Skips logging for health check routes (`/api/v1/health/readiness`, `/api/v1/health/liveness`).
 * - Formats log messages to mimic express-winston's expressFormat
 * (e.g., "GET /path 200 123ms - 456b").
 *
 * @returns {HttpLogger<Reqquest, Response>} Express middleware function that logs HTTP requests.
 *
 * @example
 * import express from 'express';
 * import { expressLogger } from './expressLogger';
 *
 * const app = express();
 * app.use(express.json());
 * app.use(expressLogger);
 * app.get('/api/v1/test', (req, res) => res.json({ message: 'Test' }));
 *
 * // Example log output for a GET request to /api/v1/test:
 * {
 *   "level": "info",
 *   "time": "2025-10-22 13:58:00.123",
 *   "serviceName": "your-service",
 *   "serviceVersion": "1.0.0",
 *   "requestName": "GET - /api/v1/test",
 *   "type": "http_request",
 *   "route": "/api/v1/test",
 *   "req": {
 *     "headers": { ... },
 *     "query": {},
 *     "body": {}
 *   },
 *   "res": {
 *     "statusCode": 200
 *   },
 *   "message": "GET /api/v1/test 200 123ms - 456b"
 * }
 *
 * // Example log output for a failed request (status 400):
 * {
 *   "level": "error",
 *   "time": "2025-10-22 13:58:00.123",
 *   "serviceName": "your-service",
 *   "serviceVersion": "1.0.0",
 *   "requestName": "POST - /api/v1/error",
 *   "type": "http_request",
 *   "route": "/api/v1/error",
 *   "req": {
 *     "headers": { ... },
 *     "query": {},
 *     "body": { ... }
 *   },
 *   "res": {
 *     "statusCode": 400
 *   },
 *   "error": {
 *     "type": "Error",
 *     "message": "Bad Request",
 *     "stack": "..."
 *   },
 *   "message": "POST /api/v1/error 400 123ms - 456b"
 * }
 */
export const expressLogger: HttpLogger<Request, Response> = pinoHttp<Request, Response>({
  logger: pinoLogger,
  autoLogging: {
    ignore: (req: Request) =>
      ['/api/v1/health/readiness', '/api/v1/health/liveness'].includes(req.url),
  },
  customLogLevel: (_req: Request, res: Response<ResponseLocals>, _error?: Error) =>
    res.statusCode >= 400 ? 'error' : 'info',
  serializers: {
    req: (req: Request) => ({
      headers: req.headers,
      query: req.query,
      body: req.body,
    }),
    res: (res: PinoResponse) => ({
      statusCode: res.statusCode,
    }),
    err: (error: Error) => ({
      type: error.name,
      message: error.message,
      stack: error.stack,
    }),
  },
  customProps: (req: Request, res: PinoResponse) => {
    const meta: Record<string, unknown> = {
      type: 'http_request',
      route: req.route ? req.route.path : 'N/A',
    };

    if (req.route) {
      httpContext.set('requestName', `${req.method} - ${req.baseUrl}${req.route.path}`);
    }

    if (res.statusCode >= 400) {
      meta.error = res.locals.error || new Error(res.statusMessage || 'Request failed');
    }

    return meta;
  },
  customSuccessMessage: (req: Request, res: PinoResponse) => {
    const time = res.responseTime ? `${res.responseTime}ms` : '0ms';
    const size = res.getHeader('Content-Length') || '0b';
    return `${req.method} ${req.url} ${res.statusCode} ${time} - ${size}`;
  },
  customErrorMessage: (req: Request, res: PinoResponse) => {
    const time = res.responseTime ? `${res.responseTime}ms` : '0ms';
    const size = res.getHeader('Content-Length') || '0b';
    return `${req.method} ${req.url} ${res.statusCode} ${time} - ${size}`;
  },
});

export default expressLogger;
