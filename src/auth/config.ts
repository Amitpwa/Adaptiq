import NextAuth, { type NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

import { prisma } from '@/lib/db';
import { burnTimingBudget, verifyPassword } from './password';

/**
 * Authentication configuration.
 *
 * JWT session strategy: no session table read on every request, which matters
 * when every page is a serverless invocation. The trade-off is that a token
 * carries a snapshot of role and identity, so anything security-critical
 * re-reads the database — see `requireUser` in src/auth/session.ts. The token
 * is a hint; the database is the authority.
 */
export const authConfig: NextAuthConfig = {
  session: { strategy: 'jwt', maxAge: 60 * 60 * 24 * 7 },
  pages: { signIn: '/login', error: '/login' },
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(raw) {
        const email = typeof raw?.email === 'string' ? raw.email.trim().toLowerCase() : '';
        const password = typeof raw?.password === 'string' ? raw.password : '';
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({
          where: { email },
          select: { id: true, email: true, name: true, role: true, passwordHash: true },
        });

        if (!user) {
          // Spend the same time hashing as a real comparison would, so an
          // attacker cannot distinguish "no such account" from "wrong
          // password" by response time.
          await burnTimingBudget(password);
          return null;
        }

        const valid = await verifyPassword(password, user.passwordHash);
        if (!valid) return null;

        // Only non-sensitive fields go into the token. The password hash must
        // never leave this function.
        return { id: user.id, email: user.email, name: user.name, role: user.role };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = (user as { role?: string }).role ?? 'LEARNER';
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
