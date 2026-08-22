import 'server-only';

import pino from 'pino';

import { env } from './env';

/**
 * Structured logger.
 *
 * Redaction is configured rather than left to discipline: secrets reach log
 * calls through nested objects far more often than anyone intends, and a
 * leaked key in a log drain is as bad as a leaked key anywhere else.
 */
export const logger = pino({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  redact: {
    paths: [
      'password',
      'passwordHash',
      'apiKey',
      'ciphertext',
      'authorization',
      '*.password',
      '*.passwordHash',
      '*.apiKey',
      '*.ciphertext',
      'req.headers.authorization',
      'req.headers.cookie',
      'headers["x-api-key"]',
    ],
    censor: '[redacted]',
  },
  base: undefined,
});
