import { Metadata } from 'next';
import { DashboardView } from '@/ui/dashboard/DashboardView';

export const metadata: Metadata = {
  title: 'Knowledge Map & Progress Dashboard · Adaptiq',
  description: 'Track your evolving knowledge state, explore your cognitive map, and see next recommendations.',
};

export default function DashboardPage() {
  return <DashboardView />;
}
