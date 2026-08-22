'use client';

import Link from 'next/link';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Container from '@mui/material/Container';
import LinearProgress from '@mui/material/LinearProgress';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useQuery } from '@tanstack/react-query';

import { tokens } from '@/ui/tokens';
import { soundFx } from '@/ui/audio/sound';
import type { PathView } from '@/services/path';
import type { DashboardSummary } from '@/services/dashboard';

const STATUS_CONFIG: Record<string, { label: string; color: string; fill: string }> = {
  MASTERED: { label: 'Mastered', color: tokens.color.mastered, fill: tokens.color.masteredFill },
  READY: { label: 'Ready to Learn', color: tokens.color.googleBlue, fill: tokens.color.primaryLight },
  IN_PROGRESS: { label: 'In Progress', color: tokens.color.inProgress, fill: tokens.color.inProgressFill },
  GAP: { label: 'Prerequisite Gap', color: tokens.color.googleRed, fill: tokens.color.gapFill },
  LOCKED: { label: 'Locked', color: tokens.color.locked, fill: tokens.color.lockedFill },
};

const DEFAULT_STATUS_CFG = { label: 'Locked', color: tokens.color.locked, fill: tokens.color.lockedFill };

export function PathViewComponent({
  initialSummary,
  initialPath,
}: {
  initialSummary: DashboardSummary | null;
  initialPath: PathView | null;
}) {
  // 1. Summary with initialData
  const { data: summary } = useQuery<DashboardSummary | null>({
    queryKey: ['dashboard-summary'],
    initialData: initialSummary,
    staleTime: 60_000,
    queryFn: async () => {
      const res = await fetch('/api/dashboard/summary');
      if (!res.ok) throw new Error('Failed to fetch summary');
      const payload = await res.json();
      return payload.data ?? payload;
    },
  });

  // 2. Learning path with initialData
  const { data: path } = useQuery<PathView | null>({
    queryKey: ['learning-path', summary?.goalSlug],
    enabled: Boolean(summary?.goalSlug),
    initialData: initialPath,
    staleTime: 60_000,
    queryFn: async () => {
      const res = await fetch(`/api/path?goal=${summary?.goalSlug}`);
      if (!res.ok) throw new Error('Failed to fetch learning path');
      const payload = await res.json();
      return payload.data ?? payload;
    },
  });

  if (!path) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: tokens.radius.lg }}>
          <Typography variant="h2" sx={{ mb: 2 }}>
            No Learning Path Generated
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary', mb: 3 }}>
            Complete your diagnostic onboarding to generate a personalized path.
          </Typography>
          <Button variant="contained" component={Link} href="/onboarding" onClick={() => soundFx.playClick()}>
            Start Diagnostic →
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Box component="main" id="main-content" sx={{ py: { xs: 4, md: 6 } }}>
      <Container maxWidth="lg">
        <Stack spacing={5}>
          {/* Header */}
          <Stack spacing={2}>
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
                label={`${Math.round(path.completion * 100)}% Complete`}
                size="small"
                sx={{
                  bgcolor: tokens.color.masteredFill,
                  color: tokens.color.googleGreen,
                  fontWeight: 700,
                }}
              />
            </Stack>

            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <Typography variant="caption" sx={{ color: tokens.color.googleBlue, fontWeight: 800, textTransform: 'uppercase' }}>
                Topological
              </Typography>
              <Typography variant="caption" sx={{ color: tokens.color.googleGreen, fontWeight: 800, textTransform: 'uppercase' }}>
                Order
              </Typography>
            </Stack>

            <Typography variant="h1" sx={{ fontSize: { xs: '2rem', md: '2.5rem' } }}>
              Topological Path: {path.goalTitle}
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: 720 }}>
              Concepts are ordered such that every prerequisite precedes its dependent node. Mastered concepts are cleared, keeping your focus strictly on your Zone of Proximal Development.
            </Typography>

            <Box sx={{ pt: 1, maxWidth: 480 }}>
              <LinearProgress
                variant="determinate"
                value={path.completion * 100}
                sx={{
                  height: 10,
                  borderRadius: tokens.radius.pill,
                  bgcolor: tokens.color.border,
                  '& .MuiLinearProgress-bar': {
                    bgcolor: tokens.color.googleGreen,
                    borderRadius: tokens.radius.pill,
                  },
                }}
              />
            </Box>
          </Stack>

          {/* Sequential Path Timeline List */}
          <Stack spacing={2.5}>
            {path.nodes.map((node, index) => {
              const cfg = STATUS_CONFIG[node.status] ?? DEFAULT_STATUS_CFG;
              const isActionable = node.status === 'READY' || node.status === 'IN_PROGRESS';

              return (
                <Paper
                  key={node.conceptId}
                  elevation={0}
                  sx={{
                    p: { xs: 2.5, md: 3.5 },
                    borderRadius: tokens.radius.lg,
                    border: 1.5,
                    borderColor: isActionable ? tokens.color.googleBlue : 'divider',
                    bgcolor: isActionable ? 'background.paper' : tokens.color.background,
                    boxShadow: isActionable ? '0 6px 20px rgba(66, 133, 244, 0.12)' : 'none',
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: 'auto 1fr auto' },
                    gap: 3,
                    alignItems: 'center',
                    transition: 'all 0.2s ease',
                    '&:hover': isActionable
                      ? {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 8px 24px rgba(66, 133, 244, 0.18)',
                        }
                      : undefined,
                  }}
                >
                  {/* Step Number Circle */}
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: '50%',
                      bgcolor: cfg.fill,
                      color: cfg.color,
                      display: 'grid',
                      placeItems: 'center',
                      fontWeight: 700,
                      fontSize: '1rem',
                      border: 1,
                      borderColor: cfg.color,
                    }}
                  >
                    {node.status === 'MASTERED' ? '✓' : index + 1}
                  </Box>

                  {/* Concept Details & Explainability Rationale */}
                  <Stack spacing={0.75}>
                    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                      <Typography variant="h3" sx={{ fontSize: '1.25rem' }}>
                        {node.title}
                      </Typography>
                      <Chip
                        label={cfg.label}
                        size="small"
                        sx={{
                          bgcolor: cfg.fill,
                          color: cfg.color,
                          fontWeight: 700,
                          fontSize: '0.7rem',
                        }}
                      />
                    </Stack>

                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {node.summary}
                    </Typography>

                    {node.rationale && (
                      <Typography
                        variant="caption"
                        sx={{
                          color: tokens.color.googleBlue,
                          fontWeight: 600,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 0.5,
                        }}
                      >
                        Rationale: {node.rationale}
                      </Typography>
                    )}
                  </Stack>

                  {/* Action CTA */}
                  <Box sx={{ minWidth: 150, textAlign: { xs: 'left', md: 'right' } }}>
                    {node.status === 'MASTERED' ? (
                      <Button
                        variant="outlined"
                        component={Link}
                        href={`/learn/${node.slug}`}
                        onClick={() => soundFx.playClick()}
                        size="small"
                        sx={{ borderColor: tokens.color.googleGreen, color: tokens.color.googleGreen }}
                      >
                        Review Studio
                      </Button>
                    ) : isActionable ? (
                      <Button
                        variant="contained"
                        component={Link}
                        href={`/learn/${node.slug}`}
                        onClick={() => soundFx.playClick()}
                        size="small"
                        sx={{
                          bgcolor: tokens.color.googleBlue,
                          '&:hover': { bgcolor: tokens.color.primaryDark },
                        }}
                      >
                        {node.status === 'IN_PROGRESS' ? 'Resume Study →' : 'Begin Concept →'}
                      </Button>
                    ) : node.status === 'GAP' ? (
                      <Typography variant="caption" sx={{ color: tokens.color.googleRed, fontWeight: 700 }}>
                        Prerequisite Missing
                      </Typography>
                    ) : (
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        Locked by Prerequisites
                      </Typography>
                    )}
                  </Box>
                </Paper>
              );
            })}
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
