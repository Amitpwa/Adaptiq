'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import { useMutation } from '@tanstack/react-query';

import { StepIndicator } from '@/ui/components/StepIndicator';
import { GoalSelectionStep } from '@/ui/onboarding/GoalSelectionStep';
import { LensPreferenceStep, type CognitiveLens } from '@/ui/onboarding/LensPreferenceStep';
import { DiagnosticRunner } from '@/ui/onboarding/DiagnosticRunner';
import { tokens } from '@/ui/tokens';

export function OnboardingFlow() {
  const router = useRouter();
  const [step, setStep] = useState<number>(1);
  const [goalSlug, setGoalSlug] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Start Diagnostic Mutation
  const startDiagnosticMutation = useMutation({
    mutationFn: async (selectedGoalSlug: string) => {
      const res = await fetch('/api/diagnostic/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goalSlug: selectedGoalSlug }),
      });
      if (!res.ok) throw new Error('Failed to start diagnostic');
      return (await res.json()).data;
    },
    onSuccess: (data) => {
      setSessionId(data.sessionId);
      setStep(2);
    },
  });

  // Save Preferences Mutation
  const savePreferencesMutation = useMutation({
    mutationFn: async (preferredLens: CognitiveLens) => {
      const res = await fetch('/api/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferredLens }),
      });
      if (!res.ok) throw new Error('Failed to save preferences');
      return (await res.json()).data;
    },
    onSuccess: () => {
      setStep(3);
    },
  });

  return (
    <Box component="main" id="main-content" sx={{ py: { xs: 4, md: 6 }, minHeight: '100vh' }}>
      <Container maxWidth="md">
        <Stack spacing={4}>
          <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <Link href="/" aria-label="Adaptiq home">
              <Image
                src="/adaptiq-logo.svg"
                alt="Adaptiq"
                width={112}
                height={30}
                priority
                style={{ height: 'auto' }}
              />
            </Link>
          </Stack>

          <Paper sx={{ p: { xs: 3, md: 5 }, borderRadius: tokens.radius.lg, border: 1, borderColor: 'divider' }}>
            <StepIndicator currentStep={step} />

            {step === 1 && (
              <GoalSelectionStep
                isPending={startDiagnosticMutation.isPending}
                onSelectGoal={(slug) => {
                  setGoalSlug(slug);
                  startDiagnosticMutation.mutate(slug);
                }}
              />
            )}

            {step === 2 && (
              <LensPreferenceStep
                isPending={savePreferencesMutation.isPending}
                onBack={() => setStep(1)}
                onSavePreferences={(lens) => savePreferencesMutation.mutate(lens)}
              />
            )}

            {step === 3 && sessionId && (
              <DiagnosticRunner
                sessionId={sessionId}
                onComplete={() => router.push('/dashboard')}
              />
            )}
          </Paper>
        </Stack>
      </Container>
    </Box>
  );
}
