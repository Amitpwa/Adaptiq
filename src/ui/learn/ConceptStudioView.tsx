'use client';

import { useState } from 'react';
import Link from 'next/link';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import FormControlLabel from '@mui/material/FormControlLabel';
import Paper from '@mui/material/Paper';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useMutation, useQuery } from '@tanstack/react-query';

import { MasteryDots } from '@/ui/graphics/MasteryDots';
import { tokens, masteryPalette } from '@/ui/tokens';
import { soundFx } from '@/ui/audio/sound';
import type { ConceptExplanationView } from '@/services/concept';
import type { SocraticHintResponse } from '@/services/tutor';

export function ConceptStudioView({
  conceptSlug,
  initialConceptData,
}: {
  conceptSlug: string;
  initialConceptData?: ConceptExplanationView;
}) {
  const [lens, setLens] = useState<'ANALOGY' | 'FIRST_PRINCIPLES' | 'CODE' | 'VISUAL'>('ANALOGY');
  const [selectedOptionId, setSelectedOptionId] = useState<string>('');
  const [textAnswer, setTextAnswer] = useState<string>('');
  const [hintLevel, setHintLevel] = useState<number>(0);
  const [hints, setHints] = useState<SocraticHintResponse[]>([]);
  const [probeResult, setProbeResult] = useState<{
    correct: boolean;
    explanation?: string;
    updatedMastery?: number;
    band?: string;
  } | null>(null);

  // 1. Fetch Concept Studio Data with initialData
  const { data: concept, refetch } = useQuery<ConceptExplanationView>({
    queryKey: ['concept-studio', conceptSlug, lens],
    initialData: lens === 'ANALOGY' ? initialConceptData : undefined,
    queryFn: async () => {
      const res = await fetch(`/api/concepts/${conceptSlug}?lens=${lens}`);
      if (!res.ok) throw new Error('Failed to load concept studio data');
      const payload = await res.json();
      return payload.data ?? payload;
    },
  });

  // 2. Submit Micro-Assessment Probe with playful sound fx
  const probeMutation = useMutation({
    mutationFn: async (payload: { itemId: string; optionId?: string; text?: string }) => {
      const res = await fetch(`/api/concepts/${conceptSlug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to submit answer');
      const result = await res.json();
      return result.data ?? result;
    },
    onSuccess: (data) => {
      setProbeResult(data);
      if (data.correct) {
        soundFx.playSuccess();
      } else {
        soundFx.playWrong();
      }
      refetch();
    },
  });

  // 3. Request Next Socratic Hint with playful shimmer sound fx
  const hintMutation = useMutation({
    mutationFn: async (questionId: string) => {
      const res = await fetch(`/api/tutor/hint`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId, currentLevel: hintLevel }),
      });
      if (!res.ok) throw new Error('Failed to fetch hint');
      const result = await res.json();
      return result.data ?? result;
    },
    onSuccess: (data: SocraticHintResponse) => {
      soundFx.playHint();
      setHints((prev) => [...prev, data]);
      setHintLevel(data.hintLevel);
    },
  });

  if (!concept) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: tokens.radius.lg }}>
          <Typography variant="h2" sx={{ mb: 2 }}>
            Concept Not Found
          </Typography>
          <Button variant="contained" component={Link} href="/dashboard" onClick={() => soundFx.playClick()}>
            Back to Dashboard
          </Button>
        </Paper>
      </Container>
    );
  }

  const currentQuestion = concept.questions?.[0];

  return (
    <Box component="main" id="main-content" sx={{ py: { xs: 4, md: 6 } }}>
      <Container maxWidth="lg">
        <Stack spacing={4}>
          {/* Breadcrumb & Top Bar */}
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
              label={masteryPalette[concept.band]?.label ?? 'In Progress'}
              size="small"
              sx={{
                bgcolor: masteryPalette[concept.band]?.fill ?? tokens.color.primaryLight,
                color: masteryPalette[concept.band]?.main ?? tokens.color.primaryDark,
                fontWeight: 700,
              }}
            />
          </Stack>

          {/* Header & Mastery Status */}
          <Paper sx={{ p: { xs: 3, md: 4 }, borderRadius: tokens.radius.lg, border: 1, borderColor: 'divider' }}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} sx={{ justifyContent: 'space-between', alignItems: { md: 'center' } }}>
              <Stack spacing={1} sx={{ maxWidth: 640 }}>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  <Typography variant="caption" sx={{ color: tokens.color.googleBlue, fontWeight: 800, textTransform: 'uppercase' }}>
                    Concept
                  </Typography>
                  <Typography variant="caption" sx={{ color: tokens.color.googleRed, fontWeight: 800, textTransform: 'uppercase' }}>
                    Studio
                  </Typography>
                </Stack>
                <Typography variant="h1" sx={{ fontSize: { xs: '1.8rem', md: '2.4rem' } }}>
                  {concept.conceptTitle}
                </Typography>
                <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                  {concept.summary}
                </Typography>
              </Stack>
              <Box sx={{ minWidth: 220 }}>
                <MasteryDots band={concept.band} value={concept.effectiveMastery ?? 0} height={48} labelled={false} />
              </Box>
            </Stack>
          </Paper>

          {/* Multi-Lens Explanation Section */}
          <Paper sx={{ p: { xs: 3, md: 4 }, borderRadius: tokens.radius.lg, border: 1, borderColor: 'divider' }}>
            <Stack spacing={3}>
              <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' }, gap: 2 }}>
                <Typography variant="h3">Explanatory Lenses (PRD FR-3.1)</Typography>
                <Tabs
                  value={lens}
                  onChange={(_, v) => {
                    soundFx.playClick();
                    setLens(v);
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
                      fontSize: '0.8rem',
                    },
                    '& .Mui-selected': {
                      bgcolor: 'background.paper',
                      color: tokens.color.googleBlue,
                    },
                    '& .MuiTabs-indicator': { display: 'none' },
                  }}
                >
                  <Tab value="ANALOGY" label="Analogy" />
                  <Tab value="FIRST_PRINCIPLES" label="First Principles" />
                  <Tab value="CODE" label="Code-First" />
                  <Tab value="VISUAL" label="Visual Diagram" />
                </Tabs>
              </Stack>

              <Divider />

              <Box
                sx={{
                  p: 3,
                  borderRadius: tokens.radius.md,
                  bgcolor: tokens.color.background,
                  border: 1,
                  borderColor: tokens.color.border,
                  fontSize: '1.05rem',
                  lineHeight: 1.8,
                  fontFamily: lens === 'CODE' ? 'monospace' : 'inherit',
                  whiteSpace: 'pre-line',
                }}
              >
                {concept.body}
              </Box>

              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Attribution: {concept.attribution} · Grounded in validated curriculum models.
              </Typography>
            </Stack>
          </Paper>

          {/* In-Flow Formative Micro-Assessment Probe */}
          {currentQuestion ? (
            <Paper sx={{ p: { xs: 3, md: 4 }, borderRadius: tokens.radius.lg, border: 1, borderColor: 'divider' }}>
              <Stack spacing={3}>
                <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                  <Chip
                    label="In-Flow Retrieval Probe (FR-4.1)"
                    size="small"
                    sx={{ bgcolor: tokens.color.primaryLight, color: tokens.color.googleBlue, fontWeight: 700 }}
                  />
                  <Button
                    variant="outlined"
                    size="small"
                    disabled={hintLevel >= 4 || hintMutation.isPending}
                    onClick={() => hintMutation.mutate(currentQuestion.id)}
                    sx={{ color: tokens.color.googleYellow, borderColor: tokens.color.googleYellow }}
                  >
                    {hintMutation.isPending
                      ? 'Requesting Hint…'
                      : hintLevel === 0
                        ? 'Need a Socratic Hint? (Level 1)'
                        : `Escalate Hint (${hintLevel}/4)`}
                  </Button>
                </Stack>

                <Typography variant="h3" sx={{ fontSize: '1.25rem' }}>
                  {currentQuestion.stem}
                </Typography>

                {currentQuestion.options && currentQuestion.options.length > 0 ? (
                  <RadioGroup
                    value={selectedOptionId}
                    onChange={(e) => {
                      soundFx.playClick();
                      setSelectedOptionId(e.target.value);
                    }}
                  >
                    <Stack spacing={1.5}>
                      {currentQuestion.options.map((opt) => (
                        <Card
                          key={opt.id}
                          variant="outlined"
                          sx={{
                            borderRadius: tokens.radius.md,
                            borderColor: selectedOptionId === opt.id ? tokens.color.googleBlue : tokens.color.border,
                            bgcolor: selectedOptionId === opt.id ? tokens.color.primaryLight : 'background.paper',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <FormControlLabel
                            value={opt.id}
                            control={<Radio disabled={Boolean(probeResult)} />}
                            label={opt.label}
                            sx={{ width: '100%', m: 0, p: 1.5 }}
                          />
                        </Card>
                      ))}
                    </Stack>
                  </RadioGroup>
                ) : (
                  <TextField
                    multiline
                    rows={3}
                    placeholder="Type your response here..."
                    value={textAnswer}
                    disabled={Boolean(probeResult)}
                    onChange={(e) => setTextAnswer(e.target.value)}
                    fullWidth
                  />
                )}

                {/* Socratic Hint Ladder Stream */}
                {hints.length > 0 && (
                  <Stack spacing={1.5}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: tokens.color.primaryDark, textTransform: 'uppercase' }}>
                      Socratic Scaffolding Ladder (FR-5.2)
                    </Typography>
                    {hints.map((h, index) => (
                      <Box
                        key={index}
                        sx={{
                          p: 2,
                          borderRadius: tokens.radius.md,
                          bgcolor: tokens.color.primaryLight,
                          borderLeft: 4,
                          borderColor: tokens.color.googleBlue,
                        }}
                      >
                        <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: tokens.color.primaryDark }}>
                            Level {h.hintLevel} Hint {h.hintLevel === 1 ? '(Clarification)' : h.hintLevel === 2 ? '(Conceptual)' : h.hintLevel === 3 ? '(Isomorphic)' : '(Walkthrough)'}
                          </Typography>
                          <Chip
                            label={h.source === 'AI' ? 'Socratic AI' : 'Deterministic Ladder'}
                            size="small"
                            sx={{ fontSize: '0.65rem', height: 20 }}
                          />
                        </Stack>
                        <Typography variant="body2" sx={{ color: 'text.primary' }}>
                          {h.body}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                )}

                {/* Result Feedback Alert */}
                {probeResult && (
                  <Box
                    sx={{
                      p: 2.5,
                      borderRadius: tokens.radius.md,
                      bgcolor: probeResult.correct ? tokens.color.masteredFill : tokens.color.gapFill,
                      border: 1,
                      borderColor: probeResult.correct ? tokens.color.googleGreen : tokens.color.googleRed,
                    }}
                  >
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: probeResult.correct ? tokens.color.googleGreen : tokens.color.googleRed }}>
                      {probeResult.correct ? '✓ Verified Mastery! Bayesian Posterior Updated.' : '⚠ Foundational Misconception Identified.'}
                    </Typography>
                    {probeResult.explanation && (
                      <Typography variant="body2" sx={{ mt: 0.5, color: 'text.primary' }}>
                        {probeResult.explanation}
                      </Typography>
                    )}
                  </Box>
                )}

                <Stack direction="row" spacing={2} sx={{ pt: 1 }}>
                  {!probeResult ? (
                    <Button
                      variant="contained"
                      disabled={(!selectedOptionId && !textAnswer.trim()) || probeMutation.isPending}
                      onClick={() =>
                        probeMutation.mutate({
                          itemId: currentQuestion.id,
                          ...(selectedOptionId ? { optionId: selectedOptionId } : {}),
                          ...(textAnswer ? { text: textAnswer } : {}),
                        })
                      }
                      sx={{
                        px: 4,
                        py: 1.25,
                        bgcolor: tokens.color.googleBlue,
                        '&:hover': { bgcolor: tokens.color.primaryDark },
                      }}
                    >
                      {probeMutation.isPending ? 'Grading & Updating BKT…' : 'Submit & Update Knowledge'}
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      component={Link}
                      href="/dashboard"
                      onClick={() => soundFx.playClick()}
                      sx={{ px: 4, py: 1.25 }}
                    >
                      Return to Map →
                    </Button>
                  )}
                </Stack>
              </Stack>
            </Paper>
          ) : (
            <Paper sx={{ p: 4, borderRadius: tokens.radius.lg, border: 1, borderColor: 'divider', textAlign: 'center' }}>
              <Typography variant="h3" sx={{ mb: 1 }}>
                Reading & Synthesis Phase
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
                Review the multi-lens explanation above. When ready, continue along your topological path.
              </Typography>
              <Button variant="contained" component={Link} href="/dashboard" onClick={() => soundFx.playClick()}>
                Return to Knowledge Map →
              </Button>
            </Paper>
          )}
        </Stack>
      </Container>
    </Box>
  );
}
