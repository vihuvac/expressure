/**
 * Required Modules.
 */

import { errorsDictionary } from '@helpers/dictionaries.helper';
import type { Response } from 'express';
import { StatusCodes } from 'http-status-codes';

type ErrorResponseCode = {
  statusCode: number;
};

export type CustomErrorObject = ErrorResponseCode & {
  message: string;
};

export type DictionaryErrorResponse = CustomErrorObject & {
  code: string;
};

export class CustomError extends Error {
  statusCode: number;

  /**
   * Custom error class to handle application-specific errors.
   *
   * @example
   * const { CustomError } = require('../helpers');
   *
   * throw new CustomError(404, 'The requested record was not found.');
   *
   * @param {Number} statusCode The status code to be assigned to the custom error.
   * @param {String} message    The custom error message.
   */
  constructor(statusCode: number, message: string) {
    super();
    this.statusCode = statusCode;
    this.message = message;
  }
}

/**
 * @func defaultError
 * @description Create a default error object from any error type or `CustomErrorObject`.
 *
 * @param {unknown | CustomErrorObject} error Any error object or `CustomErrorObject`.
 *
 * @return {CustomErrorObject} Standardized error response.
 */
const defaultError = (error: unknown): CustomErrorObject => {
  const err = error as { statusCode?: number; message?: string };
  return {
    statusCode: err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
    message: err.message || 'Internal server error.',
  };
};

/**
 * @func dictionaryError
 * @description Create a default error object based on custom errors defined in the dictionary.
 *
 * @param {string} code The custom error code defined in the dictionary.
 *
 * @return {object} An object representing the error found in the dictionary.
 */
const dictionaryError = (code: string): DictionaryErrorResponse | undefined =>
  errorsDictionary.find((error) => error.code === code);

/**
 * @func errorHandler
 * @description Handle and format error to send to client.
 *
 * @param {unknown} error Any error object or value.
 * @param {Response} res  Express response object.
 *
 * @return {void} Sends formatted error response.
 */
export const errorHandler = (error: unknown, res: Response): void => {
  const err = error as { code?: string };
  const { statusCode, message } = (err.code && dictionaryError(err.code)) || defaultError(error);

  res.status(statusCode).send({ message });
};
