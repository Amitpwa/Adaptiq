'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { tokens } from '@/ui/tokens';
import { soundFx } from '@/ui/audio/sound';

export type CognitiveLens = 'ANALOGY' | 'FIRST_PRINCIPLES' | 'CODE' | 'VISUAL';

interface LensOption {
  id: CognitiveLens;
  title: string;
  badge: string;
  description: string;
  sample: string;
}

const LENSES: LensOption[] = [
  {
    id: 'ANALOGY',
    title: 'Intuitive Analogy',
    badge: 'Mental Models',
    description: 'Anchor new ideas to familiar physical mechanisms and everyday concepts before diving into technical details.',
    sample: '"Think of a pointer like a sticky note with a house address, rather than the house itself."',
  },
  {
    id: 'FIRST_PRINCIPLES',
    title: 'First Principles',
    badge: 'Formal & Rigorous',
    description: 'Build systematically from axioms, mathematical definitions, bounds, and formal invariant proofs.',
    sample: '"Let G=(V,E) be a directed acyclic graph where each vertex v represents a state..."',
  },
  {
    id: 'CODE',
    title: 'Code-First',
    badge: 'Executable',
    description: 'Learn through implementation, test assertions, memory tracing, and concrete syntax.',
    sample: 'const deref = (ptr: number) => memory[ptr]; // direct memory lookup',
  },
  {
    id: 'VISUAL',
    title: 'Visual / Diagrams',
    badge: 'Architectural',
    description: 'Explore concepts through data flow diagrams, memory layouts, state transitions, and interactive graphs.',
    sample: '[Stack Frame] ──points to──> [Heap Object @ 0x7FFE]',
  },
];

export function LensPreferenceStep({
  onSavePreferences,
  onBack,
  isPending = false,
}: {
  onSavePreferences: (lens: CognitiveLens) => void;
  onBack: () => void;
  isPending?: boolean;
}) {
  const [selectedLens, setSelectedLens] = useState<CognitiveLens>('ANALOGY');

  return (
    <Stack spacing={4}>
      <Stack spacing={1}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <Typography variant="caption" sx={{ color: tokens.color.googleBlue, fontWeight: 800, textTransform: 'uppercase' }}>
            Cognitive
          </Typography>
          <Typography variant="caption" sx={{ color: tokens.color.googleYellow, fontWeight: 800, textTransform: 'uppercase' }}>
            Preference
          </Typography>
        </Stack>
        <Typography variant="h2" component="h1">
          Select your default explanatory lens
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: 640 }}>
          Every concept in Adaptiq can be rendered through four different lenses. You can switch lenses anytime during learning.
        </Typography>
      </Stack>

      <Box
        sx={{
          display: 'grid',
          gap: 2.5,
          gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
        }}
      >
        {LENSES.map((lens) => {
          const isSelected = selectedLens === lens.id;
          return (
            <Card
              key={lens.id}
              sx={{
                border: 2,
                borderColor: isSelected ? tokens.color.googleBlue : tokens.color.border,
                bgcolor: isSelected ? tokens.color.primaryLight : 'background.paper',
                borderRadius: tokens.radius.lg,
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor: tokens.color.googleBlue,
                  boxShadow: '0 4px 16px rgba(66, 133, 244, 0.12)',
                  transform: 'translateY(-2px)',
                },
              }}
            >
              <CardActionArea
                onClick={() => {
                  soundFx.playClick();
                  setSelectedLens(lens.id);
                }}
                sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}
              >
                <CardContent sx={{ p: 0, width: '100%' }}>
                  <Stack spacing={1.5}>
                    <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                      <Typography variant="h3" component="h2" sx={{ fontSize: '1.2rem' }}>
                        {lens.title}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: 800,
                          color: isSelected ? tokens.color.googleBlue : tokens.color.textSecondary,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                        }}
                      >
                        {lens.badge}
                      </Typography>
                    </Stack>
                    <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.6 }}>
                      {lens.description}
                    </Typography>
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: tokens.radius.sm,
                        bgcolor: isSelected ? 'background.paper' : tokens.color.lockedFill,
                        fontStyle: 'italic',
                        fontSize: '0.85rem',
                        color: 'text.primary',
                        border: 1,
                        borderColor: 'divider',
                        fontFamily: lens.id === 'CODE' ? 'monospace' : 'inherit',
                      }}
                    >
                      {lens.sample}
                    </Box>
                  </Stack>
                </CardContent>
              </CardActionArea>
            </Card>
          );
        })}
      </Box>

      <Stack direction="row" spacing={2}>
        <Button
          variant="outlined"
          onClick={() => {
            soundFx.playClick();
            onBack();
          }}
          disabled={isPending}
          sx={{ borderColor: tokens.color.border, color: tokens.color.textPrimary }}
        >
          Back
        </Button>
        <Button
          variant="contained"
          disabled={isPending}
          onClick={() => {
            soundFx.playClick();
            onSavePreferences(selectedLens);
          }}
          sx={{
            px: 4,
            py: 1.5,
            bgcolor: tokens.color.googleBlue,
            '&:hover': { bgcolor: tokens.color.primaryDark },
          }}
        >
          {isPending ? 'Saving Preferences…' : 'Start Adaptive Diagnostic →'}
        </Button>
      </Stack>
    </Stack>
  );
}
