import { Metadata } from 'next';
import { ReviewQueueComponent } from '@/ui/review/ReviewQueueComponent';

export const metadata: Metadata = {
  title: 'Spaced Retrieval Queue · Adaptiq',
  description: 'Interleaved micro-probes for concepts on the Ebbinghaus decay curve.',
};

export default function ReviewPage() {
  return <ReviewQueueComponent />;
}
