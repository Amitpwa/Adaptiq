'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useQuery } from '@tanstack/react-query';

import { tokens } from '@/ui/tokens';
import { soundFx } from '@/ui/audio/sound';

export interface GoalOption {
  slug: string;
  title: string;
  description: string;
  conceptCount: number;
}

export function GoalSelectionStep({
  onSelectGoal,
  isPending = false,
}: {
  onSelectGoal: (goalSlug: string) => void;
  isPending?: boolean;
}) {
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);

  const { data: goals, isLoading, error } = useQuery<GoalOption[]>({
    queryKey: ['goals'],
    queryFn: async () => {
      const res = await fetch('/api/goals');
      if (!res.ok) throw new Error('Failed to fetch learning goals');
      const payload = await res.json();
      return payload.data ?? payload;
    },
  });

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress size={32} />
      </Box>
    );
  }

  if (error || !goals) {
    return (
      <Typography color="error" variant="body1">
        Unable to load learning goals right now. Please refresh or try again later.
      </Typography>
    );
  }

  return (
    <Stack spacing={4}>
      <Stack spacing={1}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <Typography variant="caption" sx={{ color: tokens.color.googleBlue, fontWeight: 800, textTransform: 'uppercase' }}>
            Curriculum
          </Typography>
          <Typography variant="caption" sx={{ color: tokens.color.googleGreen, fontWeight: 800, textTransform: 'uppercase' }}>
            Target
          </Typography>
        </Stack>
        <Typography variant="h2" component="h1">
          Choose your learning goal
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: 640 }}>
          Adaptiq will map your knowledge against this curriculum, finding what you already know and building the shortest path to mastery.
        </Typography>
      </Stack>

      <Box
        sx={{
          display: 'grid',
          gap: 2.5,
          gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
        }}
      >
        {goals.map((goal) => {
          const isSelected = selectedSlug === goal.slug;
          return (
            <Card
              key={goal.slug}
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
                  setSelectedSlug(goal.slug);
                }}
                sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}
              >
                <CardContent sx={{ p: 0, width: '100%' }}>
                  <Stack spacing={1.5}>
                    <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
                      <Typography variant="h3" component="h2" sx={{ fontSize: '1.25rem' }}>
                        {goal.title}
                      </Typography>
                      <Chip
                        label={`${goal.conceptCount} concepts`}
                        size="small"
                        sx={{
                          bgcolor: isSelected ? 'background.paper' : tokens.color.lockedFill,
                          color: isSelected ? tokens.color.googleBlue : tokens.color.textSecondary,
                          fontWeight: 700,
                          fontSize: '0.75rem',
                        }}
                      />
                    </Stack>
                    <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.6 }}>
                      {goal.description}
                    </Typography>
                  </Stack>
                </CardContent>
              </CardActionArea>
            </Card>
          );
        })}
      </Box>

      <Button
        variant="contained"
        disabled={!selectedSlug || isPending}
        onClick={() => {
          soundFx.playClick();
          if (selectedSlug) onSelectGoal(selectedSlug);
        }}
        sx={{
          alignSelf: 'flex-start',
          px: 4,
          py: 1.5,
          bgcolor: tokens.color.googleBlue,
          '&:hover': { bgcolor: tokens.color.primaryDark },
        }}
      >
        {isPending ? 'Preparing Diagnostic…' : 'Continue to Preferences →'}
      </Button>
    </Stack>
  );
}
