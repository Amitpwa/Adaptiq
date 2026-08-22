import 'server-only';

import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

import { AppError, isAppError } from './errors';
import { logger } from './logger';

/**
 * Shared API wrapper.
 *
 * Every route handler goes through this so that error shape, status codes, and
 * logging are decided once. Without it each route reinvents its own error
 * response and one of them eventually leaks a stack trace.
 */

export interface ApiSuccess<T> {
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiFailure {
  error: { code: string; message: string; details?: unknown };
}

export function ok<T>(data: T, meta?: Record<string, unknown>, status = 200): NextResponse {
  const body: ApiSuccess<T> = meta ? { data, meta } : { data };
  return NextResponse.json(body, { status });
}

export function created<T>(data: T): NextResponse {
  return ok(data, undefined, 201);
}

export function noContent(): NextResponse {
  return new NextResponse(null, { status: 204 });
}

function failure(status: number, code: string, message: string, details?: unknown): NextResponse {
  const body: ApiFailure = { error: details ? { code, message, details } : { code, message } };
  return NextResponse.json(body, { status });
}

/**
 * Wrap a route handler with uniform error translation.
 *
 * Unknown errors become a generic 500: the real message is logged server-side
 * and never returned, because internal errors routinely contain query
 * fragments, file paths, and connection details.
 */
export function withApi<Args extends unknown[]>(
  handler: (...args: Args) => Promise<NextResponse>,
): (...args: Args) => Promise<NextResponse> {
  return async (...args: Args) => {
    try {
      return await handler(...args);
    } catch (error) {
      if (error instanceof ZodError) {
        // Field-level messages are safe and genuinely useful to the client.
        const details = error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        }));
        return failure(400, 'VALIDATION_ERROR', 'Some of those details need fixing.', details);
      }

      if (isAppError(error)) {
        const appError = error as AppError;
        if (appError.status >= 500) {
          logger.error({ code: appError.code, message: appError.message }, 'API error');
        }
        return failure(appError.status, appError.code, appError.message, appError.details);
      }

      logger.error(
        { err: error instanceof Error ? error.message : String(error) },
        'Unhandled API error',
      );
      return failure(500, 'INTERNAL_ERROR', 'Something went wrong on our side. Please try again.');
    }
  };
}

/**
 * Best-effort client identifier for rate limiting.
 *
 * Vercel sets x-forwarded-for; the leftmost entry is the client. This is
 * spoofable in general, which is why it is only ever used for rate limiting
 * and never for authorization.
 */
export function clientIdentifier(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const first = forwarded?.split(',')[0]?.trim();
  return first && first.length > 0 ? first : 'unknown';
}
