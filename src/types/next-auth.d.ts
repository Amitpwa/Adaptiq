import type { DefaultSession } from 'next-auth';

/**
 * Session/JWT shape augmentation.
 *
 * `role` is carried for UI decisions only. Every privileged server path
 * re-reads the role from the database — a token is a client-held artefact and
 * is never the authorization source of truth.
 */
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: string;
    } & DefaultSession['user'];
  }

  interface User {
    role?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: string;
  }
}
