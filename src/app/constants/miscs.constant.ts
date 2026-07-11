/**
 * Required Modules.
 */
import config from 'config';
import { readFileSync } from 'fs';
import path from 'path';

/**
 * @ignore
 * @constant
 * @description Retrieve package version and metadata, useful for API logging.
 *
 * Example:
 * {
 *   "name": "expressure",
 *   "version": "1.0.0",
 *   ...
 * }
 */
export const packageInfo: Record<string, unknown> = JSON.parse(
  readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'),
);

/**
 * @constant apiSettings
 * @description Configure the API settings based on environment variables.
 */
export const apiSettings = Object.freeze({
  environment: process.env.NODE_ENV,
  enableApiDocs: process.env.ENABLE_API_DOCS === 'true',
  port: Number(process.env.PORT || config.get('port')),
});
