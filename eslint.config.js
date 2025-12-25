import eslint from '@eslint/js';
import prettier from 'eslint-config-prettier';
import importPlugin from 'eslint-plugin-import';
import jest from 'eslint-plugin-jest';
import promise from 'eslint-plugin-promise';
import unicorn from 'eslint-plugin-unicorn';
import unusedImports from 'eslint-plugin-unused-imports';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
  {
    ignores: [
      'node_modules/**',
      '**/dist/**',
      'build/**',
      'public/**',
      'coverage/**',
      '.coverage/**',
      'test-results/**',
      'storybook-static/**',
      '*.d.ts',
      '*.config.cjs',
    ],
  },
  {
    files: ['**/*.{js,ts}'],
    plugins: {
      import: importPlugin,
      promise,
      unicorn,
      'unused-imports': unusedImports,
    },
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'module',
      globals: {
        LuciaSDK: true,
        window: true,
        document: true,
        console: true,
        setTimeout: true,
        clearTimeout: true,
        setInterval: true,
        clearInterval: true,
        fetch: true,
        XMLHttpRequest: true,
        navigator: true,
        localStorage: true,
        sessionStorage: true,
        crypto: true,
        TextEncoder: true,
        Uint8Array: true,
        Promise: true,
        URL: true,
        URLSearchParams: true,
        Event: true,
        CustomEvent: true,
        MutationObserver: true,
        IntersectionObserver: true,
        ResizeObserver: true,
        requestAnimationFrame: true,
        cancelAnimationFrame: true,
        performance: true,
        history: true,
        location: true,
        Element: true,
        HTMLElement: true,
        HTMLAnchorElement: true,
        MouseEvent: true,
        KeyboardEvent: true,
        EventTarget: true,
        AbortController: true,
        Headers: true,
        Request: true,
        Response: true,
        Blob: true,
        FormData: true,
        File: true,
        FileReader: true,
        atob: true,
        btoa: true,
        global: true,
        process: true,
        module: true,
        require: true,
        __dirname: true,
        __filename: true,
        exports: true,
        Buffer: true,
      },
    },
    rules: {
      '@typescript-eslint/no-redeclare': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-use-before-define': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-unnecessary-type-constraint': 'off',
      camelcase: 'off',
      'import/order': [
        'error',
        {
          alphabetize: {
            caseInsensitive: true,
            order: 'asc',
          },
          groups: ['builtin', 'external', 'internal', 'sibling', 'parent'],
          'newlines-between': 'always',
        },
      ],
      'import/prefer-default-export': 'off',
      'max-len': [
        'error',
        {
          code: 120,
          ignoreComments: false,
          ignoreRegExpLiterals: true,
          ignoreStrings: true,
          ignoreTemplateLiterals: true,
          tabWidth: 2,
        },
      ],
      'no-nested-ternary': 'off',
      'no-param-reassign': [
        'error',
        {
          ignorePropertyModificationsFor: ['state'],
          props: true,
        },
      ],
      'no-redeclare': 'off',
      'no-shadow': 'off',
      'no-underscore-dangle': 'off',
      'no-unused-vars': 'off',
      'no-use-before-define': 'off',
      'unused-imports/no-unused-imports': 'error',
    },
    settings: {
      'import/resolver': {
        node: {
          extensions: ['.js', '.ts'],
        },
      },
    },
  },
  {
    files: ['**/*.test.{js,ts}', '**/*.spec.{js,ts}'],
    plugins: {
      jest,
    },
    languageOptions: {
      globals: {
        jest: true,
        describe: true,
        it: true,
        test: true,
        expect: true,
        beforeEach: true,
        afterEach: true,
        beforeAll: true,
        afterAll: true,
      },
    },
    rules: {
      ...jest.configs.recommended.rules,
      'import/no-extraneous-dependencies': 'off',
    },
  },
);
