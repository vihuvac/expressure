/**
 * Required Modules.
 */
import { packageInfo } from '@constants';
import { format } from 'date-fns';
import httpContext from 'express-http-context';
import pino, { type Logger as PinoBaseLogger } from 'pino';

/**
 * @type LogOptions
 * @description Type for object-based logging inputs,
 * allowing arbitrary properties with optional 'message' and 'data' or 'error'.
 */
type LogOptions = {
  message?: string;
  data?: object;
  error?: unknown;
  [key: string]: unknown;
};

/**
 * @type Logger
 * @description type for the structured logger, defining methods for logging and flushing.
 */
type Logger = {
  /**
   * @func info
   * @description Logs an info-level message.
   *
   * @param {string} message The log message.
   *
   * @returns {void}
   */
  info(message: string): void;

  /**
   * @func info
   * @description Logs an info-level message with optional metadata.
   *
   * @param {string} message The log message.
   * @param {object} data    Optional metadata to include in the log.
   *
   * @returns {void}
   */
  info(message: string, data: object): void;

  /**
   * @func info
   * @description Logs an info-level entry using an arbitrary object.
   * If the object contains 'message', it is used as the log message.
   * If it contains 'data', it is merged into the log object.
   *
   * @param {LogOptions} options An arbitrary object for logging.
   *
   * @returns {void}
   */
  info(options: LogOptions): void;

  /**
   * @func warn
   * @description Logs a warning-level message.
   *
   * @param {string} message The log message.
   *
   * @returns {void}
   */
  warn(message: string): void;

  /**
   * @func warn
   * @description Logs a warning-level message with optional metadata.
   *
   * @param {string} message The log message.
   * @param {object} data    Optional metadata to include in the log.
   *
   * @return {void}
   */
  warn(message: string, data: object): void;

  /**
   * @func warn
   * @description Logs a warning-level entry using an arbitrary object.
   * If the object contains 'message', it is used as the log message.
   * If it contains 'data', it is merged into the log object.
   *
   * @param {LogOptions} options An arbitrary object for logging.
   *
   * @return {void}
   */
  warn(options: LogOptions): void;

  /**
   * @func error
   * @description Logs an error-level message.
   *
   * @param {string} message The log message.
   *
   * @return {void}
   */
  error(message: string): void;

  /**
   * @func error
   * @description Logs an error-level message with an optional error object.
   *
   * @param {string} message The log message.
   * @param {object} error   Optional error object to include in the log.
   *
   * @return {void}
   */
  error(message: string, error: unknown): void;

  /**
   * @func error
   * @description Logs an error-level entry using an arbitrary object.
   * If the object contains 'message', it is used as the log message.
   * If it contains 'error', it is serialized as 'error'.
   *
   * @param {LogOptions} options An arbitrary object for logging.
   *
   * @return {void}
   */
  error(options: LogOptions): void;

  /**
   * @func flush
   * @description Flushes buffered logs to ensure all logs are written to the destination.
   *
   * @returns {Promise<void>} Promise that resolves when all logs are flushed, or rejects on error.
   */
  flush(): Promise<void>;
};

/**
 * @typedef {{ serviceName: string, serviceVersion: string }}
 * @constant base
 * @description Base metadata included in all log entries, containing service name and version.
 */
const base = {
  projectName: packageInfo.name,
  projectVersion: packageInfo.version,
};

/**
 * @func mixin
 * @description Dynamically adds request-specific metadata (requestName)
 * from express-http-context to log entries.
 *
 * @returns {{ requestName: (string|undefined) }} Object containing the `requestName` if available,
 * otherwise an empty object.
 */
const mixin = () => {
  const requestName = httpContext.get('requestName');
  return requestName ? { requestName } : {};
};

/**
 * @type {PinoBaseLogger}
 * @constant pinoLogger
 * @description Core Pino logger instance configured for structured JSON output with async logging.
 * Includes custom timestamp, level formatting, and request context integration.
 */
export const pinoLogger: PinoBaseLogger = pino(
  {
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    timestamp: () => `,"time":"${format(new Date(), 'yyyy-MM-dd HH:mm:ss.SSS')}"`,
    formatters: {
      level: (label) => ({ level: label }),
    },
    messageKey: 'message', // Renames 'msg' to 'message' in output
    mixin,
    base,
  },
  pino.destination({
    dest: 1, // stdout
    sync: false, // Async logging for performance; set to true for sync if needed in tests
  }),
);

/**
 * @func createLogHandler
 * @description Creates a logging handler for a specific log level,
 * processing string or object inputs.
 *
 * The returned function handles inputs as follows:
 * - For a string input, it logs the string as the message, with optional metadata if provided.
 * - For an object input, it extracts 'message' (if a string) as the log message, merges 'data'
 *   (if an object) into the log object, and includes other properties (e.g., 'error') as-is.
 *
 * @param {function} logMethod.      Pino logger method (info, warn, or error) to handle logging.
 * @param {string | LogOptions} arg1 Primary input, either a string message or an object
 *        with optional 'message', 'data', 'error', and arbitrary properties.
 * @param {object | unknown} [arg2]  Optional metadata or error object
 *        to include in the log (used only with string arg1).
 *
 * @returns {function} A function that processes logging inputs
 *          and calls the provided logMethod, returning void.
 */
const createLogHandler =
  (logMethod: PinoBaseLogger['info'] | PinoBaseLogger['warn'] | PinoBaseLogger['error']) =>
  (arg1: string | LogOptions, arg2?: object | unknown): void => {
    if (typeof arg1 === 'string') {
      // Handle string message with optional data/error
      if (arg2) {
        logMethod(arg2, arg1);
      } else {
        logMethod(arg1);
      }
    } else {
      // Handle object input
      const { message, data, ...rest } = arg1;
      const logObj =
        data !== null && typeof data === 'object' && !Array.isArray(data)
          ? { ...data, ...rest }
          : { ...rest };
      if (message && typeof message === 'string') {
        logMethod(logObj, message);
      } else {
        logMethod(logObj);
      }
    }
  };

/**
 * @constant logger
 * @description Functional logger object implementing the Logger interface.
 * Uses a frozen object for immutability and supports asynchronous logging with flush.
 * Logs are output in JSON format with service metadata and optional request context.
 * Supports flexible inputs: string messages, messages with data, or arbitrary objects
 * (with optional 'message' and 'data'/'error' extraction and merging).
 *
 * @example
 * import { logger } from './logger';
 *
 * // String-based logging
 * logger.info('Operation started');
 * logger.info('Operation started', { userId: 123 });
 * logger.warn('Potential issue detected');
 * logger.warn('Potential issue detected', { code: 404 });
 * logger.error('Failed to process request');
 * logger.error('Failed to process request', new Error('Database error'));
 *
 * // Object-based logging with 'message' and 'data'/'error'
 * logger.info({ message: 'Create a new payment', data: { amount: 100 } });
 * logger.warn({ message: 'Low balance warning', data: { balance: 10 } });
 * logger.error({ message: 'Payment failed', error: new Error('Invalid card') });
 *
 * // Arbitrary object logging
 * logger.info({ something: 'cool' }); // Logs object with no message
 * logger.info({ message: 'Hello', something: 'cool' }); // Logs with message 'Hello'
 * logger.error({ something: 'wrong' }); // Logs object with no message
 * logger.error({
 *   message: 'Error occurred',
 *   something: 'wrong',
 *   error: new Error('Details'),
 * }); // Logs with message and 'err'
 *
 * // Flush logs during shutdown
 * process.on('SIGTERM', async () => {
 *   await logger.flush();
 *   process.exit(0);
 * });
 */
export const logger: Logger = Object.freeze({
  info: createLogHandler(pinoLogger.info.bind(pinoLogger)),
  warn: createLogHandler(pinoLogger.warn.bind(pinoLogger)),
  error: createLogHandler(pinoLogger.error.bind(pinoLogger)),
  flush(): Promise<void> {
    return new Promise((resolve, reject) => {
      pinoLogger.flush((error?: Error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  },
});

export default logger;

/**
 * @type Logger
 * @description Exported Logger interface for type usage in other modules.
 */
export type { Logger };
