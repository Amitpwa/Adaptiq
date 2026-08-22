import { Metadata } from 'next';
import { listGoals } from '@/repositories/curriculum';
import { OnboardingFlow } from '@/ui/onboarding/OnboardingFlow';
import type { GoalOption } from '@/ui/onboarding/GoalSelectionStep';

export const metadata: Metadata = {
  title: 'Onboarding & Diagnostic Calibration · Adaptiq',
  description: 'Select your learning goal, calibrate explanatory style, and run the adaptive diagnostic.',
};

export const dynamic = 'force-dynamic';

export default async function OnboardingPage() {
  let initialGoals: GoalOption[] = [];
  try {
    const goals = await listGoals();
    initialGoals = goals.map((g) => ({
      slug: g.slug,
      title: g.title,
      description: g.description,
      conceptCount: g._count.concepts,
    }));
  } catch (error) {
    console.error('Failed to prefetch goals for onboarding page:', error);
  }

  return <OnboardingFlow initialGoals={initialGoals} />;
}
