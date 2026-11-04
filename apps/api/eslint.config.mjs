// @ts-check

import noRealtiveImportPlugin from 'eslint-plugin-no-relative-import-paths';
import globals from 'globals';

import eslint from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import prettierConfig from 'eslint-config-prettier';
import prettierPlugin from 'eslint-plugin-prettier';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';

const ignores = [
  '**/.eslintrc.js',
  'servers/createEntity.js',
  'dist/*',
  'node_modules/*',
  'logs',
  'src/generated/**',
  'src/i18n/*',
];

export default defineConfig(
  eslint.configs.recommended,
  tseslint.configs.recommended,
  prettierConfig,
  {
    ignores,
    plugins: {
      'no-relative-import-paths': noRealtiveImportPlugin,
      'prettier': prettierPlugin,
      '@stylistic': stylistic,
    },
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      parser: tseslint.parser,
    },

    // Custom rules configuration
    rules: {
      // TypeScript rules
      '@typescript-eslint/prefer-const': 'off',
      '@typescript-eslint/no-unused-vars': [
        'off',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unnecessary-condition': 'off',
      '@typescript-eslint/no-unnecessary-boolean-literal-compare': 'off',

      // Code style
      'prettier/prettier': ['warn', {}, { usePrettierrc: true }],
      '@stylistic/lines-between-class-members': [
        'error',
        'always',
        { exceptAfterSingleLine: true, exceptAfterOverload: true },
      ],
      '@stylistic/max-statements-per-line': ['error', { max: 1 }],
      '@stylistic/padding-line-between-statements': [
        'error',
        { blankLine: 'always', prev: '*', next: 'return' },
        { blankLine: 'always', prev: 'directive', next: '*' },
        { blankLine: 'any', prev: 'directive', next: 'directive' },
        { blankLine: 'always', prev: 'class', next: 'class' },
        { blankLine: 'always', prev: 'export', next: 'export' },
      ],
      '@stylistic/spaced-comment': ['warn', 'always', { markers: ['/'] }],

      // General best practices
      'eqeqeq': ['error', 'always'],
      'no-duplicate-imports': 'error',
      'no-else-return': ['warn', { allowElseIf: false }],
      'prefer-object-spread': 'error',
      // 'no-relative-import-paths/no-relative-import-paths': [
      //   'warn',
      //   { allowSameFolder: true, allowedDepth: 1 },
      // ],
    },
    settings: {
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: './tsconfig.json',
        },
      },
    },
  },
);
