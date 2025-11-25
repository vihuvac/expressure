/**
 * @ignore
 * Required modules.
 */
import type { Config } from 'jest';

// Export jest settings.
const config: Config = {
  preset: 'ts-jest',
  testMatch: ['**/?(*.)test.ts'],
  moduleNameMapper: {
    '^@constants(.*)$': '<rootDir>/src/app/constants/$1',
    '^@controllers(.*)$': '<rootDir>/src/app/controllers/$1',
    '^@helpers(.*)$': '<rootDir>/src/app/helpers/$1',
    '^@libs(.*)$': '<rootDir>/src/app/libs/$1',
    '^@middlewares(.*)$': '<rootDir>/src/app/middlewares/$1',
    '^@services(.*)$': '<rootDir>/src/app/services/$1',
    '^@mocks(.*)$': '<rootDir>/src/tests/mocks/$1',
  },
  verbose: true,
  collectCoverage: true,
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
};

export default config;
