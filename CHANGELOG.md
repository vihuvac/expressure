# Changelog

All notable changes to this project will be documented in this file. The format
is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this
project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
