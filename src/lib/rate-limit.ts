import 'server-only';

import { prisma } from './db';
import { RateLimitedError } from './errors';

/**
 * Fixed-window rate limiting backed by Postgres.
 *
 * Serverless functions cannot share an in-process counter — each invocation
 * gets its own memory, so an in-memory limiter counts to one forever and
 * protects nothing. The database is the only shared state available, and a
 * single atomic upsert is cheap enough for the endpoints that need guarding.
 *
 * Fixed windows (rather than sliding) are chosen for exactly that reason: the
 * whole check is one statement with no read-then-write race.
 */

export interface RateLimitRule {
  /** Distinct bucket name, e.g. 'login' or 'llm-validate'. */
  name: string;
  limit: number;
  windowSeconds: number;
}

export const RATE_LIMITS = {
  LOGIN: { name: 'login', limit: 8, windowSeconds: 15 * 60 },
  REGISTER: { name: 'register', limit: 5, windowSeconds: 15 * 60 },
  /**
   * Key validation calls an external provider, so an unguarded endpoint would
   * let someone use this server as a free key-testing oracle.
   */
  LLM_VALIDATE: { name: 'llm-validate', limit: 6, windowSeconds: 10 * 60 },
  TUTOR: { name: 'tutor', limit: 60, windowSeconds: 60 },
  ANSWER: { name: 'answer', limit: 120, windowSeconds: 60 },
} as const satisfies Record<string, RateLimitRule>;

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

/** Start of the current fixed window, so all callers agree on the bucket. */
function windowStart(windowSeconds: number, now: Date): Date {
  const windowMs = windowSeconds * 1000;
  return new Date(Math.floor(now.getTime() / windowMs) * windowMs);
}

/**
 * Consume one unit against a bucket.
 *
 * `identifier` should be the most specific stable thing available: a user id
 * when authenticated, otherwise the client IP.
 */
export async function consume(
  rule: RateLimitRule,
  identifier: string,
  now: Date = new Date(),
): Promise<RateLimitResult> {
  const start = windowStart(rule.windowSeconds, now);
  const key = `${rule.name}:${identifier}`;
  const resetAt = new Date(start.getTime() + rule.windowSeconds * 1000);

  // One atomic statement: insert the bucket or increment it, returning the new
  // count. No read-modify-write window for concurrent invocations to race in.
  const rows = await prisma.$queryRaw<Array<{ count: number }>>`
    INSERT INTO rate_limits (key, "windowStart", count)
    VALUES (${key}, ${start}, 1)
    ON CONFLICT (key, "windowStart")
    DO UPDATE SET count = rate_limits.count + 1
    RETURNING count
  `;

  const count = rows[0]?.count ?? 1;
  return {
    allowed: count <= rule.limit,
    remaining: Math.max(0, rule.limit - count),
    resetAt,
  };
}

/** Consume and throw if the caller is over the limit. */
export async function enforce(rule: RateLimitRule, identifier: string): Promise<void> {
  const result = await consume(rule, identifier);
  if (!result.allowed) {
    const seconds = Math.max(1, Math.ceil((result.resetAt.getTime() - Date.now()) / 1000));
    throw RateLimitedError(`Too many attempts. Try again in about ${describe(seconds)}.`);
  }
}

function describe(seconds: number): string {
  if (seconds < 60) return `${seconds} seconds`;
  const minutes = Math.ceil(seconds / 60);
  return minutes === 1 ? 'a minute' : `${minutes} minutes`;
}

/**
 * Delete expired buckets. Called opportunistically rather than on a schedule,
 * since Vercel cron would be another moving part for a table that stays small.
 */
export async function pruneExpired(olderThan: Date): Promise<number> {
  const result = await prisma.rateLimit.deleteMany({
    where: { windowStart: { lt: olderThan } },
  });
  return result.count;
}
