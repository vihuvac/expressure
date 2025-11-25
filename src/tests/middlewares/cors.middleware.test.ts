/**
 * Required Modules.
 */
import { getCorsMiddleware } from '@middlewares/cors.middleware';
import {
  type CustomOrigin,
  invokeOrigin,
  mockConfig,
  mockCors,
  setupCorsMock,
} from '@mocks/cors.mock';
import type { CorsOptions } from 'cors';
import { StatusCodes } from 'http-status-codes';

jest.mock('config');
jest.mock('cors');

describe('CORS Middleware', () => {
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    jest.clearAllMocks();
    mockCors.mockClear();
    process.env.NODE_ENV = 'test';
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  // #region CORS middleware factory
  describe('corsMiddleware factory', () => {
    it('should configure CORS with correct options', () => {
      // Arrange
      const handler = jest.fn();
      mockCors.mockReturnValue(handler);

      // Act
      const middleware = getCorsMiddleware();
      const options = mockCors.mock.calls[0][0] as CorsOptions & {
        origin: CustomOrigin;
      };

      // Assert
      expect(options.methods).toEqual(['GET', 'PUT', 'PATCH', 'POST', 'DELETE']);
      expect(options.allowedHeaders).toEqual([
        'Accept',
        'Authorization',
        'Content-Type',
        'Origin',
        'X-Requested-With',
      ]);
      expect(options.optionsSuccessStatus).toBe(StatusCodes.OK);
      expect(options.credentials).toBe(true);
      expect(typeof options.origin).toBe('function');
      expect(middleware).toBe(handler);
      expect(mockCors).toHaveBeenCalledTimes(1);
    });
  });
  // #endregion

  // #region Origin-handler behaviour
  describe('CORS origin handler functionality', () => {
    it('should allow requests without origin in development environment', () => {
      // Arrange
      process.env.NODE_ENV = 'development';
      mockConfig.get.mockReturnValue(['https://allowed.com']);
      const { options } = setupCorsMock();

      // Act
      const callback = invokeOrigin(undefined, options);

      // Assert
      expect(callback).toHaveBeenCalledWith(null, true);
    });

    it('should deny requests without origin in production environment', () => {
      // Arrange
      process.env.NODE_ENV = 'production';
      mockConfig.get.mockReturnValue(['https://allowed.com']);
      const { options } = setupCorsMock();

      // Act
      const callback = invokeOrigin(undefined, options);

      // Assert
      expect(callback).toHaveBeenCalledWith(expect.any(Error));
      expect(callback.mock.calls[0][0].message).toBe("Origin 'undefined' not allowed by CORS.");
    });

    it('should allow origin that matches exact string in whitelist', () => {
      // Arrange
      mockConfig.get.mockReturnValue(['https://allowed.com', 'https://another.com']);
      const { options } = setupCorsMock();

      // Act
      const callback = invokeOrigin('https://allowed.com', options);

      // Assert
      expect(callback).toHaveBeenCalledWith(null, true);
    });

    it('should allow origin that matches regex pattern in whitelist', () => {
      // Arrange
      mockConfig.get.mockReturnValue(['/\\.my-domain\\.app$/', '/^http:\\/\\/localhost:\\d+$/']);
      const { options } = setupCorsMock();

      // Act
      const callback = invokeOrigin('https://my-app.my-domain.app', options);

      // Assert
      expect(callback).toHaveBeenCalledWith(null, true);
    });

    it('should allow origin that matches localhost regex pattern', () => {
      // Arrange
      mockConfig.get.mockReturnValue(['/\\.my-domain\\.app$/', '/^http:\\/\\/localhost:\\d+$/']);
      const { options } = setupCorsMock();

      // Act
      const callback = invokeOrigin('http://localhost:3000', options);

      // Assert
      expect(callback).toHaveBeenCalledWith(null, true);
    });

    it('should deny origin not in whitelist', () => {
      // Arrange
      mockConfig.get.mockReturnValue(['https://allowed.com']);
      const { options } = setupCorsMock();

      // Act
      const callback = invokeOrigin('https://not-allowed.com', options);

      // Assert
      expect(callback).toHaveBeenCalledWith(expect.any(Error));
      expect(callback.mock.calls[0][0].message).toBe(
        "Origin 'https://not-allowed.com' not allowed by CORS.",
      );
    });

    it('should deny origin when whitelist is empty', () => {
      // Arrange
      mockConfig.get.mockReturnValue([]);
      const { options } = setupCorsMock();

      // Act
      const callback = invokeOrigin('https://any-origin.com', options);

      // Assert
      expect(callback).toHaveBeenCalledWith(expect.any(Error));
      expect(callback.mock.calls[0][0].message).toBe(
        "Origin 'https://any-origin.com' not allowed by CORS.",
      );
    });

    it('should handle comma-separated string configuration', () => {
      // Arrange
      mockConfig.get.mockReturnValue(
        'https://domain1.com, https://domain2.com, /\\.domain3\\.com$/',
      );
      const { options } = setupCorsMock();

      // Act
      const callback = invokeOrigin('https://domain1.com', options);

      // Assert
      expect(callback).toHaveBeenCalledWith(null, true);
    });

    it('should handle mixed array configuration with strings and regex patterns', () => {
      // Arrange
      mockConfig.get.mockReturnValue([
        'https://exact.com',
        '/\\.pattern\\.com$/',
        'https://another-exact.com',
      ]);
      const { options } = setupCorsMock();

      // Act
      const callback = invokeOrigin('https://exact.com', options);

      // Assert
      expect(callback).toHaveBeenCalledWith(null, true);
    });

    it('should handle regex pattern matching in mixed array configuration', () => {
      // Arrange
      mockConfig.get.mockReturnValue([
        'https://exact.com',
        '/\\.pattern\\.com$/',
        'https://another-exact.com',
      ]);
      const { options } = setupCorsMock();

      // Act
      const callback = invokeOrigin('https://sub.pattern.com', options);

      // Assert
      expect(callback).toHaveBeenCalledWith(null, true);
    });

    it('should handle non-array and non-string corsOrigin configuration', () => {
      // Arrange
      mockConfig.get.mockReturnValue({ invalid: 'config' } as const);
      const { options } = setupCorsMock();

      // Act
      const callback = invokeOrigin('https://any-origin.com', options);

      // Assert
      expect(callback).toHaveBeenCalledWith(expect.any(Error));
      expect(callback.mock.calls[0][0].message).toBe(
        "Origin 'https://any-origin.com' not allowed by CORS.",
      );
    });

    it('should handle empty string configuration', () => {
      // Arrange
      mockConfig.get.mockReturnValue('');
      const { options } = setupCorsMock();

      // Act
      const callback = invokeOrigin('https://any-origin.com', options);

      // Assert
      expect(callback).toHaveBeenCalledWith(expect.any(Error));
      expect(callback.mock.calls[0][0].message).toBe(
        "Origin 'https://any-origin.com' not allowed by CORS.",
      );
    });

    it('should properly parse regex patterns from string configuration', () => {
      // Arrange
      mockConfig.get.mockReturnValue('/^https:\\/\\/api\\..+\\.com$/, https://exact.com');
      const { options } = setupCorsMock();

      // Act
      const callback = invokeOrigin('https://api.something.com', options);

      // Assert
      expect(callback).toHaveBeenCalledWith(null, true);
    });

    it('should handle complex regex patterns as shown in the reference', () => {
      // Arrange
      mockConfig.get.mockReturnValue(['/\\.my-domain\\.app$/', '/^http:\\/\\/localhost:\\d+$/']);
      const { options } = setupCorsMock();

      // Act
      const callback = invokeOrigin('https://my-app.my-domain.app', options);

      // Assert
      expect(callback).toHaveBeenCalledWith(null, true);
    });

    it('should handle localhost regex pattern from complex configuration', () => {
      // Arrange
      mockConfig.get.mockReturnValue(['/\\.my-domain\\.app$/', '/^http:\\/\\/localhost:\\d+$/']);
      const { options } = setupCorsMock();

      // Act
      const callback = invokeOrigin('http://localhost:8080', options);

      // Assert
      expect(callback).toHaveBeenCalledWith(null, true);
    });

    it('should deny non-matching origin from complex configuration', () => {
      // Arrange
      mockConfig.get.mockReturnValue(['/\\.my-domain\\.app$/', '/^http:\\/\\/localhost:\\d+$/']);
      const { options } = setupCorsMock();

      // Act
      const callback = invokeOrigin('https://other-domain.com', options);

      // Assert
      expect(callback).toHaveBeenCalledWith(expect.any(Error));
      expect(callback.mock.calls[0][0].message).toBe(
        "Origin 'https://other-domain.com' not allowed by CORS.",
      );
    });
  });
  // #endregion

  // #region Integration – the public API
  describe('Middleware integration', () => {
    it('should return a CORS middleware function', () => {
      // Arrange
      const handler = jest.fn();
      mockCors.mockReturnValue(handler);

      // Act
      const middleware = getCorsMiddleware();

      // Assert
      expect(typeof middleware).toBe('function');
      expect(middleware).toBe(handler);
      expect(mockCors).toHaveBeenCalledTimes(1);
    });
  });
  // #endregion
});
