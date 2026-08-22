import next from 'eslint-config-next';
import tseslint from 'typescript-eslint';

/**
 * Flat config.
 *
 * `eslint-config-next` v16 already ships flat config, so it is imported
 * directly. Routing it through @eslint/eslintrc's FlatCompat shim fails —
 * the shim tries to JSON-serialise a config object that contains circular
 * plugin references.
 */
export default tseslint.config(
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'src/generated/**',
      'playwright-report/**',
      'test-results/**',
      'next-env.d.ts',
    ],
  },
  ...next,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      // Logging goes through the structured logger, which redacts secrets.
      // A bare console.log bypasses that.
      'no-console': ['error', { allow: ['warn', 'error'] }],
    },
  },
  {
    // Seeds, scripts, and tests legitimately report progress to a terminal.
    files: ['prisma/**', 'tests/**', 'scripts/**', '*.config.*'],
    rules: { 'no-console': 'off' },
  },
);
