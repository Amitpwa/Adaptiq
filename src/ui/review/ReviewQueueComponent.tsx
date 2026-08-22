'use client';

import Link from 'next/link';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useQuery } from '@tanstack/react-query';

import { MasteryDots } from '@/ui/graphics/MasteryDots';
import { tokens } from '@/ui/tokens';
import { soundFx } from '@/ui/audio/sound';
import type { ReviewQueueItem } from '@/services/review';

export function ReviewQueueComponent({
  initialItems,
}: {
  initialItems: ReviewQueueItem[];
}) {
  const { data: items } = useQuery<ReviewQueueItem[]>({
    queryKey: ['due-reviews'],
    initialData: initialItems,
    staleTime: 60_000,
    queryFn: async () => {
      const res = await fetch('/api/review');
      if (!res.ok) throw new Error('Failed to load review items');
      const payload = await res.json();
      return payload.data ?? payload;
    },
  });

  return (
    <Box component="main" id="main-content" sx={{ py: { xs: 4, md: 6 } }}>
      <Container maxWidth="lg">
        <Stack spacing={4}>
          <Stack spacing={1}>
            <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <Button
                component={Link}
                href="/dashboard"
                onClick={() => soundFx.playClick()}
                sx={{ fontWeight: 600, color: 'text.secondary' }}
              >
                ← Return to Knowledge Map
              </Button>
              <Chip
                label={`${items?.length ?? 0} Probes Due`}
                size="small"
                sx={{
                  bgcolor: (items?.length ?? 0) > 0 ? tokens.color.fragileFill : tokens.color.masteredFill,
                  color: (items?.length ?? 0) > 0 ? tokens.color.fragile : tokens.color.googleGreen,
                  fontWeight: 700,
                }}
              />
            </Stack>

            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <Typography variant="caption" sx={{ color: tokens.color.googleBlue, fontWeight: 800, textTransform: 'uppercase' }}>
                Ebbinghaus
              </Typography>
              <Typography variant="caption" sx={{ color: tokens.color.googleYellow, fontWeight: 800, textTransform: 'uppercase' }}>
                Memory Retention
              </Typography>
            </Stack>

            <Typography variant="h1" sx={{ fontSize: { xs: '2rem', md: '2.5rem' } }}>
              Spaced Retrieval Queue (PRD FR-2.2)
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: 720 }}>
              Concepts decay over time on the Ebbinghaus forgetting curve R(t) = e^(-t/S). When retrievability falls below 0.70, Adaptiq schedules a targeted 2-minute micro-probe before long-term memory is lost.
            </Typography>
          </Stack>

          {!items || items.length === 0 ? (
            <Paper sx={{ p: 5, textAlign: 'center', borderRadius: tokens.radius.lg, border: 1, borderColor: 'divider' }}>
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  bgcolor: tokens.color.masteredFill,
                  color: tokens.color.googleGreen,
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  mx: 'auto',
                  mb: 2,
                }}
              >
                ✓
              </Box>
              <Typography variant="h3" sx={{ mb: 1 }}>
                All Concepts Retained!
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
                Your memory retrievability scores are currently above the 0.70 retention threshold.
              </Typography>
              <Button
                variant="contained"
                component={Link}
                href="/dashboard"
                onClick={() => soundFx.playClick()}
                sx={{ bgcolor: tokens.color.googleBlue, '&:hover': { bgcolor: tokens.color.primaryDark } }}
              >
                Continue Learning on Map →
              </Button>
            </Paper>
          ) : (
            <Box
              sx={{
                display: 'grid',
                gap: 2.5,
                gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
              }}
            >
              {items.map((item) => (
                <Card
                  key={item.conceptId}
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: tokens.radius.lg,
                    border: 1,
                    borderColor: 'divider',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: 2.5,
                    boxShadow: '0 4px 16px rgba(11, 31, 58, 0.04)',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      borderColor: tokens.color.googleYellow,
                      boxShadow: '0 6px 20px rgba(251, 188, 5, 0.15)',
                      transform: 'translateY(-2px)',
                    },
                  }}
                >
                  <Stack spacing={1.5}>
                    <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="caption" sx={{ color: tokens.color.fragile, fontWeight: 700 }}>
                        Retrievability: {Math.round(item.retrievability * 100)}%
                      </Typography>
                      <Chip label={`~${item.estimatedMinutes} min`} size="small" />
                    </Stack>
                    <Typography variant="h3" sx={{ fontSize: '1.25rem' }}>
                      {item.title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {item.summary}
                    </Typography>
                    <MasteryDots band="FRAGILE" value={item.effectiveMastery} height={36} />
                  </Stack>

                  <Button
                    variant="contained"
                    component={Link}
                    href={`/learn/${item.conceptSlug}`}
                    onClick={() => soundFx.playClick()}
                    sx={{
                      bgcolor: tokens.color.googleBlue,
                      alignSelf: 'flex-start',
                      '&:hover': { bgcolor: tokens.color.primaryDark },
                    }}
                  >
                    Take Retrieval Probe →
                  </Button>
                </Card>
              ))}
            </Box>
          )}
        </Stack>
      </Container>
    </Box>
  );
}
