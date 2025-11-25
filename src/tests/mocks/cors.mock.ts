/**
 * Required Modules.
 */
import { getCorsMiddleware } from '@middlewares/cors.middleware';
import config from 'config';
import type { CorsOptions } from 'cors';
import cors from 'cors';

/**
 * @callback CustomOrigin
 * @description The shape of the custom origin callback used by the CORS middleware.
 *
 * @param {string|undefined} requestOrigin The value of the `Origin` request header.
 * @param {(err: Error|null, allow?: boolean) => void} callback Completion callback.
 *
 * @returns {void}
 */
export type CustomOrigin = (
  requestOrigin: string | undefined,
  callback: (err: Error | null, origin?: boolean) => void,
) => void;

/**
 * @type {Object} MockSetup
 * {@link setupCorsMock | Return type of setupCorsMock}.
 *
 * @property {ReturnType<typeof cors>} middleware
 * The Express middleware function returned by `cors(options)`.
 * @property {CorsOptions & { origin: CustomOrigin }} options
 * The options object that was passed to the mocked `cors()`.
 * @property {jest.Mock} handler
 * The Jest mock function that `cors()` returns.
 */
export type MockSetup = {
  middleware: ReturnType<typeof cors>;
  options: CorsOptions & { origin: CustomOrigin };
  handler: jest.Mock;
};

/**
 * @constant mockConfig
 * @description Mocked `config` module.
 * Use this to set up `config.get()` return values in tests.
 *
 * @returns {jest.Mocked<typeof config>} The mocked config module.
 */
export const mockConfig = config as jest.Mocked<typeof config>;

/**
 * @constant mockCors
 * @description Mocked `cors` factory function.
 * Use `mockCors.mockReturnValue(...)` to control what the factory returns.
 *
 * @returns {jest.MockedFunction<typeof cors>} The mocked cors function.
 */
export const mockCors = cors as jest.MockedFunction<typeof cors>;

/**
 * @func setupCorsMock
 * @description Creates a fresh CORS middleware instance with the current mocks.
 *
 * **Why a helper?**
 * The middleware is built by calling `cors(options)`. In tests we need to:
 * 1. Mock `cors()` **before** it is called.
 * 2. Capture the `options` that were passed to it.
 *
 * `setupCorsMock()` does both in one call and returns everything you need.
 *
 * @returns {MockSetup} Frozen object containing the middleware, options, and mock handler.
 *
 * @example
 * const { middleware, options, handler } = setupCorsMock();
 * // `options` is the exact object that was passed to the mocked `cors()`
 */
export const setupCorsMock = (): MockSetup => {
  // Prepare the mock return value
  const handler = jest.fn();
  mockCors.mockReturnValue(handler);

  // Call the factory (this triggers the mocked `cors()`)
  const middleware = getCorsMiddleware();

  // Grab the options that were passed to the mock
  const options = mockCors.mock.calls[0][0] as CorsOptions & {
    origin: CustomOrigin;
  };

  // Freeze to prevent accidental mutation in tests
  return Object.freeze({
    middleware,
    options,
    handler,
  });
};

/**
 * @func invokeOrigin
 * @description Invokes the custom origin handler and returns the callback mock.
 *
 * @param {string|undefined} origin      The origin header value to test.
 * @param {MockSetup['options']} options The `options` object returned by {@link setupCorsMock}.
 *
 * @returns {jest.Mock} The Jest mock that was passed as the callback.
 *
 * @example
 * const callback = invokeOrigin('https://example.com', options);
 * expect(callback).toHaveBeenCalledWith(null, true);
 */
export const invokeOrigin = (
  origin: string | undefined,
  options: MockSetup['options'],
): jest.Mock => {
  const callback = jest.fn();
  options.origin(origin, callback);
  return callback;
};
