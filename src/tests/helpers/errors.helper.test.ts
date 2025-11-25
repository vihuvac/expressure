/**
 * Required modules.
 */
import { CustomError, errorHandler } from '@helpers/errors.helper';
import { StatusCodes } from 'http-status-codes';
import { createResponse } from 'node-mocks-http';

describe('Testing Errors Helper', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Custom Error Class', () => {
    it('Must return a custom error object', () => {
      // Arrange
      const statusCode = StatusCodes.NOT_FOUND;
      const message = 'Record not found!';

      // Act
      const response = new CustomError(statusCode, message);

      // Assert
      expect(response).toHaveProperty('statusCode', StatusCodes.NOT_FOUND);
      expect(response).toHaveProperty('message', message);
    });
  });

  describe('Error handler', () => {
    it('Must return a return a default error object', () => {
      // Arrange
      const error = {};

      const mockResponse = {
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        data: {
          message: 'Internal server error.',
        },
      };
      const res = createResponse();
      res.status(mockResponse.statusCode);

      // Act
      errorHandler(error, res);

      // Assert
      expect(res._getStatusCode()).toBe(mockResponse.statusCode);
      expect(res._getData()).toEqual(
        expect.objectContaining({
          message: expect.any(String),
        }),
      );
      expect(res._getData().message).toBe(mockResponse.data.message);
    });

    it('Must return a return an error object from the dictionary', () => {
      // Arrange
      const message = 'There was an error establishing a database connection.';
      const error = {
        code: 'ENOTFOUND',
        message,
      };

      const mockResponse = {
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        data: {
          message,
        },
      };
      const res = createResponse();
      res.status(mockResponse.statusCode);

      // Act
      errorHandler(error, res);

      // Assert
      expect(res._getStatusCode()).toBe(mockResponse.statusCode);
      expect(res._getData()).toEqual(
        expect.objectContaining({
          message: expect.any(String),
        }),
      );
      expect(res._getData().message).toBe(mockResponse.data.message);
    });
  });
});
