import { Metadata } from 'next';
import { PathViewComponent } from '@/ui/path/PathViewComponent';

export const metadata: Metadata = {
  title: 'Topological Learning Path · Adaptiq',
  description: 'Sequential topological path through concepts pruned for your goal.',
};

export default function PathPage() {
  return <PathViewComponent />;
}
