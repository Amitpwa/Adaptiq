import type { Metadata } from 'next';

import { requireUser } from '@/auth/session';
import { getDueReviews } from '@/services/review';
import { ReviewQueueComponent } from '@/ui/review/ReviewQueueComponent';

export const metadata: Metadata = {
  title: 'Spaced Retrieval Queue · Adaptiq',
  description: 'Interleaved micro-probes for concepts on the Ebbinghaus decay curve.',
};

export default async function ReviewPage() {
  const user = await requireUser();
  const initialItems = await getDueReviews(user.id);

  return <ReviewQueueComponent initialItems={initialItems} />;
}
