/**
 * @ignore
 * Required modules.
 */
import { createMockPino, type GlobalMocks } from '@mocks/pino.mock';

/**
 * Mock pino at the global level before any application code loads.
 * This factory function will be called when `logger.lib.ts` requires `pino`.
 *
 * IMPORTANT: We store references globally so they persist across test runs
 * and are not recreated by `jest.mock()` on each test execution.
 */
jest.mock('pino', () => {
  // Create a single mock logger instance that will be reused
  const mockLogger = createMockPino();

  // Create the factory function
  const pinoFactory = jest.fn(() => mockLogger) as jest.Mock & {
    destination: jest.Mock;
  };

  pinoFactory.destination = jest.fn(() => ({
    write: jest.fn(),
    end: jest.fn(),
    on: jest.fn(),
  }));

  // Store references on global so tests can access the same instances
  // These will NOT be cleared by jest.clearAllMocks() in beforeEach
  const globals = globalThis as unknown as GlobalMocks;
  globals.__MOCK_PINO_LOGGER__ = mockLogger;
  globals.__PINO_FACTORY__ = pinoFactory;

  return pinoFactory;
});
