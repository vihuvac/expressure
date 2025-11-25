/**
 * Required Modules.
 */
import { logger } from '@libs/logger.lib';
import { getGlobalMocks, mockPinoLogger, setHttpContext } from '@mocks/logger.mock';

jest.mock('date-fns', () => ({
  format: jest.fn(() => '2023-01-01 12:00:00.000'),
}));

jest.mock('express-http-context');

describe('logger.lib', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    // Clear only the mockPinoLogger method calls, NOT pinoFactory calls
    // pinoFactory calls happen during module load and should be preserved
    mockPinoLogger.info.mockClear();
    mockPinoLogger.warn.mockClear();
    mockPinoLogger.error.mockClear();
    mockPinoLogger.flush.mockClear();
    setHttpContext(undefined);
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  // #region logger.info Tests
  describe('logger.info', () => {
    it('logs a string message', () => {
      // Arrange
      const message = 'User login successful';

      // Act
      logger.info(message);

      // Assert
      expect(mockPinoLogger.info).toHaveBeenCalledWith(message);
    });

    it('logs a string message with data object', () => {
      // Arrange
      const message = 'Payment processed';
      const data = { amount: 99.99, currency: 'USD' };

      // Act
      logger.info(message, data);

      // Assert
      expect(mockPinoLogger.info).toHaveBeenCalledWith(data, message);
    });

    it('logs object with message, data, and extra fields', () => {
      // Arrange
      const input = {
        message: 'Order created',
        data: { orderId: 'ORD-123', total: 150 },
        userId: 456,
      };

      // Act
      logger.info(input);

      // Assert
      expect(mockPinoLogger.info).toHaveBeenCalledWith(
        { orderId: 'ORD-123', total: 150, userId: 456 },
        'Order created',
      );
    });

    it('logs object without message as payload', () => {
      // Arrange
      const input = { event: 'click', element: 'button' };

      // Act
      logger.info(input);

      // Assert
      expect(mockPinoLogger.info).toHaveBeenCalledWith(input);
    });

    it('logs object with message but no data', () => {
      // Arrange
      const input = { message: 'Session started', sessionId: 'abc123' };

      // Act
      logger.info(input);

      // Assert
      expect(mockPinoLogger.info).toHaveBeenCalledWith({ sessionId: 'abc123' }, 'Session started');
    });

    it('includes requestName from httpContext when available', () => {
      // Arrange
      const requestName = 'create-payment';
      setHttpContext(requestName);
      const message = 'Processing payment';

      // Act
      logger.info(message);

      // Assert
      expect(mockPinoLogger.info).toHaveBeenCalledWith(message);
    });
  });
  // #endregion

  // #region logger.warn Tests
  describe('logger.warn', () => {
    it('logs a warning string', () => {
      // Arrange
      const message = 'High memory usage';

      // Act
      logger.warn(message);

      // Assert
      expect(mockPinoLogger.warn).toHaveBeenCalledWith(message);
    });

    it('logs a warning with metadata', () => {
      // Arrange
      const message = 'Cache miss';
      const data = { key: 'user:123', ttl: 3600 };

      // Act
      logger.warn(message, data);

      // Assert
      expect(mockPinoLogger.warn).toHaveBeenCalledWith(data, message);
    });

    it('logs warning object with message and data', () => {
      // Arrange
      const input = {
        message: 'Rate limit approaching',
        data: { endpoint: '/api/v1/users', calls: 980 },
        threshold: 1000,
      };

      // Act
      logger.warn(input);

      // Assert
      expect(mockPinoLogger.warn).toHaveBeenCalledWith(
        { endpoint: '/api/v1/users', calls: 980, threshold: 1000 },
        'Rate limit approaching',
      );
    });

    it('logs warning object without message', () => {
      // Arrange
      const input = { retryCount: 3, delay: 500 };

      // Act
      logger.warn(input);

      // Assert
      expect(mockPinoLogger.warn).toHaveBeenCalledWith(input);
    });
  });
  // #endregion

  // #region logger.error Tests
  describe('logger.error', () => {
    it('logs an error string', () => {
      // Arrange
      const message = 'Database connection failed';

      // Act
      logger.error(message);

      // Assert
      expect(mockPinoLogger.error).toHaveBeenCalledWith(message);
    });

    it('logs an error with error object', () => {
      // Arrange
      const message = 'Failed to save user';
      const error = new Error('Unique constraint violation');

      // Act
      logger.error(message, error);

      // Assert
      expect(mockPinoLogger.error).toHaveBeenCalledWith(error, message);
    });

    it('logs error object with message and error', () => {
      // Arrange
      const error = new Error('Network timeout');
      const input = {
        message: 'API call failed',
        error,
        url: 'https://api.example.com/data',
        method: 'POST',
      };

      // Act
      logger.error(input);

      // Assert
      expect(mockPinoLogger.error).toHaveBeenCalledWith(
        { url: input.url, method: input.method, error },
        'API call failed',
      );
    });

    it('logs error object without message', () => {
      // Arrange
      const error = new Error('Invalid token');
      const input = { error, code: 401, path: '/auth' };

      // Act
      logger.error(input);

      // Assert
      expect(mockPinoLogger.error).toHaveBeenCalledWith({ code: 401, path: '/auth', error });
    });

    it('logs non-Error error field', () => {
      // Arrange
      const error = { code: 'VALIDATION_ERROR', details: ['email required'] };
      const input = { error, context: 'signup' };

      // Act
      logger.error(input);

      // Assert
      expect(mockPinoLogger.error).toHaveBeenCalledWith({ context: 'signup', error });
    });
  });
  // #endregion

  // #region logger.flush Tests
  describe('logger.flush', () => {
    it('resolves when flush succeeds (callback called with no error)', async () => {
      // Arrange
      (mockPinoLogger.flush as unknown as jest.Mock).mockImplementationOnce(
        (cb?: (err?: Error) => void) => {
          if (cb) {
            cb();
          }
        },
      );

      // Act
      const result = logger.flush();

      // Assert
      await expect(result).resolves.toBeUndefined();
      expect(mockPinoLogger.flush).toHaveBeenCalledTimes(1);
    });

    it('rejects when flush fails', async () => {
      // Arrange
      const flushError = new Error('Disk full');
      (mockPinoLogger.flush as unknown as jest.Mock).mockImplementationOnce(
        (cb?: (err?: Error) => void) => {
          if (cb) {
            cb(flushError);
          }
        },
      );

      // Act
      const result = logger.flush();

      // Assert
      await expect(result).rejects.toThrow(flushError);
      expect(mockPinoLogger.flush).toHaveBeenCalledTimes(1);
    });

    it('rejects with specific error when flush operation fails', async () => {
      // Arrange
      const specificError = new Error('I/O error: write failed');
      (mockPinoLogger.flush as unknown as jest.Mock).mockImplementationOnce(
        (cb?: (err?: Error) => void) => {
          if (cb) {
            cb(specificError);
          }
        },
      );

      // Act
      const result = logger.flush();

      // Assert
      await expect(result).rejects.toStrictEqual(specificError);
    });
  });
  // #endregion

  // #region pinoLogger configuration Tests
  describe('pinoLogger configuration', () => {
    it('creates pino logger with correct configuration', () => {
      // Arrange
      const factory = getGlobalMocks().__PINO_FACTORY__;

      // Act

      // Assert
      expect(factory).toHaveBeenCalledWith(
        expect.objectContaining({
          level: expect.any(String),
          timestamp: expect.any(Function),
          formatters: expect.objectContaining({
            level: expect.any(Function),
          }),
          messageKey: expect.any(String),
          mixin: expect.any(Function),
          base: expect.any(Object),
        }),
        expect.any(Object),
      );
    });

    it('applies correct log level based on NODE_ENV', () => {
      // Arrange
      const factory = getGlobalMocks().__PINO_FACTORY__;
      const expectedLevel = process.env.NODE_ENV === 'production' ? 'info' : 'debug';
      const config = factory.mock.calls[0]?.[0];

      // Act
      if (!config) {
        throw new Error('Could not find pino configuration in mock calls');
      }

      // Assert
      expect(config.level).toBe(expectedLevel);
    });

    it('timestamp function returns formatted time', () => {
      // Arrange
      const factory = getGlobalMocks().__PINO_FACTORY__;

      const config = factory.mock.calls[0]?.[0];

      // Act
      if (!config || typeof config.timestamp !== 'function') {
        throw new Error('Could not find pino configuration in mock calls');
      }

      const result = config.timestamp();

      // Assert
      expect(result).toBe(',"time":"2023-01-01 12:00:00.000"');
    });

    it('level formatter returns object with level', () => {
      // Arrange
      const factory = getGlobalMocks().__PINO_FACTORY__;

      const config = factory.mock.calls[0]?.[0];

      // Act
      if (!config || typeof config.formatters?.level !== 'function') {
        throw new Error('Could not find pino configuration in mock calls');
      }

      const result = config.formatters.level('info');

      // Assert
      expect(result).toEqual({ level: 'info' });
    });

    it('mixin includes requestName when present', () => {
      // Arrange
      const factory = getGlobalMocks().__PINO_FACTORY__;

      const config = factory.mock.calls[0]?.[0];

      // Act
      if (!config || typeof config.mixin !== 'function') {
        throw new Error('Could not find pino configuration in mock calls');
      }

      setHttpContext('process-order');

      const result = config.mixin();

      // Assert
      expect(result).toEqual({ requestName: 'process-order' });
    });

    it('mixin returns empty object when no requestName', () => {
      // Arrange
      const factory = getGlobalMocks().__PINO_FACTORY__;
      setHttpContext(undefined);

      const config = factory.mock.calls[0]?.[0];

      // Act
      if (!config || typeof config.mixin !== 'function') {
        throw new Error('Could not find pino configuration in mock calls');
      }

      const result = config.mixin();

      // Assert
      expect(result).toEqual({});
    });

    it('calls pino.destination with correct options', () => {
      // Arrange
      const factory = getGlobalMocks().__PINO_FACTORY__;

      // Act

      // Assert
      expect(factory.destination).toHaveBeenCalledWith({ dest: 1, sync: false });
    });
  });
  // #endregion

  // #region Edge Cases
  describe('edge cases', () => {
    it('handles object with undefined data', () => {
      // Arrange
      const input = { message: 'Test', data: undefined, extra: 'x' };

      // Act
      logger.info(input);

      // Assert
      expect(mockPinoLogger.info).toHaveBeenCalledWith({ extra: 'x' }, 'Test');
    });

    it('handles object with empty data object', () => {
      // Arrange
      const input = { message: 'Test', data: {}, extra: 'x' };

      // Act
      logger.info(input);

      // Assert
      expect(mockPinoLogger.info).toHaveBeenCalledWith({ extra: 'x' }, 'Test');
    });

    it('handles empty object (no message, no data)', () => {
      // Arrange
      const input = {};

      // Act
      logger.info(input);

      // Assert
      expect(mockPinoLogger.info).toHaveBeenCalledWith({});
    });

    it('handles object with only message field', () => {
      // Arrange
      const input = { message: 'Simple' };

      // Act
      logger.info(input);

      // Assert
      expect(mockPinoLogger.info).toHaveBeenCalledWith({}, 'Simple');
    });
  });
  // #endregion
});
