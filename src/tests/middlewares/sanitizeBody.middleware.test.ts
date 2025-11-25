/**
 * Required modules.
 */
import { sanitizeBody } from '@middlewares/sanitizeBody.middleware';
import type { NextFunction, Request } from 'express';
import { createRequest, createResponse, type MockRequest } from 'node-mocks-http';
import xss from 'xss';

jest.mock('xss', () => jest.fn((input: string) => `sanitized(${input})`));

const mockXss = xss as jest.Mock<string, [string, unknown]>;

/**
 * @func expectSanitized
 * @description Helper to assert that the body was stripped of `_id` and sanitized.
 *
 * @param {MockRequest<Request>} req         The request object.
 * @param {Record<string, unknown>} expected The expected sanitized body.
 *
 * @return {void}
 */
const expectSanitized = (req: MockRequest<Request>, expected: Record<string, unknown>) => {
  expect(req.body).toEqual(expected);
};

/**
 * @func createMockNext
 * @description Returns a Jest mock that can be used as Express `next`.
 *
 * @returns Jest mock function.
 */
const createMockNext = (): NextFunction => jest.fn();

describe('sanitizeBody Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockXss.mockImplementation((input: string) => `sanitized(${input})`);
  });

  it('calls next() when req.body is undefined', () => {
    // Arrange
    const req = createRequest();
    delete req.body; // ensure undefined
    const res = createResponse();
    const next = createMockNext();

    // Act
    sanitizeBody(req, res, next);

    // Assert
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();
  });

  it('handles an empty body gracefully', () => {
    // Arrange
    const req = createRequest({ body: {} });
    const res = createResponse();
    const next = createMockNext();

    // Act
    sanitizeBody(req, res, next);

    // Assert
    expect(req.body).toEqual({});
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('removes only the _id field when it is the sole property', () => {
    // Arrange
    const req = createRequest({ body: { _id: 'abc123' } });
    const res = createResponse();
    const next = createMockNext();

    // Act
    sanitizeBody(req, res, next);

    // Assert
    expect(req.body).toEqual({});
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('excludes _id and sanitizes plain string fields', () => {
    // Arrange
    const req = createRequest({
      body: {
        _id: '123abc',
        name: '<script>alert(1)</script>John',
        email: 'test@example.com',
      },
    });
    const res = createResponse();
    const next = createMockNext();

    // Act
    sanitizeBody(req, res, next);

    // Assert
    expectSanitized(req, {
      name: 'sanitized(<script>alert(1)</script>John)',
      email: 'sanitized(test@example.com)',
    });
    expect('_id' in (req.body ?? {})).toBe(false);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('recursively sanitizes nested objects', () => {
    // Arrange
    const req = createRequest({
      body: {
        _id: '507f1f77bcf86cd799439011',
        user: {
          name: '<b>Admin</b>',
          profile: { bio: '<div>Dev</div>' },
        },
      },
    });
    const res = createResponse();
    const next = createMockNext();

    // Act
    sanitizeBody(req, res, next);

    // Assert
    expectSanitized(req, {
      user: {
        name: 'sanitized(<b>Admin</b>)',
        profile: { bio: 'sanitized(<div>Dev</div>)' },
      },
    });
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('sanitizes arrays and their nested elements', () => {
    // Arrange
    const req = createRequest({
      body: {
        tags: ['<important>', '<urgent>'],
        nested: [{ tag: '<script>bad</script>' }],
      },
    });
    const res = createResponse();
    const next = createMockNext();

    // Act
    sanitizeBody(req, res, next);

    // Assert
    expectSanitized(req, {
      tags: ['sanitized(<important>)', 'sanitized(<urgent>)'],
      nested: [{ tag: 'sanitized(<script>bad</script>)' }],
    });
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('preserves numbers, booleans, null, undefined, objects & arrays', () => {
    // Arrange
    const original = {
      count: 42,
      active: true,
      missing: null as null,
      nothing: undefined as undefined,
      sieben: [1, false, null],
      meta: { empty: null, arr: [] },
    };
    const req = createRequest({ body: original });
    const res = createResponse();
    const next = createMockNext();

    // Act
    sanitizeBody(req, res, next);

    // Assert
    expect(req.body).toEqual(original);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('handles a complex mixed payload correctly', () => {
    // Arrange
    const req = createRequest({
      body: {
        _id: 'mixed',
        data: [{ name: '<b>Alice</b>', age: 30 }, { hobbies: ['<i>swimming</i>'] }],
        config: { debug: false },
      },
    });
    const res = createResponse();
    const next = createMockNext();

    // Act
    sanitizeBody(req, res, next);

    // Assert
    expectSanitized(req, {
      data: [
        { name: 'sanitized(<b>Alice</b>)', age: 30 },
        { hobbies: ['sanitized(<i>swimming</i>)'] },
      ],
      config: { debug: false },
    });
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('passes the correct options to the xss library', () => {
    // Arrange
    const req = createRequest({ body: { field: '<script>evil</script>' } });
    const res = createResponse();
    const next = createMockNext();

    // Act
    sanitizeBody(req, res, next);

    // Assert
    expect(mockXss).toHaveBeenCalledWith('<script>evil</script>', {
      whiteList: {},
      stripIgnoreTag: true,
      stripIgnoreTagBody: ['script'],
    });
  });
});
