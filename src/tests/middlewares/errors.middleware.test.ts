/**
 * Required modules.
 */
import { errorHandler } from '@helpers';
import { logger } from '@libs';

import { handleErrors } from '@middlewares/errors.middleware';
import { StatusCodes } from 'http-status-codes';
import { createRequest, createResponse } from 'node-mocks-http';

jest.mock('@libs/logger.lib');
jest.mock('@helpers/errors.helper');

describe('Testing Errors Middleware', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Handle errors', () => {
    it('Must call the error handler with a 400 status code', () => {
      // Arrange
      const mockParams = {};
      const mockResponse = {
        statusCode: StatusCodes.NOT_FOUND,
        data: {
          message: 'Oops! Resource not found.',
        },
      };

      const req = createRequest(mockParams);
      const res = createResponse();
      const next = jest.fn();

      const message = 'The errors handler middleware was triggered.';
      const error = {
        status: mockResponse.statusCode,
        statusCode: mockResponse.statusCode,
        message: mockResponse.data.message,
      };

      // Act
      handleErrors(error, req, res, next);

      // Assert
      expect(logger.error).toHaveBeenCalledTimes(1);
      expect(logger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          message,
          error,
        }),
      );
      expect(errorHandler).toHaveBeenCalledTimes(1);
      expect(errorHandler).toHaveBeenCalledWith(
        {
          statusCode: mockResponse.statusCode,
          message: mockResponse.data.message,
        },
        res,
      );
    });

    it('Must call the error handler with a 500 status code', () => {
      // Arrange
      const mockParams = {};
      const mockResponse = {
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        data: {
          message: 'Something went wrong!',
        },
      };

      const req = createRequest(mockParams);
      const res = createResponse();
      res.status(mockResponse.statusCode);
      const next = jest.fn();

      const message = 'The errors handler middleware was triggered.';
      const error = {
        statusCode: mockResponse.statusCode,
        message: mockResponse.data.message,
      };

      // Act
      handleErrors(error, req, res, next);

      // Assert
      expect(logger.error).toHaveBeenCalledTimes(1);
      expect(logger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          message,
          error,
        }),
      );
      expect(errorHandler).toHaveBeenCalledTimes(1);
      expect(errorHandler).toHaveBeenCalledWith(error, res);
    });
  });
});
