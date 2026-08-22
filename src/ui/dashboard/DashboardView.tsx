'use client';

import { useState } from 'react';
import Link from 'next/link';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Container from '@mui/material/Container';
import Drawer from '@mui/material/Drawer';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';
import { useQuery } from '@tanstack/react-query';

import { KnowledgeGraph } from '@/ui/graph/KnowledgeGraph';
import { KnowledgeTable } from '@/ui/graph/KnowledgeTable';
import { MasteryDots } from '@/ui/graphics/MasteryDots';
import { tokens, masteryPalette } from '@/ui/tokens';
import { soundFx } from '@/ui/audio/sound';
import type { DashboardSummary } from '@/services/dashboard';
import type { RecommendationView } from '@/services/recommendation';
import type { GraphNodeView, KnowledgeGraphData } from '@/services/graph';

export function DashboardView({
  initialSummary,
  initialRecommendations,
  initialGraphData,
}: {
  initialSummary: DashboardSummary;
  initialRecommendations: RecommendationView[];
  initialGraphData: KnowledgeGraphData;
}) {
  const [viewMode, setViewMode] = useState<'graph' | 'table'>('graph');
  const [selectedNode, setSelectedNode] = useState<GraphNodeView | null>(null);

  // 1. Live dashboard summary with initialData & focus refetch
  const { data: summary = initialSummary } = useQuery<DashboardSummary>({
    queryKey: ['dashboard-summary'],
    initialData: initialSummary,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const res = await fetch('/api/dashboard/summary');
      if (!res.ok) throw new Error('Failed to fetch summary');
      const payload = await res.json();
      return payload.data ?? payload;
    },
  });

  // 2. Recommendations with initialData & focus refetch
  const { data: recommendations = initialRecommendations } = useQuery<RecommendationView[]>({
    queryKey: ['recommendations'],
    initialData: initialRecommendations,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const res = await fetch('/api/recommendations');
      if (!res.ok) throw new Error('Failed to fetch recommendations');
      const payload = await res.json();
      return payload.data ?? payload;
    },
  });

  // 3. Knowledge Graph Data with initialData & focus refetch
  const { data: graphData = initialGraphData } = useQuery<KnowledgeGraphData>({
    queryKey: ['knowledge-graph', summary.goalSlug],
    initialData: initialGraphData,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const res = await fetch(`/api/knowledge-state/graph?goal=${summary.goalSlug}`);
      if (!res.ok) throw new Error('Failed to fetch graph data');
      const payload = await res.json();
      return payload.data ?? payload;
    },
  });

  return (
    <Box component="main" id="main-content" sx={{ py: { xs: 3, md: 5 } }}>
      <Container maxWidth="lg">
        <Stack spacing={4}>
          {/* Dashboard Header */}
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2}
            sx={{ justifyContent: 'space-between', alignItems: { md: 'flex-end' } }}
          >
            <Stack spacing={1}>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <Typography variant="caption" sx={{ color: tokens.color.googleBlue, fontWeight: 800, textTransform: 'uppercase' }}>
                  Learning
                </Typography>
                <Typography variant="caption" sx={{ color: tokens.color.googleGreen, fontWeight: 800, textTransform: 'uppercase' }}>
                  Dashboard
                </Typography>
              </Stack>
              <Typography variant="h1" sx={{ fontSize: { xs: '2rem', md: '2.5rem' } }}>
                {summary.goalTitle}
              </Typography>
              <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: 640 }}>
                Explore your interactive map below. Click any topic to view your progress or begin a quick lesson.
              </Typography>
            </Stack>

            <Button
              variant="outlined"
              component={Link}
              href="/onboarding"
              size="small"
              onClick={() => soundFx.playClick()}
              sx={{ alignSelf: 'flex-start', borderColor: tokens.color.border, color: tokens.color.textPrimary }}
            >
              Switch Goal / Reset
            </Button>
          </Stack>

          {/* Metric Cards Row */}
          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
            }}
          >
            <Paper sx={{ p: 2.5, borderRadius: tokens.radius.md, border: 1, borderColor: 'divider' }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase' }}>
                Overall Mastery
              </Typography>
              <Typography variant="h2" sx={{ my: 0.5, color: tokens.color.googleBlue }}>
                {Math.round(summary.averageMastery * 100)}%
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Across {summary.totalConcepts} topics
              </Typography>
            </Paper>

            <Paper sx={{ p: 2.5, borderRadius: tokens.radius.md, border: 1, borderColor: 'divider' }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase' }}>
                Topics Mastered
              </Typography>
              <Typography variant="h2" sx={{ my: 0.5, color: tokens.color.googleGreen }}>
                {summary.masteredCount}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Scored 85% or higher
              </Typography>
            </Paper>

            <Paper sx={{ p: 2.5, borderRadius: tokens.radius.md, border: 1, borderColor: 'divider' }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase' }}>
                Needs Refresher
              </Typography>
              <Typography variant="h2" sx={{ my: 0.5, color: tokens.color.googleYellow }}>
                {summary.fragileCount}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Ready for a quick 2-min review
              </Typography>
            </Paper>

            <Paper sx={{ p: 2.5, borderRadius: tokens.radius.md, border: 1, borderColor: 'divider' }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase' }}>
                Foundation Gaps
              </Typography>
              <Typography variant="h2" sx={{ my: 0.5, color: tokens.color.googleRed }}>
                {summary.gapCount}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Prerequisites to review first
              </Typography>
            </Paper>
          </Box>

          {/* Next Recommended Actions */}
          {recommendations && recommendations.length > 0 && (
            <Stack spacing={2}>
              <Typography variant="h3">Recommended Next Steps</Typography>
              <Box
                sx={{
                  display: 'grid',
                  gap: 2,
                  gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
                }}
              >
                {recommendations.slice(0, 3).map((rec) => (
                  <Card
                    key={rec.id}
                    sx={{
                      p: 2.5,
                      borderRadius: tokens.radius.md,
                      border: 1,
                      borderColor: 'divider',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: 2,
                      boxShadow: '0 4px 16px rgba(11, 31, 58, 0.04)',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        borderColor: tokens.color.googleBlue,
                        transform: 'translateY(-2px)',
                        boxShadow: '0 6px 20px rgba(66, 133, 244, 0.12)',
                      },
                    }}
                  >
                    <Stack spacing={1}>
                      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                        <Chip
                          label={rec.kind === 'PREREQ_BRIDGE' ? 'Foundation Topic' : rec.kind === 'REVIEW_PROBE' ? 'Memory Refresher' : rec.kind === 'MISCONCEPTION_DRILL' ? 'Targeted Practice' : 'Next Topic'}
                          size="small"
                          sx={{
                            bgcolor: tokens.color.primaryLight,
                            color: tokens.color.googleBlue,
                            fontWeight: 700,
                            fontSize: '0.7rem',
                          }}
                        />
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          ~{rec.estimatedMinutes} mins
                        </Typography>
                      </Stack>
                      <Typography variant="h4">{rec.conceptTitle}</Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
                        {rec.rationale}
                      </Typography>
                    </Stack>

                    <Button
                      variant="contained"
                      component={Link}
                      href={`/learn/${rec.conceptSlug}`}
                      onClick={() => soundFx.playClick()}
                      size="small"
                      sx={{
                        alignSelf: 'flex-start',
                        bgcolor: tokens.color.googleBlue,
                        '&:hover': { bgcolor: tokens.color.primaryDark },
                      }}
                    >
                      Start Lesson →
                    </Button>
                  </Card>
                ))}
              </Box>
            </Stack>
          )}

          {/* Interactive Knowledge Graph & Table Twin */}
          <Stack spacing={2}>
            <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <Stack spacing={0.5}>
                <Typography variant="h3">Your Learning Map</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Icons show your mastery level; lines connect earlier lessons to more advanced topics.
                </Typography>
              </Stack>
              <Tabs
                value={viewMode}
                onChange={(_, v) => {
                  soundFx.playClick();
                  setViewMode(v);
                }}
                sx={{
                  bgcolor: tokens.color.lockedFill,
                  borderRadius: tokens.radius.pill,
                  minHeight: 36,
                  p: 0.5,
                  '& .MuiTab-root': {
                    minHeight: 32,
                    py: 0,
                    px: 2,
                    borderRadius: tokens.radius.pill,
                    fontWeight: 600,
                  },
                  '& .Mui-selected': {
                    bgcolor: 'background.paper',
                    color: tokens.color.googleBlue,
                  },
                  '& .MuiTabs-indicator': { display: 'none' },
                }}
              >
                <Tab value="graph" label="Visual Map" />
                <Tab value="table" label="List View" />
              </Tabs>
            </Stack>

            {graphData && (
              <>
                {viewMode === 'graph' ? (
                  <KnowledgeGraph
                    nodes={graphData.nodes}
                    edges={graphData.edges}
                    onSelectNode={(node) => setSelectedNode(node)}
                  />
                ) : (
                  <KnowledgeTable
                    nodes={graphData.nodes}
                    onSelectNode={(node) => setSelectedNode(node)}
                  />
                )}
              </>
            )}
          </Stack>
        </Stack>
      </Container>

      {/* Selected Node Details Drawer */}
      <Drawer
        anchor="right"
        open={Boolean(selectedNode)}
        onClose={() => setSelectedNode(null)}
        sx={{
          '& .MuiDrawer-paper': {
            width: { xs: '100%', sm: 400 },
            p: 3,
            boxSizing: 'border-box',
          },
        }}
      >
        {selectedNode && (
          <Stack spacing={3}>
            <Stack spacing={1}>
              <Chip
                label={masteryPalette[selectedNode.band]?.label ?? 'In Progress'}
                size="small"
                sx={{
                  alignSelf: 'flex-start',
                  bgcolor: masteryPalette[selectedNode.band]?.fill ?? tokens.color.primaryLight,
                  color: masteryPalette[selectedNode.band]?.main ?? tokens.color.primaryDark,
                  fontWeight: 700,
                }}
              />
              <Typography variant="h2" sx={{ fontSize: '1.5rem' }}>
                {selectedNode.title}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {selectedNode.summary}
              </Typography>
            </Stack>

            <Paper sx={{ p: 2, borderRadius: tokens.radius.md, border: 1, borderColor: 'divider' }}>
              <Stack spacing={1.5}>
                <MasteryDots band={selectedNode.band} value={selectedNode.effectiveMastery} height={44} />
                <Stack direction="row" sx={{ justifyContent: 'space-between', pt: 1 }}>
                  <Typography variant="body2">Current Mastery:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {Math.round(selectedNode.rawMastery * 100)}%
                  </Typography>
                </Stack>
                <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                  <Typography variant="body2">Memory Strength:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {Math.round(selectedNode.retrievability * 100)}%
                  </Typography>
                </Stack>
              </Stack>
            </Paper>

            {selectedNode.unmetPrerequisites.length > 0 && (
              <Stack spacing={1}>
                <Typography variant="subtitle2" sx={{ color: tokens.color.gap, fontWeight: 700 }}>
                  Recommended First:
                </Typography>
                <Stack spacing={0.5}>
                  {selectedNode.unmetPrerequisites.map((p) => (
                    <Typography key={p} variant="body2" sx={{ color: 'text.secondary' }}>
                      • {p}
                    </Typography>
                  ))}
                </Stack>
              </Stack>
            )}

            <Button
              variant="contained"
              component={Link}
              href={`/learn/${selectedNode.slug}`}
              onClick={() => soundFx.playClick()}
              fullWidth
              size="large"
              sx={{
                bgcolor: tokens.color.googleBlue,
                '&:hover': { bgcolor: tokens.color.primaryDark },
              }}
            >
              Start Lesson →
            </Button>
          </Stack>
        )}
      </Drawer>
    </Box>
  );
}
