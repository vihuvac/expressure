/**
 * @ignore
 * Required modules.
 */
import type { Config } from 'jest';

const isCi = process.env.CI === 'true';

// Export jest settings.
const config: Config = {
  preset: 'ts-jest',
  testMatch: ['**/?(*.)test.ts'],
  // Recycle workers before RSS spikes cause OOM on small CI runners (see jest-debug logs).
  ...(isCi ? { workerIdleMemoryLimit: '512MB' as const } : {}),
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  verbose: !isCi,
  collectCoverage: true,
  coverageProvider: 'v8',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  collectCoverageFrom: ['**/*.{ts,tsx}'],
  testPathIgnorePatterns: ['/(config|docs|node_modules)/'],
  coveragePathIgnorePatterns: [
    '/*app.ts',
    '/*index.ts',
    '/*config.ts',
    '/*.d.ts',
    '/build/',
    '/coverage/',
    '/config/',
    '/docs/',
    '/specs/',
    '/tests/',
    '/types/',
    '/node_modules/',
  ],
  coverageDirectory: '<rootDir>/src/tests/coverage/',
  testResultsProcessor: 'jest-sonar-reporter',
  // Critical for speed
  maxWorkers: isCi ? 1 : '50%',
  testTimeout: isCi ? 30_000 : 10_000,
  // Only run changed files in watch mode
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname',
  ],
};

export default config;
