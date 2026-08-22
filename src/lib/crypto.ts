import 'server-only';

import { createCipheriv, createDecipheriv, randomBytes, timingSafeEqual } from 'node:crypto';

import { env } from './env';

/**
 * Envelope encryption for learner-supplied secrets (their own LLM API keys).
 *
 * AES-256-GCM is used rather than CBC because it is authenticated: tampering
 * with stored ciphertext causes decryption to fail loudly instead of yielding
 * attacker-influenced plaintext.
 *
 * Threat model this addresses: a database dump (backup leak, SQL injection,
 * compromised read replica) must not yield usable API keys. It does NOT protect
 * against an attacker who already has application-server code execution, since
 * ENCRYPTION_KEY lives in the process environment — mitigating that requires a
 * KMS/HSM, which is a deliberate scope decision recorded here rather than
 * silently assumed away.
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96 bits, the GCM standard
const AUTH_TAG_LENGTH = 16;
const KEY_LENGTH = 32; // 256 bits

function masterKey(): Buffer {
  const key = Buffer.from(env.ENCRYPTION_KEY, 'base64');
  if (key.length !== KEY_LENGTH) {
    throw new Error(
      `ENCRYPTION_KEY must decode to exactly ${KEY_LENGTH} bytes; got ${key.length}. ` +
        'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'base64\'))"',
    );
  }
  return key;
}

/**
 * Encrypt a secret. Output is `base64(iv || authTag || ciphertext)`.
 *
 * A fresh random IV per call is essential: reusing an IV under the same key in
 * GCM is catastrophic, leaking plaintext relationships and forgery capability.
 */
export function encryptSecret(plaintext: string): string {
  if (plaintext.length === 0) {
    throw new Error('Refusing to encrypt an empty secret');
  }
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, masterKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, ciphertext]).toString('base64');
}

/**
 * Decrypt a secret produced by `encryptSecret`.
 *
 * Throws if the payload was truncated or tampered with. Callers must not fall
 * back to a default on failure — a failed decrypt means the stored value is not
 * trustworthy.
 */
export function decryptSecret(payload: string): string {
  const raw = Buffer.from(payload, 'base64');
  if (raw.length <= IV_LENGTH + AUTH_TAG_LENGTH) {
    throw new Error('Encrypted payload is malformed');
  }

  const iv = raw.subarray(0, IV_LENGTH);
  const authTag = raw.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const ciphertext = raw.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

  const decipher = createDecipheriv(ALGORITHM, masterKey(), iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
}

/**
 * The last four characters of a key, for display.
 *
 * Enough for a learner to recognise which key is connected; useless to an
 * attacker on its own.
 */
export function keyHint(secret: string): string {
  return secret.slice(-4);
}

/** Constant-time string comparison, for any secret equality check. */
export function safeEquals(a: string, b: string): boolean {
  const bufferA = Buffer.from(a, 'utf8');
  const bufferB = Buffer.from(b, 'utf8');
  if (bufferA.length !== bufferB.length) return false;
  return timingSafeEqual(bufferA, bufferB);
}
