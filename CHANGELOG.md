# Changelog

All notable changes to this project will be documented in this file. The format
is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this
project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
