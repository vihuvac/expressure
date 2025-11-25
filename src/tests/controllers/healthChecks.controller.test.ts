/**
 * Required modules.
 */
import { checkLiveness, checkReadiness } from '@controllers/healthChecks.controller';
import { StatusCodes } from 'http-status-codes';
import { createRequest, createResponse } from 'node-mocks-http';

jest.mock('@helpers/errors.helper');

describe('Testing the health controller', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Check the microservice liveness', () => {
    it('Must return a status OK', async () => {
      // Arrange
      const status = 'ok';
      const mockResponse = {
        statusCode: StatusCodes.OK,
        data: {
          status,
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
          status: expect.any(String),
        }),
      );
      expect(res._getData().status).toBe(mockResponse.data.status);
    });
  });

  describe('Check the microservice readiness', () => {
    it('Must return a status OK', async () => {
      // Arrange
      const status = 'ok';
      const mockResponse = {
        statusCode: StatusCodes.OK,
        data: {
          status,
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
          status: expect.any(String),
        }),
      );
      expect(res._getData().status).toBe(mockResponse.data.status);
    });
  });
});
