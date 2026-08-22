import 'dotenv/config';
import { defineConfig } from 'prisma/config';

/**
 * Prisma CLI configuration.
 *
 * Migrations use DIRECT_URL because Neon's pooled endpoint runs PgBouncer in
 * transaction mode, which cannot execute the session-level statements DDL
 * requires. At runtime the application uses the pooled DATABASE_URL instead
 * (see src/lib/db.ts). Locally the two are usually the same value.
 */
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed/index.ts',
  },
  datasource: {
    url: process.env['DIRECT_URL'] ?? process.env['DATABASE_URL'],
  },
});
