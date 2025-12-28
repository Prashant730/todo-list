import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'backend', 'public/sw.js', 'lighthouserc.js']),
  // Frontend React files
  {
    files: ['src/**/*.{js,jsx}'],
    ignores: ['src/test/**'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': [
        'warn',
        {
          varsIgnorePattern: '^_',
          argsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      'react-hooks/exhaustive-deps': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
  // Test files
  {
    files: ['src/test/**/*.{js,jsx}', '**/*.test.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,
        ...globals.node,
        vi: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': 'off',
      'react-refresh/only-export-components': 'off',
    },
  },
])
