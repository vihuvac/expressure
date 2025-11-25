/**
 * Required modules.
 */
import { expressLogger } from '@middlewares/expressLogger.middleware';
import { createMockRequest, createMockResponse } from '@mocks/express.mock';
import type { Request, Response } from 'express';
import httpContext from 'express-http-context';

type CapturedValues = {
  logLevel?: string;
  serializedReq?: Record<string, unknown>;
  serializedRes?: Record<string, unknown>;
  serializedErr?: Record<string, unknown>;
  successMessage?: string;
  errorMessage?: string;
  customProps?: Record<string, unknown>;
};

let capturedValues: CapturedValues = {};
const resetCapturedValues = (): void => {
  capturedValues = {};
};

jest.mock('pino-http', () =>
  jest.fn().mockImplementation((config) => (req: Request, res: Response, next: () => void) => {
    resetCapturedValues();

    // Execute autoLogging.ignore to test health check routes
    if (config.autoLogging?.ignore?.(req)) {
      return next();
    }

    // Execute customLogLevel to test log level determination
    if (config.customLogLevel) {
      capturedValues.logLevel = config.customLogLevel(req, res);
    }

    // Execute serializers to test request/response/error serialization
    if (config.serializers) {
      capturedValues.serializedReq = config.serializers.req?.(req);
      capturedValues.serializedRes = config.serializers.res?.(res);

      // Test error serializer with a mock error
      if (config.serializers.err) {
        const mockError = new Error('Test error');
        mockError.name = 'TestError';
        mockError.stack = 'Test stack trace';
        capturedValues.serializedErr = config.serializers.err(mockError);
      }
    }

    // Execute customProps
    if (config.customProps) {
      capturedValues.customProps = config.customProps(req, res);

      // Test customSuccessMessage and customErrorMessage
      if (res.statusCode < 400 && config.customSuccessMessage) {
        capturedValues.successMessage = config.customSuccessMessage(req, res);
      } else if (res.statusCode >= 400 && config.customErrorMessage) {
        capturedValues.errorMessage = config.customErrorMessage(req, res);
      }
    }

    return next();
  }),
);

jest.mock('express-http-context', () => ({
  set: jest.fn(),
  get: jest.fn(),
}));

jest.mock('@libs', () => ({
  pinoLogger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    child: jest.fn().mockReturnThis(),
    level: 'info',
  },
}));

describe('Express Logger Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetCapturedValues();
  });

  describe('Middleware Execution', () => {
    it('should call next() and set request context when route exists', () => {
      // Arrange
      const request = createMockRequest({
        route: { path: '/test' },
        baseUrl: '/api/v1',
      });
      const response = createMockResponse();
      const next = jest.fn();

      // Act
      expressLogger(request, response, next);

      // Assert
      expect(next).toHaveBeenCalled();
      expect(httpContext.set).toHaveBeenCalledWith('requestName', 'GET - /api/v1/test');
    });

    it('should call next() without setting request context when route does not exist', () => {
      // Arrange
      const request = createMockRequest();
      const response = createMockResponse();
      const next = jest.fn();

      // Act
      expressLogger(request, response, next);

      // Assert
      expect(next).toHaveBeenCalled();
      expect(httpContext.set).not.toHaveBeenCalled();
      expect(capturedValues.customProps?.route).toBe('N/A');
    });

    it('should call next() for health check endpoints without setting context', () => {
      // Arrange
      const request = createMockRequest({
        url: '/api/v1/health/readiness',
      });
      const response = createMockResponse();
      const next = jest.fn();

      // Act
      expressLogger(request, response, next);

      // Assert
      expect(next).toHaveBeenCalled();
      expect(httpContext.set).not.toHaveBeenCalled();
    });
  });

  describe('Configuration Functions', () => {
    describe('Log Level Configuration', () => {
      it('should set custom log level to error for status code 400 and above', () => {
        // Arrange
        const request = createMockRequest();
        const response = createMockResponse({ statusCode: 404 });
        const next = jest.fn();

        // Act
        expressLogger(request, response, next);

        // Assert
        expect(capturedValues.logLevel).toBe('error');
        expect(next).toHaveBeenCalled();
      });

      it('should set custom log level to info for status code below 400', () => {
        // Arrange
        const request = createMockRequest();
        const response = createMockResponse({ statusCode: 200 });
        const next = jest.fn();

        // Act
        expressLogger(request, response, next);

        // Assert
        expect(capturedValues.logLevel).toBe('info');
        expect(next).toHaveBeenCalled();
      });
    });

    describe('Message Formatting', () => {
      it('should generate success message with response time and content length', () => {
        // Arrange
        const request = createMockRequest({
          route: { path: '/test' },
          baseUrl: '/api/v1',
        });
        const response = createMockResponse({
          statusCode: 200,
          responseTime: 123,
        });
        const next = jest.fn();

        // Act
        expressLogger(request, response, next);

        // Assert
        expect(capturedValues.successMessage).toBe('GET /api/v1/test 200 123ms - 456');
        expect(capturedValues.errorMessage).toBeUndefined();
        expect(next).toHaveBeenCalled();
      });

      it('should generate error message with response time and content length', () => {
        // Arrange
        const request = createMockRequest({
          route: { path: '/test' },
          baseUrl: '/api/v1',
        });
        const response = createMockResponse({
          statusCode: 500,
          responseTime: 456,
        });
        const next = jest.fn();

        // Act
        expressLogger(request, response, next);

        // Assert
        expect(capturedValues.errorMessage).toBe('GET /api/v1/test 500 456ms - 456');
        expect(capturedValues.successMessage).toBeUndefined();
        expect(next).toHaveBeenCalled();
      });

      it('should use fallback when response time is zero in success message', () => {
        // Arrange
        const request = createMockRequest({
          route: { path: '/test' },
          baseUrl: '/api/v1',
        });
        const response = createMockResponse({
          statusCode: 200,
          responseTime: 0,
        });
        const next = jest.fn();

        // Act
        expressLogger(request, response, next);

        // Assert
        expect(capturedValues.successMessage).toBe('GET /api/v1/test 200 0ms - 456');
        expect(next).toHaveBeenCalled();
      });

      it('should use fallback when response time is zero in error message', () => {
        // Arrange
        const request = createMockRequest({
          route: { path: '/test' },
          baseUrl: '/api/v1',
        });
        const response = createMockResponse({
          statusCode: 400,
          responseTime: 0,
        });
        const next = jest.fn();

        // Act
        expressLogger(request, response, next);

        // Assert
        expect(capturedValues.errorMessage).toBe('GET /api/v1/test 400 0ms - 456');
        expect(next).toHaveBeenCalled();
      });

      it('should use fallback when response time is undefined in success message', () => {
        // Arrange
        const request = createMockRequest({
          route: { path: '/test' },
          baseUrl: '/api/v1',
        });
        const response = createMockResponse({
          statusCode: 200,
          responseTime: undefined,
        });
        const next = jest.fn();

        // Act
        expressLogger(request, response, next);

        // Assert
        expect(capturedValues.successMessage).toBe('GET /api/v1/test 200 0ms - 456');
        expect(next).toHaveBeenCalled();
      });

      it('should use fallback when response time is undefined in error message', () => {
        // Arrange
        const request = createMockRequest({
          route: { path: '/test' },
          baseUrl: '/api/v1',
        });
        const response = createMockResponse({
          statusCode: 500,
          responseTime: undefined,
        });
        const next = jest.fn();

        // Act
        expressLogger(request, response, next);

        // Assert
        expect(capturedValues.errorMessage).toBe('GET /api/v1/test 500 0ms - 456');
        expect(next).toHaveBeenCalled();
      });

      it('should handle missing content-length header in success message', () => {
        // Arrange
        const request = createMockRequest({
          route: { path: '/test' },
          baseUrl: '/api/v1',
        });
        const response = createMockResponse({
          statusCode: 200,
          responseTime: 123,
          contentLength: null, // This will make getHeader return null
        });
        const next = jest.fn();

        // Act
        expressLogger(request, response, next);

        // Assert
        expect(capturedValues.successMessage).toBe('GET /api/v1/test 200 123ms - 0b');
        expect(next).toHaveBeenCalled();
      });

      it('should handle missing content-length header in error message', () => {
        // Arrange
        const request = createMockRequest({
          route: { path: '/test' },
          baseUrl: '/api/v1',
        });
        const response = createMockResponse({
          statusCode: 500,
          responseTime: 456,
          contentLength: null, // This will make getHeader return null
        });
        const next = jest.fn();

        // Act
        expressLogger(request, response, next);

        // Assert
        expect(capturedValues.errorMessage).toBe('GET /api/v1/test 500 456ms - 0b');
        expect(next).toHaveBeenCalled();
      });

      it('should handle undefined content-length header in success message', () => {
        // Arrange
        const request = createMockRequest({
          route: { path: '/test' },
          baseUrl: '/api/v1',
        });
        const response = createMockResponse({
          statusCode: 200,
          responseTime: 123,
        });

        // Override getHeader to return undefined specifically for Content-Length
        response.getHeader = jest.fn().mockImplementation((name: string) => {
          if (name === 'Content-Length') {
            return undefined; // Explicitly return undefined
          }
          return null;
        });
        const next = jest.fn();

        // Act
        expressLogger(request, response, next);

        // Assert
        expect(capturedValues.successMessage).toBe('GET /api/v1/test 200 123ms - 0b');
        expect(next).toHaveBeenCalled();
      });

      it('should handle undefined content-length header in error message', () => {
        // Arrange
        const request = createMockRequest({
          route: { path: '/test' },
          baseUrl: '/api/v1',
        });
        const response = createMockResponse({
          statusCode: 400,
          responseTime: 456,
        });

        // Override getHeader to return undefined specifically for Content-Length
        response.getHeader = jest.fn().mockImplementation((name: string) => {
          if (name === 'Content-Length') {
            return undefined; // Explicitly return undefined
          }
          return null;
        });
        const next = jest.fn();

        // Act
        expressLogger(request, response, next);

        // Assert
        expect(capturedValues.errorMessage).toBe('GET /api/v1/test 400 456ms - 0b');
        expect(next).toHaveBeenCalled();
      });

      // Test for completely missing responseTime property
      it('should handle completely missing responseTime property in success message', () => {
        // Arrange
        const request = createMockRequest({
          route: { path: '/test' },
          baseUrl: '/api/v1',
        });
        const response = createMockResponse({
          statusCode: 200,
        });

        // Remove responseTime property entirely
        delete response.responseTime;
        const next = jest.fn();

        // Act
        expressLogger(request, response, next);

        // Assert
        expect(capturedValues.successMessage).toBe('GET /api/v1/test 200 0ms - 456');
        expect(next).toHaveBeenCalled();
      });

      // Test for completely missing responseTime property
      it('should handle completely missing responseTime property in error message', () => {
        // Arrange
        const request = createMockRequest({
          route: { path: '/test' },
          baseUrl: '/api/v1',
        });
        const response = createMockResponse({
          statusCode: 500,
        });

        // Remove responseTime property entirely
        delete response.responseTime;
        const next = jest.fn();

        // Act
        expressLogger(request, response, next);

        // Assert
        expect(capturedValues.errorMessage).toBe('GET /api/v1/test 500 0ms - 456');
        expect(next).toHaveBeenCalled();
      });
    });

    describe('Request Serialization', () => {
      it('should serialize request with headers, query, and body', () => {
        // Arrange
        const request = createMockRequest({
          headers: {
            'user-agent': 'test-agent',
            accept: 'application/json',
          },
          query: { page: '1', limit: '10' },
          body: { name: 'test', value: 123 },
          route: { path: '/test' },
        });
        const response = createMockResponse();
        const next = jest.fn();

        // Act
        expressLogger(request, response, next);

        // Assert
        expect(capturedValues.serializedReq).toEqual({
          headers: expect.objectContaining({
            'user-agent': 'test-agent',
            accept: 'application/json',
          }),
          query: { page: '1', limit: '10' },
          body: { name: 'test', value: 123 },
        });
        expect(next).toHaveBeenCalled();
      });
    });

    describe('Response Serialization', () => {
      it('should serialize response with status code', () => {
        // Arrange
        const request = createMockRequest({ route: { path: '/test' } });
        const response = createMockResponse({ statusCode: 201 });
        const next = jest.fn();

        // Act
        expressLogger(request, response, next);

        // Assert
        expect(capturedValues.serializedRes).toEqual({ statusCode: 201 });
        expect(next).toHaveBeenCalled();
      });
    });

    describe('Error Serialization', () => {
      it('should serialize error with type, message, and stack', () => {
        // Arrange
        const request = createMockRequest({ route: { path: '/test' } });
        const response = createMockResponse();
        const next = jest.fn();

        // Act
        expressLogger(request, response, next);

        // Assert
        expect(capturedValues.serializedErr).toEqual({
          type: 'TestError',
          message: 'Test error',
          stack: 'Test stack trace',
        });
        expect(next).toHaveBeenCalled();
      });
    });

    describe('Custom Properties', () => {
      it('should include existing error in custom props for error responses', () => {
        // Arrange
        const existingError = new Error('Custom error message');
        const request = createMockRequest({
          route: { path: '/test' },
          baseUrl: '/api/v1',
        });
        const response = createMockResponse({
          statusCode: 400,
          locals: { error: existingError },
        });
        const next = jest.fn();

        // Act
        expressLogger(request, response, next);

        // Assert
        expect(capturedValues.customProps).toEqual({
          type: 'http_request',
          route: '/test',
          error: existingError,
        });
        expect(next).toHaveBeenCalled();
      });

      it('should generate error in custom props for error responses without existing error', () => {
        // Arrange
        const request = createMockRequest({
          route: { path: '/test' },
          baseUrl: '/api/v1',
        });
        const response = createMockResponse({
          statusCode: 500,
          locals: {},
        });
        response.statusMessage = '';
        const next = jest.fn();

        // Act
        expressLogger(request, response, next);

        // Assert
        expect(capturedValues.customProps).toEqual({
          type: 'http_request',
          route: '/test',
          error: expect.any(Error),
        });
        expect((capturedValues.customProps?.error as Error).message).toBe('Request failed');
        expect(next).toHaveBeenCalled();
      });

      it('should use status message when creating error for error responses', () => {
        // Arrange
        const request = createMockRequest({
          route: { path: '/test' },
          baseUrl: '/api/v1',
        });
        const response = createMockResponse({
          statusCode: 500,
          locals: {},
        });
        response.statusMessage = 'Internal Server Error';
        const next = jest.fn();

        // Act
        expressLogger(request, response, next);

        // Assert
        expect(capturedValues.customProps?.error).toBeInstanceOf(Error);
        expect((capturedValues.customProps?.error as Error).message).toBe('Internal Server Error');
        expect(next).toHaveBeenCalled();
      });

      it('should not include error in custom props for successful responses', () => {
        // Arrange
        const request = createMockRequest({
          route: { path: '/test' },
          baseUrl: '/api/v1',
        });
        const response = createMockResponse({
          statusCode: 200,
          locals: {},
        });
        const next = jest.fn();

        // Act
        expressLogger(request, response, next);

        // Assert
        expect(capturedValues.customProps).toEqual({
          type: 'http_request',
          route: '/test',
        });
        expect(capturedValues.customProps?.error).toBeUndefined();
        expect(next).toHaveBeenCalled();
      });
    });

    describe('Health Check Endpoints', () => {
      it('should ignore logging for health check liveness endpoint', () => {
        // Arrange
        const request = createMockRequest({
          url: '/api/v1/health/liveness',
        });
        const response = createMockResponse();
        const next = jest.fn();

        // Act
        expressLogger(request, response, next);

        // Assert
        expect(next).toHaveBeenCalled();
        expect(httpContext.set).not.toHaveBeenCalled();
        expect(capturedValues.logLevel).toBeUndefined();
        expect(capturedValues.customProps).toBeUndefined();
      });

      it('should ignore logging for health check readiness endpoint', () => {
        // Arrange
        const request = createMockRequest({
          url: '/api/v1/health/readiness',
        });
        const response = createMockResponse();
        const next = jest.fn();

        // Act
        expressLogger(request, response, next);

        // Assert
        expect(next).toHaveBeenCalled();
        expect(httpContext.set).not.toHaveBeenCalled();
        expect(capturedValues.logLevel).toBeUndefined();
        expect(capturedValues.customProps).toBeUndefined();
      });
    });
  });

  describe('Integration Behavior', () => {
    it('should work with different HTTP methods', () => {
      // Arrange
      const request = createMockRequest({
        method: 'POST',
        route: { path: '/users' },
        baseUrl: '/api/v1',
      });
      const response = createMockResponse();
      const next = jest.fn();

      // Act
      expressLogger(request, response, next);

      // Assert
      expect(httpContext.set).toHaveBeenCalledWith('requestName', 'POST - /api/v1/users');
      expect(next).toHaveBeenCalled();
    });

    it('should work with different base URLs', () => {
      // Arrange
      const request = createMockRequest({
        route: { path: '/test' },
        baseUrl: '/api/v2',
      });
      const response = createMockResponse();
      const next = jest.fn();

      // Act
      expressLogger(request, response, next);

      // Assert
      expect(httpContext.set).toHaveBeenCalledWith('requestName', 'GET - /api/v2/test');
      expect(next).toHaveBeenCalled();
    });

    it('should handle requests with complex routes', () => {
      // Arrange
      const request = createMockRequest({
        route: { path: '/users/:id/posts' },
        baseUrl: '/api/v1',
      });
      const response = createMockResponse();
      const next = jest.fn();

      // Act
      expressLogger(request, response, next);

      // Assert
      expect(httpContext.set).toHaveBeenCalledWith('requestName', 'GET - /api/v1/users/:id/posts');
      expect(next).toHaveBeenCalled();
    });
  });
});
