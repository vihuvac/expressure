/**
 * Required modules.
 */
import { StatusCodes } from 'http-status-codes';
import { createRequest, createResponse } from 'node-mocks-http';

import { checkLiveness, checkReadiness } from '@/app/controllers/healthChecks.controller';

jest.mock('@/app/helpers/errors.helper');

describe('Testing the health controller', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Check the microservice liveness', () => {
    it('Must return a status OK', async () => {
      // Arrange
      const message = 'The API is alive and running.';
      const mockResponse = {
        statusCode: StatusCodes.OK,
        data: {
          message,
        },
      };

      const req = createRequest();
      const res = createResponse();
      res.status(mockResponse.statusCode);

      // Act
      await checkLiveness(req, res);

      // Asset
      expect(res._getStatusCode()).toBe(mockResponse.statusCode);
      expect(res._getData()).toEqual(
        expect.objectContaining({
          message: expect.any(String),
        }),
      );
      expect(res._getData().message).toBe(mockResponse.data.message);
    });
  });

  describe('Check the microservice readiness', () => {
    it('Must return a status OK', async () => {
      // Arrange
      const message = 'The API is ready to handle requests.';
      const mockResponse = {
        statusCode: StatusCodes.OK,
        data: {
          message,
        },
      };

      const req = createRequest();
      const res = createResponse();
      res.status(mockResponse.statusCode);

      // Act
      await checkReadiness(req, res);

      // Asset
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
