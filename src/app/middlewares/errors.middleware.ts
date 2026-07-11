/**
 * Required Modules.
 */
import type { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { type CustomErrorObject, errorHandler } from '@/app/helpers/errors.helper';
import { logger } from '@/app/libs/logger.lib';

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
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  logger.error({
    message: 'The errors handler middleware was triggered.',
    error,
    request: {
      method: req.method,
      path: req.path,
      query: req.query,
      body: req.body,
    },
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
