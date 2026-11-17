// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', 'dist-e2e/*', 'playwright-report/*', 'test-results/*', 'drizzle/*'],
  },
  {
    // Nothing fails silently: every promise is awaited or passed to `run()` (src/lib/errors),
    // which shows the user a message if it fails. `void promise` is not allowed.
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    ignores: ['**/__tests__/**'],
    languageOptions: { parserOptions: { projectService: true, tsconfigRootDir: __dirname } },
    rules: {
      '@typescript-eslint/no-floating-promises': ['error', { ignoreVoid: false }],
      '@typescript-eslint/no-misused-promises': ['error', { checksVoidReturn: { attributes: false } }],
    },
  },
]);
