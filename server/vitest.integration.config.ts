import 'dotenv/config';
import path from 'path';
import { defineConfig } from 'vitest/config';

// Set env BEFORE any imports that create DB connections
// CI Postgres doesn't support SSL; Neon requires it
if (!process.env.DATABASE_URL?.includes('neon.tech')) {
  process.env.DATABASE_SSL_REJECT_UNAUTHORIZED = 'disable';
}
process.env.REDIS_URL = '';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/__integration__/**/*.test.ts'],
    testTimeout: 30_000,
    hookTimeout: 30_000,
    setupFiles: ['src/__integration__/setup.ts'],
  },
  resolve: {
    alias: {
      app: path.resolve(__dirname, 'src'),
    },
  },
});
