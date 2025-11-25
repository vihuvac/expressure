/**
 * @ignore
 * Export all available modules.
 */
import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import prettierConfig from 'eslint-config-prettier';
import jestPlugin from 'eslint-plugin-jest';
import prettierPlugin from 'eslint-plugin-prettier';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // Ignore patterns for performance
  {
    ignores: [
      '*.min.js',
      'node_modules/**',
      'build/**',
      'dist/**',
      'coverage/**',
      'pnpm-lock.yaml',
      'yarn.lock',
      'package-lock.json',
    ],
  },

  // Base JavaScript recommended rules
  js.configs.recommended,

  // Airbnb base configuration (without TypeScript-specific rules that cause conflicts)
  ...compat.extends('airbnb-base'),

  // Prettier config (MUST be last to override other formatting rules)
  prettierConfig,

  // TypeScript configuration
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        project: ['./tsconfig.json'],
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      // TypeScript recommended rules
      ...tsPlugin.configs.recommended.rules,

      // Configure no-unused-vars to allow underscore prefix
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
    },
  },

  // Global rules and settings
  {
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      // Allow underscore dangle for Node.js globals
      'no-underscore-dangle': [
        'error',
        {
          allow: ['__filename', '__dirname'],
        },
      ],

      // Import rules
      'import/extensions': [
        'error',
        'ignorePackages',
        {
          ts: 'never',
          tsx: 'never',
        },
      ],

      // Prettier integration
      'prettier/prettier': 'error',

      // Align with Prettier's printWidth
      'max-len': [
        'error',
        {
          code: 100,
          tabWidth: 2,
        },
      ],

      // Disable import/prefer-default-export for index files
      'import/prefer-default-export': 'off',
    },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        node: true,
        es6: true,
      },
    },
    settings: {
      'import/resolver': {
        node: {
          extensions: ['.js', '.ts'],
        },
        alias: {
          map: [
            ['@constants', './src/app/constants'],
            ['@controllers', './src/app/controllers'],
            ['@helpers', './src/app/helpers'],
            ['@libs', './src/app/libs'],
            ['@middlewares', './src/app/middlewares'],
            ['@services', './src/app/services'],
            ['@mocks', './src/tests/mocks'],
          ],
          extensions: ['.ts'],
        },
      },
    },
  },

  // Configuration files override
  // Disable import/no-extraneous-dependencies for config files since they legitimately
  // import devDependencies (ESLint plugins, build tools, etc.) which is expected behavior.
  // Also disable no-underscore-dangle for Node.js globals like __filename and __dirname.
  {
    files: ['**/*.config.{js,mjs,ts}', '**/*.setup.{js,ts}', '**/*.{js,mjs}', 'jest.*', 'eslint.*'],
    rules: {
      'import/no-extraneous-dependencies': 'off',
    },
  },

  // Jest configuration for test files
  {
    files: [
      '**/tests/**/*.{js,ts,tsx}',
      '**/?(*.)+(spec|test).{js,ts,tsx}',
      '**/*.test.{js,ts,tsx}',
      '**/*.spec.{js,ts,tsx}',
      '**/*.setup.{js,ts,tsx}',
    ],
    plugins: {
      jest: jestPlugin,
    },
    languageOptions: {
      globals: {
        ...jestPlugin.environments.globals.globals,
        expect: 'readonly',
        assert: 'readonly',
      },
    },
    rules: {
      // Custom Jest rules
      'jest/no-disabled-tests': 'warn',
      'jest/no-focused-tests': 'error',
      'jest/no-identical-title': 'error',
      'jest/prefer-to-have-length': 'warn',
      'jest/valid-expect': 'error',
      'import/no-extraneous-dependencies': [
        'error',
        {
          devDependencies: true, // Allow all dev dependencies in test files
        },
      ],
      // Allow node-mocks-http underscore methods in test files
      'no-underscore-dangle': [
        'error',
        {
          allow: [
            '__PINO_FACTORY__',
            '__MOCK_PINO_LOGGER__',
            '_getStatusCode',
            '_getJSONData',
            '_getData',
            '_getHeaders',
            '_isEndCalled',
            '_isJSON',
            '_isUTF8',
            '_getRedirectUrl',
            '_getBuffer',
          ],
        },
      ],
    },
    settings: {
      jest: {
        version: 'latest',
      },
    },
  },
];

export default eslintConfig;
