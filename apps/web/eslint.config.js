import eslint from '@eslint/js';
import importPlugin from 'eslint-plugin-import-x';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const generatedFiles = ['src/api/generated/**', 'src/routeTree.gen.ts'];
const stylesheetImportPattern = {
  group: ['**/*.css', '**/*.scss', '**/*.sass', '**/*.less'],
  message: 'Use Ant Design tokens and component styles; do not import stylesheet files.',
};

const forbidLayers = (layers, message) => [
  'error',
  {
    patterns: [
      stylesheetImportPattern,
      ...layers.flatMap((layer) => [
        { group: [`@${layer}`, `@${layer}/**`], message },
        { group: [`**/${layer}`, `**/${layer}/**`], message },
      ]),
    ],
  },
];

export default tseslint.config(
  {
    ignores: ['dist/**', 'node_modules/**', ...generatedFiles],
  },
  eslint.configs.recommended,
  {
    files: ['**/*.{js,mjs,cjs}'],
    languageOptions: { globals: globals.node },
  },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [...tseslint.configs.recommendedTypeChecked, ...tseslint.configs.stylisticTypeChecked],
    languageOptions: {
      ecmaVersion: 2023,
      globals: globals.browser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      'import-x': importPlugin,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    settings: {
      'import-x/resolver': {
        typescript: {
          noWarnOnMultipleProjects: true,
          project: ['tsconfig.app.json', 'tsconfig.node.json'],
        },
      },
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['error', { allowConstantExport: true }],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      'import-x/no-cycle': ['error', { ignoreExternal: true }],
      'import-x/no-duplicates': 'error',
      'import-x/no-unresolved': ['error', { commonjs: true }],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            stylesheetImportPattern,
            {
              group: ['@modules/*/*'],
              message: 'Import another module only through its public index.ts API.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/routes/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/only-throw-error': 'off',
      'react-refresh/only-export-components': 'off',
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            stylesheetImportPattern,
            {
              group: ['@app/**', '!@app/layouts', '!@app/layouts/**'],
              message: 'Routes may import app code only through app/layouts.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/modules/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': forbidLayers(
        ['app', 'routes'],
        'Modules must not depend on app or routes.',
      ),
    },
  },
  {
    files: ['src/api/**/*.{ts,tsx}'],
    ignores: generatedFiles,
    rules: {
      'no-restricted-imports': forbidLayers(
        ['app', 'modules', 'routes'],
        'API infrastructure must not depend on app, modules, or routes.',
      ),
    },
  },
  {
    files: ['src/shared/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': forbidLayers(
        ['api', 'app', 'modules', 'routes'],
        'Shared code must remain business-agnostic.',
      ),
    },
  },
);
