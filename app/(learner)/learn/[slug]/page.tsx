import { Metadata } from 'next';
import { ConceptStudioView } from '@/ui/learn/ConceptStudioView';

export const metadata: Metadata = {
  title: 'Concept Studio · Adaptiq',
  description: 'Explore concepts through 4 multi-modal explanatory lenses with Socratic scaffolding.',
};

export default async function LearnConceptPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <ConceptStudioView conceptSlug={slug} />;
}
