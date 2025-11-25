/**
 * Required Modules.
 */
import { type CustomErrorObject, errorHandler } from '@helpers';
import { logger } from '@libs';
import type { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

type HandledError = CustomErrorObject & {
  code?: string;
  status?: number;
};

/**
 * @func handleErrors
 * @description Handle errors and format them to send them to the client.
 *
 * @param {HandledError} error The caught error object.
 * @param {Request} req        The express request object.
 * @param {Response} res       The express response object.
 * @param {NextFunction} next  The express next function.
 *
 * @return {void} Sends the formatted error response to the client.
 */
export const handleErrors = (
  error: HandledError,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  logger.error({
    message: 'The errors handler middleware was triggered.',
    error,
  });

  // Handle and customize non-API routes. `OpenApiValidator` bubbles up the respective error.
  if (error.status && error.status === StatusCodes.NOT_FOUND) {
    const notFoundError = {
      statusCode: StatusCodes.NOT_FOUND,
      message: 'Oops! Resource not found.',
    };

    return errorHandler(notFoundError, res);
  }

  return errorHandler(error, res);
};

export default handleErrors;
