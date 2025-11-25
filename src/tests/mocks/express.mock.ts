/**
 * Required modules.
 */
import type { Request, Response } from 'express';
import { createRequest, createResponse, type RequestMethod } from 'node-mocks-http';

/**
 * @type {Object} MockRequest
 * @description Extended Express Request type with additional properties for testing.
 *
 * @property {Object} route           The route object containing path information.
 * @property {string} route.path      The route path pattern.
 * @property {string} baseUrl         The base URL for the request.
 * @property {RequestMethod} [method] The HTTP method (GET, POST, etc.).
 *
 * @extends Request
 */
type MockRequest = Request & {
  route: { path: string };
  baseUrl: string;
  method?: RequestMethod;
};

/**
 * @type {Object} MockResponseOverrides
 * @description Configuration options for customizing mock response behavior.
 *
 * @property {number} [statusCode]
 * HTTP status code for the response.
 * @property {Record<string, unknown>} [locals]
 * Response locals object for storing request-specific data.
 * @property {number} [responseTime]
 * Simulated response time in milliseconds.
 * @property {string | null} [contentLength]
 * Content-Length header value. Use null or undefined to test fallback behavior.
 */
type MockResponseOverrides = {
  statusCode?: number;
  locals?: Record<string, unknown>;
  responseTime?: number;
  contentLength?: string | null; // Add this to control getHeader behavior
};

/**
 * @type {Object} MockResponse
 * @description Extended Express Response type with additional properties for testing.
 *
 * @property {number} [responseTime] Simulated response time in milliseconds.
 *
 * @extends Response
 */
type MockResponse = Response & {
  responseTime?: number;
};

/**
 * @func createMockRequest
 * @description Creates a mock Express Request object for testing middleware and request handlers.
 * Generates a realistic request object with sensible defaults that can be customized via overrides.
 *
 * @param {Partial<MockRequest>} [overrides={}]
 * Configuration object to override default request properties.
 * @param {RequestMethod} [overrides.method='GET']
 * HTTP method for the request.
 * @param {string} [overrides.url='/api/v1/test']
 * Request URL path.
 * @param {Object} [overrides.headers]
 * Additional HTTP headers to include.
 * @param {Object} [overrides.query]
 * URL query parameters.
 * @param {Object} [overrides.body]
 * Request body data.
 * @param {Object} [overrides.route]
 * Route configuration including path pattern.
 * @param {string} [overrides.baseUrl]
 * Base URL for the request.
 *
 * @returns {MockRequest} A fully configured mock Express Request object ready for testing.
 *
 * @example
 * // Basic usage with defaults
 * const request = createMockRequest();
 *
 * // Customized request
 * const request = createMockRequest({
 *   method: 'POST',
 *   url: '/api/v1/users',
 *   body: { name: 'John Doe' },
 *   route: { path: '/users' },
 *   baseUrl: '/api/v1'
 * });
 */
export const createMockRequest = (overrides: Partial<MockRequest> = {}): MockRequest => {
  const request = createRequest({
    method: overrides.method || 'GET',
    url: overrides.url || '/api/v1/test',
    headers: {
      'content-type': 'application/json',
      'user-agent': 'jest-test',
      ...overrides.headers,
    },
    query: overrides.query || { filter: 'test' },
    body: overrides.body || { data: 'test' },
  });

  // Set route and baseUrl if provided
  if (overrides.route) {
    request.route = overrides.route;
  }

  if (overrides.baseUrl) {
    request.baseUrl = overrides.baseUrl;
  }

  return request as MockRequest;
};

/**
 * @function createMockResponse
 * @description Creates a mock Express Response object for testing middleware and response handlers.
 * Generates a realistic response object with configurable status codes,
 * locals, timing, and headers.
 * Includes a mocked getHeader method for testing Content-Length header behavior.
 *
 * @param {MockResponseOverrides} [overrides={}]
 * Configuration object to customize response behavior.
 * @param {number} [overrides.statusCode]
 * HTTP status code (defaults to framework default).
 * @param {Record<string, unknown>} [overrides.locals={}]
 * Response locals for storing request-specific data.
 * @param {number} [overrides.responseTime]
 * Simulated response processing time in milliseconds.
 * @param {string | null} [overrides.contentLength='456']
 * Content-Length header value.
 * Use null or undefined to test the '0b' fallback behavior in log messages.
 *
 * @returns {MockResponse} A fully configured mock Express Response object with mocked methods.
 *
 * @example
 * // Basic usage with defaults
 * const response = createMockResponse();
 *
 * // Error response with custom headers
 * const response = createMockResponse({
 *   statusCode: 404,
 *   locals: { error: new Error('Not found') },
 *   contentLength: '1024'
 * });
 *
 * // Test fallback behavior for missing Content-Length
 * const response = createMockResponse({
 *   statusCode: 200,
 *   contentLength: null // Will trigger '0b' fallback in logs
 * });
 */
export const createMockResponse = (overrides: MockResponseOverrides = {}): MockResponse => {
  const response: MockResponse = createResponse();

  if (overrides.statusCode !== undefined) {
    response.statusCode = overrides.statusCode;
  }

  response.locals = overrides.locals || {};

  if (overrides.responseTime !== undefined) {
    response.responseTime = overrides.responseTime;
  }

  // Mock getHeader based on contentLength override
  response.getHeader = jest.fn().mockImplementation((name: string) => {
    if (name === 'Content-Length') {
      return overrides.contentLength !== undefined ? overrides.contentLength : '456';
    }
    return null;
  });

  return response;
};
