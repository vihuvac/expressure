/**
 * Required modules.
 */
import compression from 'compression';
import config from 'config';
import cookieParser from 'cookie-parser';
import type { Application, NextFunction, Request, Response } from 'express';
import express from 'express';
import httpContext from 'express-http-context';
import * as OpenApiValidator from 'express-openapi-validator';
import fs from 'fs';
import helmet from 'helmet';
import yaml from 'js-yaml';
import path from 'path';
import swaggerUI, { type JsonObject } from 'swagger-ui-express';
import 'module-alias/register';

import { apiSettings } from '@/app/constants/miscs.constant';
import { logger } from '@/app/libs/logger.lib';
import { corsMiddleware } from '@/app/middlewares/cors.middleware';
import { handleErrors } from '@/app/middlewares/errors.middleware';
import { expressLogger } from '@/app/middlewares/expressLogger.middleware';
import { sanitizeBody } from '@/app/middlewares/sanitizeBody.middleware';

type MiddlewareFunction = (req: Request, res: Response, next: NextFunction) => void;

// Get the API specification file path.
const apiSpec = path.join(__dirname, config.get('apiSpec'));

// Create the express app.
const app: Application = express();

// Set app middlewares.
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(sanitizeBody);
app.use(corsMiddleware);

if (apiSettings.environment === 'production') {
  app.use(helmet());
  app.use(compression());
}

app.use(expressLogger);
app.use(httpContext.middleware as unknown as MiddlewareFunction);

// Enable the Swagger UI only if ENABLE_API_DOCS is set to true.
if (apiSettings.enableApiDocs === true) {
  logger.info(`Swagger-ui is available on http://localhost:${apiSettings.port}/api/docs`);

  // Settings for enabling the Swagger UI.
  const swaggerUIOptions = {
    explorer: true,
  };

  const spec = yaml.load(fs.readFileSync(apiSpec, 'utf8')) as JsonObject;

  app.use('/api/docs', swaggerUI.serve, swaggerUI.setup(spec, swaggerUIOptions));
}

app.use(
  OpenApiValidator.middleware({
    apiSpec,
    validateRequests: true,
    validateResponses: true,
    validateApiSpec: true,
    operationHandlers: path.join(__dirname, 'app', 'controllers'),
  }),
);

// Custom error handler middleware.
app.use(handleErrors);

app.listen(apiSettings.port, '0.0.0.0', () =>
  logger.info(
    `The app is running on port ${apiSettings.port} (http://localhost:${apiSettings.port}/api/v1)`,
  ),
);
