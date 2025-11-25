/**
 * Required modules.
 */
import type { DestinationStream, Logger } from 'pino';

/**
 * @type {Object} MockPino
 * @description A custom mock interface extending Pino's Logger type.
 * Includes mocked versions of key methods and the destination stream.
 *
 * @property {jest.Mocked<DestinationStream>} destination Mocked destination stream for log output.
 * @property {jest.MockedFunction<(cb?: (err?: Error) => void) => void>} flush Mocked flush method
 *           to simulate log flushing.
 */
export type MockPino = Logger & {
  destination: jest.Mocked<DestinationStream>;
  flush: jest.MockedFunction<(cb?: (err?: Error) => void) => void>;
};

/**
 * @type {Object} GlobalMocks
 * @description Type-safe interface for global mock instances created in `jest.setup.ts`.
 * These mocks are stored on `globalThis` to ensure they persist across test executions
 * and are accessible to all test files without recreating them.
 *
 * This is the single source of truth for global mock types used throughout the test suite.
 *
 * @property {MockPino} __MOCK_PINO_LOGGER__ The mocked Pino logger instance that mimics
 *           the actual logger behavior used by `logger.lib.ts` during tests.
 * @property {jest.Mock & { destination: jest.Mock }} __PINO_FACTORY__ The mocked Pino
 *           factory function with an additional destination method. Tracks all calls made
 *           during logger initialization and logger method invocations.
 */
export type GlobalMocks = {
  __MOCK_PINO_LOGGER__: MockPino;
  __PINO_FACTORY__: jest.Mock & { destination: jest.Mock };
};

/**
 * @func createMockPino
 * @description Creates a fully typed Jest mock of a Pino logger.
 *
 * @returns {MockPino} A mock Pino logger with all key methods and destination mocked.
 *
 * @example
 * import { createMockPino } from '@mocks/pino.mock';
 *
 * const logger = createMockPino();
 * logger.info('Hello world');
 * expect(logger.info).toHaveBeenCalledWith('Hello world');
 */
export const createMockPino = (): MockPino => {
  const destinationMock: jest.Mocked<DestinationStream> = {
    write: jest.fn(),
    end: jest.fn(),
    flushSync: jest.fn(),
    fd: 1,
  } as unknown as jest.Mocked<DestinationStream>;

  const logger = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    flush: jest.fn((cb?: (err?: Error) => void) => {
      if (cb) {
        cb();
      }
    }),
    destination: destinationMock,
  } as unknown as MockPino;

  return logger;
};

export default createMockPino;
