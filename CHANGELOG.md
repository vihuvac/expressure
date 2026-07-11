# Changelog

All notable changes to this project will be documented in this file. The format
is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this
project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.1.0] - 2026-07-11

There is not a specific ticket for these changes.

### Added

- `pnpm-workspace.yaml` for pnpm 11 settings (`allowBuilds`, dependency overrides).
- `tsconfig.eslint.json` so typed ESLint covers tests while the build `tsconfig` excludes them.
- Pure helpers `resolveLogLevel` and `isOriginAllowed` for testable logger and CORS logic.
- Jest scripts for CI and watch workflows (`test:ci`, `test:watch`, `test:watch:changed`).
- `jest-watch-typeahead` for faster interactive test filtering.
- `ENABLE_API_DOCS` documented in `.env.template`.

### Changed

- Upgraded the toolchain to Node.js 24.18.0, pnpm 11.11.0, TypeScript 6.0.3, and ESLint 9.39.x.
- Updated the GitHub Actions test workflow to Node.js 24.18.0 and let `pnpm/action-setup`
  use the pnpm version from `package.json` `packageManager` (single source of truth).
- Updated runtime dependencies: `config` 4.4.2, `cors` 2.8.6, `date-fns` 4.4.0,
  `express-openapi-validator` 5.6.2, `helmet` 8.2.0, `js-yaml` 5.2.1, `module-alias` 2.3.4,
  `pino` 10.3.1, and `swagger-client` 3.37.5.
- Updated development dependencies: `@typescript-eslint/*` 8.63.0, `eslint` 9.39.4,
  `eslint-plugin-jest` 29.15.4, `jest` 30.4.2, `lint-staged` 17.0.8, `nodemon` 3.1.14,
  `prettier` 3.9.5, `ts-jest` 29.4.11, `tsc-alias` 1.9.0, and related tooling packages.
- Unified path aliases to `@/*` (TypeScript `paths`, Jest `moduleNameMapper`, and `module-alias`).
- Migrated TypeScript config off deprecated `moduleResolution: "node"` / `baseUrl` to
  `moduleResolution: "bundler"` with self-contained `paths`.
- Scoped the build `tsconfig` to app sources (`rootDir` / `include`) so `tsc` emits `build/app.js`.
- Pointed ESLint typed linting at `tsconfig.eslint.json` instead of the build project.
- Removed barrel `index.ts` re-exports under `src/app/*` in favor of direct `@/app/...` imports.
- Removed deprecated `@types/config` (the `config` package ships its own types).
- Hardened Docker builds: Node/Alpine/pnpm bumps, copy `pnpm-workspace.yaml`, set production
  `WORKDIR`, and expand `.dockerignore` whitelists for workspace and tooling files.
- Improved Jest defaults (V8 coverage, parallel workers locally, CI memory limits, typeahead watch plugins).
- Raised unit-test coverage to 100% across application source files.

## [1.0.4] - 2025-12-20

There is not a specific ticket for these changes.

### Added

- A brief reference/description in the changelog for potential tickets/pull requests (PRs) linked to each release.

### Fixed

- Templates to report issues (required property under validations).

## [1.0.3] - 2025-12-20

There is not a specific ticket for these changes.

### Added

- A code of conduct document.
- A security policy document.
- Type definitions for packages that do not provide them (`swagger-client`, and `swagger-model-validator`).
- Issue templates to report bugs and security vulnerabilities.

### Changed

- Updated NPM dependencies to their latest versions.
- Updated the contact information for the developer.
- Updated the README.md file to enhance the references to resources.

## [1.0.2] - 2025-11-24

There is not a specific ticket for these changes.

### Added

- Add `push` trigger alongside `pull_request` to run tests on merge to main
  (ensures Codecov badge for main stays up-to-date).

### Changed

- Drop development branch references from the workflow.

## [1.0.1] - 2025-11-24

There is not a specific ticket for these changes.

### Added

- `paths` to the `pull_request` event to ensure that the workflow is only
  triggered when changes are made for the defined paths.
- `fetch-depth: 0` to the `checkout` action to ensure that the entire repository
  is cloned, which is important for correct path detection in PRs from forks.
- `cache: pnpm` to the `setup-node` action to speed up the workflow.
- A step to install `pnpm` to match the version used in the project.

### Changed

- Move contribution guide to dedicated file and reference it in `README.md`.

## [1.0.0] - 2025-11-24

**Initial release of Expressure** – a modern, production-ready boilerplate for
building scalable Node.js APIs with Express.js, TypeScript, OpenAPI, and Docker.

### Added

- Secure-by-default middleware stack (`helmet`, `cors`, `compression`,
  `cookie-parser`, `xss`) with custom CORS configuration and body XSS
  sanitization (`sanitizeBody`).
- Full OpenAPI 3.1 specification with automatic Swagger UI, JSDoc-driven
  documentation, and embedded Mermaid.js diagram support.
- Strongly typed Express application core with refined type definitions and
  unified HTTP context for maximum type safety.
- Unified mocking layer (`express.mock.ts`) for consistent development, testing,
  and documentation workflows.
- Production-grade multi-stage Dockerfile and Docker Compose setup with
  whitelist-based `.dockerignore` and streamlined NPM scripts.
- Latest Active LTS Node.js runtime with all dependencies and devDependencies
  updated to their latest compatible versions.
- Modern ESLint (flat config), Husky pre-commit hooks, and ready-to-use GitLab
  CI pipeline.
- Clean JSON-based configuration system with sensible defaults and no legacy
  files.
- Centralized and consistent error handling across the entire application.
- Intelligent `req.body` sanitization that removes malicious content while
  preserving original data types.
