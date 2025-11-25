/**
 * Required modules.
 */
import type { Request as BaseRequest, NextFunction, Response } from 'express';
import xss from 'xss';

/**
 * @func sanitize
 * @description Sanitizes the payload to prevent XSS (Cross-Site Scripting) attacks.
 * - This function uses the `xss` library to remove any potentially harmful HTML tags and attributes
 *   from the input, ensuring that the data is safe to use and display.
 * - It strips all tags except for those explicitly allowed in the whitelist,
 *   and it removes the content of certain tags like <script>.
 *
 * @example
 * // Example usage:
 * const userInput = '<script>alert("XSS")</script><b>Bold Text</b>';
 * const sanitizedInput = sanitize(userInput);
 * // sanitizedInput will be: 'alert("XSS")Bold Text'
 *
 * @param {string} payload The string to sanitize.
 *
 * @return {string} The sanitized string.
 */
const sanitize = (payload: string) =>
  xss(payload, {
    whiteList: {},
    stripIgnoreTag: true,
    stripIgnoreTagBody: ['script'],
  });

/**
 * @const isPlainObject
 * @description Type guard to check if a value is a plain object (not null, not array).
 */
const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * @func sanitizeString
 * @description Sanitizes string values for XSS protection, preserves other types.
 *
 * @param value The value to sanitize
 * @returns The sanitized value (string) or original value (non-string)
 */
const sanitizeString = (value: unknown): unknown => {
  // Skip sanitization for non-strings (numbers, booleans, null, undefined).
  if (typeof value !== 'string') {
    return value;
  }

  // Sanitize strings only.
  return sanitize(value);
};

/**
 * @func stripTags
 * @description Recursively strips all HTML tags from the payload to prevent XSS attacks.
 * - This function sanitizes each value in the payload by removing any HTML tags, ensuring that
 *   the data is safe to use and display.
 * - It handles nested objects and arrays, applying the
 *   sanitization process to each element.
 *
 * @example
 * // Example usage:
 * const input = {
 *   name: '<script>alert("XSS")</script>John Doe',
 *   details: {
 *     bio: '<div>Developer</div>',
 *     hobbies: ['<b>Coding</b>', '<i>Reading</i>']
 *   }
 * };
 *
 * const sanitizedInput = stripTags(input);
 * // sanitizedInput will be:
 * // {
 * //   name: 'alert("XSS")John Doe',
 * //   details: {
 * //     bio: 'Developer',
 * //     hobbies: ['Coding', 'Reading']
 * //   }
 * // }
 *
 * @param {Record<string, unknown>} payload The object to strip tags.
 *
 * @return {Record<string, unknown>} The object without tags.
 */
const stripTags = (payload: Record<string, unknown>) => {
  const { ...attributes } = payload;

  Object.entries(attributes).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      attributes[key] = value.map((elem) =>
        isPlainObject(elem) ? stripTags(elem) : sanitizeString(elem),
      );
    } else if (isPlainObject(value)) {
      attributes[key] = stripTags(value);
    } else {
      attributes[key] = sanitizeString(value);
    }
  });

  return attributes;
};

/**
 * @func sanitizeBody
 * @description Sanitize the request body from any XSS attacks.
 *
 * @param {BaseRequest} req   The express request object.
 * @param {Response} res      The express response object.
 * @param {NextFunction} next The express Callback argument.
 *
 * @return {object} The next middleware function.
 */
export const sanitizeBody = (req: BaseRequest, _res: Response, next: NextFunction) => {
  if (req.body) {
    const { _id, ...attributes } = req.body;
    req.body = stripTags(attributes);
  }

  next();
};

export default sanitizeBody;
