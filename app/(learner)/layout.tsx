import { redirect } from 'next/navigation';

import { getCurrentUser } from '@/auth/session';
import { AppShell } from '@/ui/app/AppShell';

/**
 * Authenticated learner layout.
 *
 * Verifies session against the database and wraps the learner views inside
 * the unified AppShell chrome.
 */
export default async function LearnerLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  return <AppShell userName={user.name}>{children}</AppShell>;
}
