import type { Metadata } from 'next';

import { requireUser } from '@/auth/session';
import { getDashboardSummary } from '@/services/dashboard';
import { getPath } from '@/services/path';
import { PathViewComponent } from '@/ui/path/PathViewComponent';

export const metadata: Metadata = {
  title: 'Topological Learning Path · Adaptiq',
  description: 'Sequential topological path through concepts pruned for your goal.',
};

export default async function PathPage() {
  const user = await requireUser();
  const summary = await getDashboardSummary(user.id);
  const initialPath = summary ? await getPath(user.id, summary.goalSlug) : null;

  return <PathViewComponent initialSummary={summary} initialPath={initialPath} />;
}
