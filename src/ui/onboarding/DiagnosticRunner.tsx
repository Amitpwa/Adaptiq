'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import FormControlLabel from '@mui/material/FormControlLabel';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { tokens } from '@/ui/tokens';

export interface DiagnosticItemResponse {
  finished: boolean;
  questionNumber: number;
  maxQuestions: number;
  currentTheta?: number;
  standardError?: number;
  question?: {
    id: string;
    stem: string;
    type: 'MCQ' | 'MULTI' | 'SHORT' | 'CODE_COMPLETION' | 'OUTPUT_PREDICTION';
    conceptTitle: string;
    options: Array<{ id: string; label: string }>;
  };
}

export function DiagnosticRunner({
  sessionId,
  onComplete,
}: {
  sessionId: string;
  onComplete: () => void;
}) {
  const queryClient = useQueryClient();
  const [selectedOptionId, setSelectedOptionId] = useState<string>('');
  const [textAnswer, setTextAnswer] = useState<string>('');
  const [feedback, setFeedback] = useState<{
    correct: boolean;
    explanation?: string;
  } | null>(null);

  // Fetch the next adaptive question
  const { data: itemData, isLoading, isError, refetch } = useQuery<DiagnosticItemResponse>({
    queryKey: ['diagnostic-item', sessionId],
    queryFn: async () => {
      const res = await fetch(`/api/diagnostic/sessions/${sessionId}/next`);
      if (!res.ok) throw new Error('Failed to load next diagnostic item');
      return (await res.json()).data;
    },
  });

  // Submit Answer mutation
  const answerMutation = useMutation({
    mutationFn: async (payload: { itemId: string; optionId?: string; text?: string }) => {
      const res = await fetch(`/api/diagnostic/sessions/${sessionId}/answers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to submit answer');
      return (await res.json()).data;
    },
    onSuccess: (data) => {
      setFeedback({
        correct: data.correct,
        explanation: data.explanation,
      });
    },
  });

  // Complete diagnostic mutation
  const completeMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/diagnostic/sessions/${sessionId}/complete`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Failed to finalize diagnostic');
      return (await res.json()).data;
    },
    onSuccess: () => {
      onComplete();
    },
  });

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8, gap: 2 }}>
        <CircularProgress size={36} />
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Calibrating next adaptive question...
        </Typography>
      </Box>
    );
  }

  if (isError || !itemData) {
    return (
      <Typography color="error">
        Error loading diagnostic item. Please refresh to continue.
      </Typography>
    );
  }

  if (itemData.finished) {
    return (
      <Card sx={{ p: 4, borderRadius: tokens.radius.lg, border: 1, borderColor: 'divider' }}>
        <Stack spacing={3} sx={{ alignItems: 'center', textAlign: 'center', py: 3 }}>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: tokens.radius.pill,
              bgcolor: tokens.color.masteredFill,
              color: tokens.color.mastered,
              display: 'grid',
              placeItems: 'center',
              fontSize: '1.75rem',
              fontWeight: 'bold',
            }}
          >
            ✓
          </Box>
          <Stack spacing={1}>
            <Typography variant="h2">Diagnostic Complete</Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: 480 }}>
              We have accurately localized your boundary of competence. Generating your personalized topological learning path...
            </Typography>
          </Stack>
          <Button
            variant="contained"
            size="large"
            disabled={completeMutation.isPending}
            onClick={() => completeMutation.mutate()}
            sx={{ px: 4, py: 1.5 }}
          >
            {completeMutation.isPending ? 'Generating Learning Path…' : 'Enter Dashboard'}
          </Button>
        </Stack>
      </Card>
    );
  }

  const q = itemData.question;
  if (!q) return null;

  const handleNext = () => {
    setFeedback(null);
    setSelectedOptionId('');
    setTextAnswer('');
    queryClient.invalidateQueries({ queryKey: ['diagnostic-item', sessionId] });
    refetch();
  };

  const isAnswerValid = q.options.length > 0 ? Boolean(selectedOptionId) : Boolean(textAnswer.trim());

  return (
    <Stack spacing={3}>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <Chip
          label={`Question ${itemData.questionNumber} of ${itemData.maxQuestions}`}
          size="small"
          sx={{ bgcolor: tokens.color.primaryLight, color: tokens.color.primaryDark, fontWeight: 600 }}
        />
        <Chip
          label={`Concept: ${q.conceptTitle}`}
          variant="outlined"
          size="small"
          sx={{ borderColor: tokens.color.border, color: tokens.color.textSecondary }}
        />
      </Stack>

      <Card sx={{ p: { xs: 3, md: 4 }, borderRadius: tokens.radius.lg, border: 1, borderColor: 'divider' }}>
        <Stack spacing={3}>
          <Typography variant="h3" component="h2" sx={{ fontSize: '1.25rem', lineHeight: 1.5 }}>
            {q.stem}
          </Typography>

          {q.options.length > 0 ? (
            <RadioGroup
              value={selectedOptionId}
              onChange={(e) => setSelectedOptionId(e.target.value)}
            >
              <Stack spacing={1.5}>
                {q.options.map((opt) => (
                  <Card
                    key={opt.id}
                    variant="outlined"
                    sx={{
                      borderRadius: tokens.radius.md,
                      borderColor: selectedOptionId === opt.id ? tokens.color.primary : tokens.color.border,
                      bgcolor: selectedOptionId === opt.id ? tokens.color.primaryLight : 'background.paper',
                      transition: 'all 0.15s ease',
                      '&:hover': {
                        borderColor: tokens.color.primary,
                      },
                    }}
                  >
                    <FormControlLabel
                      value={opt.id}
                      control={<Radio disabled={Boolean(feedback)} />}
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
              placeholder="Type your answer here..."
              value={textAnswer}
              disabled={Boolean(feedback)}
              onChange={(e) => setTextAnswer(e.target.value)}
              fullWidth
            />
          )}

          {feedback && (
            <Box
              sx={{
                p: 2.5,
                borderRadius: tokens.radius.md,
                bgcolor: feedback.correct ? tokens.color.masteredFill : tokens.color.gapFill,
                border: 1,
                borderColor: feedback.correct ? tokens.color.mastered : tokens.color.gap,
              }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: feedback.correct ? tokens.color.mastered : tokens.color.gap }}>
                {feedback.correct ? 'Correct! Updating knowledge estimate...' : 'Identified foundational gap or misconception.'}
              </Typography>
              {feedback.explanation && (
                <Typography variant="body2" sx={{ mt: 0.5, color: 'text.primary' }}>
                  {feedback.explanation}
                </Typography>
              )}
            </Box>
          )}

          <Stack direction="row" spacing={2} sx={{ pt: 1 }}>
            {!feedback ? (
              <Button
                variant="contained"
                disabled={!isAnswerValid || answerMutation.isPending}
                onClick={() =>
                  answerMutation.mutate({
                    itemId: q.id,
                    ...(selectedOptionId ? { optionId: selectedOptionId } : {}),
                    ...(textAnswer ? { text: textAnswer } : {}),
                  })
                }
                sx={{ px: 4, py: 1.25 }}
              >
                {answerMutation.isPending ? 'Grading Answer…' : 'Submit Answer'}
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleNext}
                sx={{ px: 4, py: 1.25 }}
              >
                Next Question →
              </Button>
            )}
          </Stack>
        </Stack>
      </Card>
    </Stack>
  );
}
