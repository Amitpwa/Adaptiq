import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Route protection.
 *
 * Defence in depth only — this checks for the presence of a session cookie to
 * avoid rendering an authenticated shell for a signed-out visitor. It is NOT
 * the authorization boundary: every API route and server component
 * independently calls `requireUser()`, which verifies the session against the
 * database. A forged cookie gets past this and nowhere else.
 */
const PROTECTED_PREFIXES = ['/dashboard', '/onboarding', '/diagnostic', '/path', '/learn', '/profile'];

const SESSION_COOKIES = [
  'authjs.session-token',
  '__Secure-authjs.session-token',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  if (!isProtected) return NextResponse.next();

  const hasSession = SESSION_COOKIES.some((name) => request.cookies.has(name));
  if (hasSession) return NextResponse.next();

  const login = new URL('/login', request.url);
  // Preserve where they were heading so sign-in can return them there.
  login.searchParams.set('next', pathname);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ['/dashboard/:path*', '/onboarding/:path*', '/diagnostic/:path*', '/path/:path*', '/learn/:path*', '/profile/:path*'],
};
