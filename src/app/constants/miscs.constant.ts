/**
 * Required Modules.
 */
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
