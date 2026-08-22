import type { Metadata } from 'next';

import { requireUser } from '@/auth/session';
import { getConceptStudioData } from '@/services/concept';
import { ConceptStudioView } from '@/ui/learn/ConceptStudioView';

export const metadata: Metadata = {
  title: 'Concept Studio · Adaptiq',
  description: 'Explore concepts through 4 multi-modal explanatory lenses with Socratic scaffolding.',
};

/**
 * Server-rendered Concept Studio:
 * Instantly prefetches curriculum explanations, telemetry, and micro-probes directly from DB.
 */
export default async function LearnConceptPage({ params }: { params: Promise<{ slug: string }> }) {
  const user = await requireUser();
  const { slug } = await params;

  const initialConceptData = await getConceptStudioData(user.id, slug);

  return <ConceptStudioView conceptSlug={slug} initialConceptData={initialConceptData} />;
}
