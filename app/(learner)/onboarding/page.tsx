import { Metadata } from 'next';
import { OnboardingFlow } from '@/ui/onboarding/OnboardingFlow';

export const metadata: Metadata = {
  title: 'Onboarding & Diagnostic Calibration · Adaptiq',
  description: 'Select your learning goal, calibrate explanatory style, and run the adaptive diagnostic.',
};

export default function OnboardingPage() {
  return <OnboardingFlow />;
}
