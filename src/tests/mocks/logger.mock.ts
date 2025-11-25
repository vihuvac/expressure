/**
 * Required Modules.
 */
import type { GlobalMocks } from '@mocks/pino.mock';
import httpContext from 'express-http-context';

/**
 * @func getGlobalMocks
 * @description Retrieves the global mock instances created during `jest.setup.ts` initialization.
 *
 * This function provides type-safe access to mock instances that are stored on
 * `globalThis`. It ensures that test assertions operate on the SAME mock instances
 * that `logger.lib.ts` uses, guaranteeing test accuracy and preventing mismatches
 * between mocked and actual logger behavior.
 *
 * @returns {GlobalMocks} An object containing:
 *          - __MOCK_PINO_LOGGER__: The mocked Pino logger instance
 *          - __PINO_FACTORY__: The mocked Pino factory function with call history
 * @throws {Error} If mock instances are not found, indicating jest.setup.ts was not loaded
 *
 * @example
 * const { __MOCK_PINO_LOGGER__, __PINO_FACTORY__ } = getGlobalMocks();
 * expect(__MOCK_PINO_LOGGER__.info).toHaveBeenCalled();
 */
export const getGlobalMocks = (): GlobalMocks => {
  const globals = globalThis as unknown as GlobalMocks;

  if (!globals.__MOCK_PINO_LOGGER__ || !globals.__PINO_FACTORY__) {
    throw new Error('Mock instances not found. Ensure jest.setup.ts is loaded.');
  }

  return globals;
};

/**
 * @constant mockPinoLogger
 * @description Reference to the mocked Pino logger instance from global scope.
 * This is the actual logger mock used by `logger.lib.ts` during test execution.
 *
 * Contains mock implementations of logger methods with Jest mock capabilities:
 * - info(): Logs info-level messages
 * - warn(): Logs warning-level messages
 * - error(): Logs error-level messages
 * - flush(): Flushes pending logs to storage
 *
 * The methods are cast to jest.Mock to provide access to Jest mock methods like mockClear().
 *
 * @see getGlobalMocks
 */
export const mockPinoLogger = getGlobalMocks().__MOCK_PINO_LOGGER__ as unknown as {
  info: jest.Mock;
  warn: jest.Mock;
  error: jest.Mock;
  flush: jest.Mock;
};

/**
 * @constant {jest.Mocked<typeof httpContext>} httpContextMock
 * @description Type-safe reference to the mocked `express-http-context` module.
 *
 * Allows tests to mock HTTP context values that would normally be set by
 * Express middleware. Used to simulate request-scoped context like request names
 * that are stored in httpContext and retrieved by the logger's mixin function.
 *
 * @example
 * httpContextMock.get.mockReturnValue('request-name');
 */
const httpContextMock = httpContext as jest.Mocked<typeof httpContext>;

/**
 * @func setHttpContext
 * @description Sets the HTTP context request name for the current test.
 *
 * This helper function configures the mocked `express-http-context` to return
 * a specific request name. The logger's mixin function will include this name
 * in log entries, allowing tests to verify that request context is properly
 * attached to logs.
 *
 * @param {string | undefined} requestName The request name to set in HTTP context.
 *        Pass undefined to clear the request name (default test state).
 * @returns {void}
 *
 * @example
 * // Set request name for logging context
 * setHttpContext('create-payment');
 * logger.info('Processing payment');
 *
 * // Clear request name
 * setHttpContext(undefined);
 *
 * @see httpContextMock
 */
export const setHttpContext = (requestName: string | undefined): void => {
  httpContextMock.get.mockReturnValue(requestName);
};
