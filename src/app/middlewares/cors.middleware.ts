/**
 * Required Modules.
 */
import config from 'config';
import type { CorsOptions } from 'cors';
import cors from 'cors';
import { StatusCodes } from 'http-status-codes';

type StaticOrigin = boolean | string | RegExp | Array<boolean | string | RegExp>;

type CustomOrigin = (
  requestOrigin: string | undefined,
  callback: (err: Error | null, origin?: StaticOrigin) => void,
) => void;

/**
 * @func formatAcceptedOrigins
 * @description Format the defined URL(s) within the corsOrigin config.
 *
 * @return {Array<string|RegExp>} A list of URLs or regex patterns for CORS verification.
 */
const formatAcceptedOrigins = (): (string | RegExp)[] => {
  const corsOrigin = config.get('corsOrigin');

  if (typeof corsOrigin === 'string') {
    return corsOrigin.split(',').map((url) => {
      const trimmed = url.trim();
      // Check if it's a regex pattern (starts and ends with /)
      if (trimmed.startsWith('/') && trimmed.endsWith('/')) {
        return new RegExp(trimmed.slice(1, -1));
      }
      return trimmed;
    });
  }

  if (Array.isArray(corsOrigin)) {
    return corsOrigin.map((item) => {
      // Check if it's a regex pattern (starts and ends with /)
      if (typeof item === 'string' && item.startsWith('/') && item.endsWith('/')) {
        return new RegExp(item.slice(1, -1));
      }
      return item;
    });
  }

  return [];
};

/**
 * @func originHandler
 * @description Callback function to handle the origin verification.
 *
 * Find out more at:
 * @see [CORS Documentation](https://www.npmjs.com/package/cors)
 *
 * @param {string|undefined} origin The origin URL to be verified.
 * @param {Function} callback       The callback function to be executed.
 *
 * @returns {void} The callback function to be executed.
 */
const originHandler: CustomOrigin = (origin, callback) => {
  const whitelist = formatAcceptedOrigins();
  const isDevelopment = process.env.NODE_ENV === 'development';

  // In development: Allow requests without origin (Postman, curl, etc.).
  if (isDevelopment && !origin) {
    return callback(null, true);
  }

  // Require origin header for security and check whitelist.
  // Check if origin matches any string or regex pattern.
  const isAllowed = whitelist.some((item) => {
    if (item instanceof RegExp) {
      return origin ? item.test(origin) : false;
    }
    return item === origin;
  });

  if (isAllowed) {
    return callback(null, true);
  }

  return callback(new Error(`Origin '${origin}' not allowed by CORS.`));
};

/**
 * @func createCorsOptions
 * @description Creates a set of settings to be passed to the CORS' middleware.
 *
 * @returns {CorsOptions} The CORS options object.
 */
const createCorsOptions = (): CorsOptions => ({
  origin: originHandler,
  methods: ['GET', 'PUT', 'PATCH', 'POST', 'DELETE'],
  allowedHeaders: ['Accept', 'Authorization', 'Content-Type', 'Origin', 'X-Requested-With'],
  optionsSuccessStatus: StatusCodes.OK,
  credentials: true,
});

/**
 * @func getCorsMiddleware
 * @description Creates and returns the CORS middleware instance (factory function).
 *
 * @returns {Function} The CORS middleware instance.
 */
export const getCorsMiddleware = (): ReturnType<typeof cors> => cors(createCorsOptions());

/**
 * @const corsMiddleware
 * @description The CORS middleware instance.
 */
export const corsMiddleware = getCorsMiddleware();

export default corsMiddleware;
