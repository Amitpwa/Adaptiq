import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { requireUser } from '@/auth/session';
import { getDashboardSummary } from '@/services/dashboard';
import { listRecommendations } from '@/services/recommendation';
import { getKnowledgeGraph } from '@/services/graph';
import { DashboardView } from '@/ui/dashboard/DashboardView';

export const metadata: Metadata = {
  title: 'Knowledge Map & Progress Dashboard · Adaptiq',
  description: 'Track your evolving knowledge state, explore your cognitive map, and see next recommendations.',
};

/**
 * Server-rendered Dashboard:
 * Directly fetches data server-side in parallel without multiple client round-trips
 * or cold-start fetch cascades, rendering the knowledge graph instantly.
 */
export default async function DashboardPage() {
  const user = await requireUser();

  const summary = await getDashboardSummary(user.id);
  if (!summary) {
    redirect('/onboarding');
  }

  const [recommendations, graphData] = await Promise.all([
    listRecommendations(user.id),
    getKnowledgeGraph(user.id, summary.goalSlug),
  ]);

  return (
    <DashboardView
      initialSummary={summary}
      initialRecommendations={recommendations}
      initialGraphData={graphData}
    />
  );
}
