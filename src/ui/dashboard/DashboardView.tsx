'use client';

import { useState } from 'react';
import Link from 'next/link';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
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
import type { DashboardSummary } from '@/services/dashboard';
import type { KnowledgeGraphData, GraphNodeView } from '@/services/graph';
import type { RecommendationView } from '@/services/recommendation';

export function DashboardView() {
  const [viewMode, setViewMode] = useState<'graph' | 'table'>('graph');
  const [selectedNode, setSelectedNode] = useState<GraphNodeView | null>(null);

  // 1. Fetch dashboard metrics
  const { data: summary, isLoading: isSummaryLoading } = useQuery<DashboardSummary>({
    queryKey: ['dashboard-summary'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard/summary');
      if (!res.ok) throw new Error('Failed to fetch summary');
      // The API wraps payloads in { data } so successes and failures share a shape.
      return (await res.json()).data;
    },
  });

  // 2. Fetch recommendations
  const { data: recommendations, isLoading: isRecsLoading } = useQuery<RecommendationView[]>({
    queryKey: ['recommendations'],
    queryFn: async () => {
      const res = await fetch('/api/recommendations');
      if (!res.ok) throw new Error('Failed to fetch recommendations');
      return (await res.json()).data;
    },
  });

  // 3. Fetch knowledge graph data
  const { data: graphData, isLoading: isGraphLoading } = useQuery<KnowledgeGraphData>({
    queryKey: ['knowledge-graph', summary?.goalSlug],
    enabled: Boolean(summary?.goalSlug),
    queryFn: async () => {
      const res = await fetch(`/api/knowledge-state/graph?goal=${summary?.goalSlug}`);
      if (!res.ok) throw new Error('Failed to fetch graph data');
      return (await res.json()).data;
    },
  });

  if (isSummaryLoading || isRecsLoading || isGraphLoading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 12, gap: 2 }}>
        <CircularProgress size={40} />
        <Typography variant="body1" sx={{ color: 'text.secondary' }}>
          Loading your knowledge state and cognitive map...
        </Typography>
      </Box>
    );
  }

  if (!summary) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: tokens.radius.lg }}>
          <Typography variant="h2" sx={{ mb: 2 }}>
            No Active Goal Found
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary', mb: 3 }}>
            Get started by taking the adaptive diagnostic to calibrate your knowledge graph.
          </Typography>
          <Button variant="contained" component={Link} href="/onboarding">
            Start Diagnostic Onboarding
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Box component="main" id="main-content" sx={{ py: { xs: 4, md: 6 } }}>
      <Container maxWidth="lg">
        <Stack spacing={5}>
          {/* Top Bar / Header */}
          <Stack direction={{ xs: 'column', md: 'row' }} sx={{ justifyContent: 'space-between', alignItems: { md: 'center' }, gap: 2 }}>
            <Stack spacing={0.5}>
              <Chip
                label="Active Goal"
                size="small"
                sx={{
                  alignSelf: 'flex-start',
                  bgcolor: tokens.color.primaryLight,
                  color: tokens.color.primaryDark,
                  fontWeight: 600,
                  fontSize: '0.75rem',
                }}
              />
              <Typography variant="h1" sx={{ fontSize: '2rem' }}>
                {summary.goalTitle}
              </Typography>
            </Stack>

            <Button
              variant="outlined"
              component={Link}
              href="/onboarding"
              size="small"
              sx={{ alignSelf: 'flex-start' }}
            >
              Change Goal / Recalibrate
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
            <Paper sx={{ p: 2.5, borderRadius: tokens.radius.md }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase' }}>
                Average Mastery
              </Typography>
              <Typography variant="h2" sx={{ my: 0.5, color: tokens.color.primary }}>
                {Math.round(summary.averageMastery * 100)}%
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Across {summary.totalConcepts} curriculum concepts
              </Typography>
            </Paper>

            <Paper sx={{ p: 2.5, borderRadius: tokens.radius.md }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase' }}>
                Mastered
              </Typography>
              <Typography variant="h2" sx={{ my: 0.5, color: tokens.color.mastered }}>
                {summary.masteredCount}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Nodes &ge; 85% effective mastery
              </Typography>
            </Paper>

            <Paper sx={{ p: 2.5, borderRadius: tokens.radius.md }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase' }}>
                Needs Review
              </Typography>
              <Typography variant="h2" sx={{ my: 0.5, color: tokens.color.fragile }}>
                {summary.fragileCount}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Decaying retrieval retention
              </Typography>
            </Paper>

            <Paper sx={{ p: 2.5, borderRadius: tokens.radius.md }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase' }}>
                Foundational Gaps
              </Typography>
              <Typography variant="h2" sx={{ my: 0.5, color: tokens.color.gap }}>
                {summary.gapCount}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Active prerequisite blockers
              </Typography>
            </Paper>
          </Box>

          {/* Next Recommended Actions */}
          {recommendations && recommendations.length > 0 && (
            <Stack spacing={2}>
              <Typography variant="h3">Recommended Next Actions</Typography>
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
                    }}
                  >
                    <Stack spacing={1}>
                      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                        <Chip
                          label={rec.kind.replace('_', ' ')}
                          size="small"
                          sx={{
                            bgcolor: tokens.color.primaryLight,
                            color: tokens.color.primaryDark,
                            fontWeight: 700,
                            fontSize: '0.7rem',
                            textTransform: 'uppercase',
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
                      size="small"
                      sx={{ alignSelf: 'flex-start' }}
                    >
                      Start Learning →
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
                <Typography variant="h3">Your Cognitive Knowledge Map</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Halftone dot density encodes current mastery; edges reveal prerequisite dependencies.
                </Typography>
              </Stack>
              <Tabs
                value={viewMode}
                onChange={(_, v) => setViewMode(v)}
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
                    color: tokens.color.primary,
                  },
                  '& .MuiTabs-indicator': { display: 'none' },
                }}
              >
                <Tab value="graph" label="Visual Graph" />
                <Tab value="table" label="Table Twin" />
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
                label={masteryPalette[selectedNode.band].label}
                size="small"
                sx={{
                  alignSelf: 'flex-start',
                  bgcolor: masteryPalette[selectedNode.band].fill,
                  color: masteryPalette[selectedNode.band].main,
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
              <Stack spacing={1}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                  Halftone Mastery Density
                </Typography>
                <MasteryDots band={selectedNode.band} value={selectedNode.effectiveMastery} height={48} />
                <Stack direction="row" sx={{ justifyContent: 'space-between', pt: 1 }}>
                  <Typography variant="body2">Raw BKT Posterior:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {Math.round(selectedNode.rawMastery * 100)}%
                  </Typography>
                </Stack>
                <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                  <Typography variant="body2">Ebbinghaus Retrievability:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {Math.round(selectedNode.retrievability * 100)}%
                  </Typography>
                </Stack>
              </Stack>
            </Paper>

            {selectedNode.unmetPrerequisites.length > 0 && (
              <Stack spacing={1}>
                <Typography variant="subtitle2" sx={{ color: tokens.color.gap, fontWeight: 700 }}>
                  Unmet Prerequisites:
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
              fullWidth
              size="large"
            >
              Open Concept Studio →
            </Button>
          </Stack>
        )}
      </Drawer>
    </Box>
  );
}
