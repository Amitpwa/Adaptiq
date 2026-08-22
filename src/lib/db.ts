import 'server-only';

import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '@/generated/prisma/client';
import { env } from './env';

/**
 * Prisma client singleton.
 *
 * Two things matter here for a serverless deployment:
 *
 * 1. The client is cached on `globalThis` so hot function invocations reuse one
 *    instance. Without this, every invocation (and every dev hot-reload) opens a
 *    fresh pool and Postgres runs out of connections.
 * 2. It connects through the POOLED url. Neon's pooled endpoint fronts
 *    PgBouncer, which is what lets many concurrent lambdas share a small number
 *    of real Postgres connections. Migrations use DIRECT_URL instead, because
 *    PgBouncer's transaction mode cannot run DDL.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createClient(): PrismaClient {
  const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });
  return new PrismaClient({
    adapter,
    log: env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });
}

export const prisma: PrismaClient = globalForPrisma.prisma ?? createClient();

if (env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
