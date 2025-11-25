/**
 * Required Modules.
 */
import { StatusCodes } from 'http-status-codes';

/**
 * Generic dictionary in order to match some defined and retrieved errors.
 * Maps each error code to an HTTP status returned by the controller.
 *
 * Database errors:
 * - Error codes match values returned from DB queries (e.g., MySQL).
 */
const databaseErrorsDictionary = [
  {
    // A single record was not found.
    code: 'RECORD_NOT_FOUND',
    statusCode: StatusCodes.NOT_FOUND,
    message: 'Unable to find the record with the given id.',
  },
];

/**
 * Dictionary to match errors thrown in services.
 * Maps each error code to an HTTP status returned by the controller.
 *
 * Services errors:
 * - Error codes match values returned from service calls.
 */
// const servicesErrorsDictionary = [];

/**
 * Dictionary of errors mapped for controller handling.
 */
export const errorsDictionary = [
  ...databaseErrorsDictionary,
  // ...servicesErrorsDictionary,
];

export default errorsDictionary;
