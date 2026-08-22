/**
 * Error taxonomy.
 *
 * Every failure the API can produce is one of these. Handlers throw them and a
 * single wrapper turns them into responses, so no route invents its own status
 * code or leaks an internal message to the client.
 */

export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RULE_VIOLATION'
  | 'RATE_LIMITED'
  | 'UPSTREAM_UNAVAILABLE'
  | 'INTERNAL_ERROR';

const STATUS_BY_CODE: Record<ErrorCode, number> = {
  VALIDATION_ERROR: 400,
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  RULE_VIOLATION: 422,
  RATE_LIMITED: 429,
  UPSTREAM_UNAVAILABLE: 503,
  INTERNAL_ERROR: 500,
};

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  /** Safe to show the user. Never contains internal detail. */
  readonly details?: unknown;

  constructor(code: ErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = STATUS_BY_CODE[code];
    this.details = details;
  }
}

export const ValidationError = (message: string, details?: unknown) =>
  new AppError('VALIDATION_ERROR', message, details);

export const UnauthenticatedError = (message = 'You need to sign in to do that.') =>
  new AppError('UNAUTHENTICATED', message);

export const ForbiddenError = (message = 'You do not have access to this resource.') =>
  new AppError('FORBIDDEN', message);

export const NotFoundError = (message = 'That resource does not exist.') =>
  new AppError('NOT_FOUND', message);

export const ConflictError = (message: string) => new AppError('CONFLICT', message);

export const RuleViolationError = (message: string) => new AppError('RULE_VIOLATION', message);

export const RateLimitedError = (message = 'Too many attempts. Please wait and try again.') =>
  new AppError('RATE_LIMITED', message);

export const UpstreamError = (message: string) => new AppError('UPSTREAM_UNAVAILABLE', message);

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
