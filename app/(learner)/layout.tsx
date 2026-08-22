import { redirect } from 'next/navigation';

import { getCurrentUser } from '@/auth/session';
import { AppShell } from '@/ui/app/AppShell';

/**
 * Authenticated learner layout.
 *
 * The session is verified against the database here, not merely read from the
 * cookie. Middleware only checks that a cookie exists, which is a rendering
 * optimisation rather than a security control — this is the real gate.
 */
export default async function LearnerLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  return <AppShell userName={user.name}>{children}</AppShell>;
}
