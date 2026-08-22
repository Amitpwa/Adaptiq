import 'dotenv/config';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@/app': fileURLToPath(new URL('./app', import.meta.url)),
      'server-only': fileURLToPath(new URL('./tests/shims/server-only.ts', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.{ts,tsx}'],
    exclude: ['tests/e2e/**', 'node_modules/**'],
    coverage: {
      provider: 'v8',
      include: ['src/engine/**', 'src/services/**', 'src/lib/**'],
      exclude: ['src/generated/**'],
    },
    // The engine is pure and needs no DOM, so the default environment stays
    // `node` and fast. Component tests opt into jsdom per file with a
    // `@vitest-environment jsdom` docblock (environmentMatchGlobs was removed
    // in Vitest 4).
  },
});
