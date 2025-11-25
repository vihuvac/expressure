/**
 * Required modules.
 */
import compression from 'compression';
import config from 'config';
import cookieParser from 'cookie-parser';
import express from 'express';
import httpContext from 'express-http-context';
import * as OpenApiValidator from 'express-openapi-validator';
import fs from 'fs';
import helmet from 'helmet';
import yaml from 'js-yaml';
import path from 'path';
import swaggerUI, { type JsonObject } from 'swagger-ui-express';

import 'module-alias/register';

import { logger } from '@libs';
import { corsMiddleware, expressLogger, handleErrors, sanitizeBody } from '@middlewares';
import type { Application, NextFunction, Request, Response } from 'express';

type MiddlewareFunction = (req: Request, res: Response, next: NextFunction) => void;

// Get values from environment variables.
const { NODE_ENV } = process.env;

// Get defined configs to run the app.
const port = config.get('port');
const apiSpec = path.join(__dirname, config.get('apiSpec'));

// Create the express app.
const app: Application = express();

// Set app middlewares.
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(sanitizeBody);
app.use(corsMiddleware);

if (process.env.NODE_ENV === 'production') {
  app.use(helmet());
  app.use(compression());
}

app.use(expressLogger);
app.use(httpContext.middleware as unknown as MiddlewareFunction);

// Enable the Swagger UI only for the development environment.
if (NODE_ENV !== 'production') {
  // Just log the Swagger UI URL only for the development environment.
  logger.info(`Swagger-ui is available on http://localhost:${port}/api/docs`);

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

app.listen(port, () =>
  logger.info(`The app is running on port ${port} (http://localhost:${port}/api/v1)`),
);
