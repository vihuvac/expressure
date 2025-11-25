/**
 * Required Modules.
 */
import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

/**
 * @func checkLiveness
 * @description Check the microservice liveness.
 *
 * @param {Object} req The express request object.
 * @param {Object} res The express response object.
 *
 * @return {object} An object with a message indicating the liveness status.
 */
export const checkLiveness = (_req: Request, res: Response) =>
  res.status(StatusCodes.OK).send({ status: 'ok' });

/**
 * @func checkReadiness
 * @description Check the microservice readiness.
 *
 * @param {Object} req The express request object.
 * @param {Object} res The express response object.
 *
 * @return {object} An object with a message indicating the readiness status.
 */
export const checkReadiness = (_req: Request, res: Response) =>
  res.status(StatusCodes.OK).send({ status: 'ok' });
