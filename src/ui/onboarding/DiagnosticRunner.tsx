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
import { soundFx } from '@/ui/audio/sound';
import type { ServedQuestion, DiagnosticProgress } from '@/services/diagnostic';

export interface DiagnosticItemResponse {
  question: ServedQuestion | null;
  progress: DiagnosticProgress;
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
      const payload = await res.json();
      return payload.data ?? payload;
    },
  });

  // Submit Answer mutation
  const answerMutation = useMutation({
    mutationFn: async (payload: { questionId: string; optionId?: string; text?: string }) => {
      const res = await fetch(`/api/diagnostic/sessions/${sessionId}/answers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: payload.questionId,
          ...(payload.optionId ? { optionId: payload.optionId } : {}),
          ...(payload.text ? { text: payload.text } : {}),
        }),
      });
      if (!res.ok) throw new Error('Failed to submit answer');
      const result = await res.json();
      return result.data ?? result;
    },
    onSuccess: (data) => {
      if (data.correct) {
        soundFx.playSuccess();
      } else {
        soundFx.playWrong();
      }
      setFeedback({
        correct: data.correct,
        explanation: data.explanation,
      });
    },
  });

  // Complete Diagnostic mutation
  const completeMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/diagnostic/sessions/${sessionId}/complete`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Failed to complete diagnostic');
      return res.json();
    },
    onSuccess: () => {
      soundFx.playComplete();
      onComplete();
    },
  });

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8, gap: 2 }}>
        <CircularProgress size={36} />
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Calibrating next adaptive question (2PL IRT Fisher Information)...
        </Typography>
      </Box>
    );
  }

  if (isError || !itemData) {
    return (
      <Card sx={{ p: 4, textAlign: 'center', borderRadius: tokens.radius.lg }}>
        <Typography variant="h3" sx={{ mb: 1.5 }}>
          Diagnostic Calibration Error
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
          Could not fetch the next question. Please try reloading.
        </Typography>
        <Button variant="contained" onClick={() => refetch()}>
          Retry Question
        </Button>
      </Card>
    );
  }

  if (itemData.progress?.complete || !itemData.question) {
    return (
      <Card sx={{ p: 5, textAlign: 'center', borderRadius: tokens.radius.lg, border: 1, borderColor: 'divider' }}>
        <Stack spacing={3} sx={{ alignItems: 'center', maxWidth: 460, mx: 'auto' }}>
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
            }}
          >
            ✓
          </Box>
          <Typography variant="h2" sx={{ fontSize: '1.75rem' }}>
            Diagnostic Complete!
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Your baseline ability estimate has been calibrated (θ = {itemData.progress?.theta?.toFixed(2) ?? '0.00'}).
            We have generated your personalized topological learning path and knowledge map.
          </Typography>
          <Button
            variant="contained"
            size="large"
            disabled={completeMutation.isPending}
            onClick={() => completeMutation.mutate()}
            sx={{
              px: 4,
              py: 1.5,
              bgcolor: tokens.color.googleBlue,
              '&:hover': { bgcolor: tokens.color.primaryDark },
            }}
          >
            {completeMutation.isPending ? 'Generating Learning Path…' : 'Enter Dashboard →'}
          </Button>
        </Stack>
      </Card>
    );
  }

  const q = itemData.question;
  const currentNum = (itemData.progress?.itemsServed ?? 0) + 1;
  const maxNum = itemData.progress?.maxItems ?? 7;

  const handleNext = () => {
    soundFx.playClick();
    setFeedback(null);
    setSelectedOptionId('');
    setTextAnswer('');
    queryClient.invalidateQueries({ queryKey: ['diagnostic-item', sessionId] });
    refetch();
  };

  const isAnswerValid = q.options && q.options.length > 0 ? Boolean(selectedOptionId) : Boolean(textAnswer.trim());

  return (
    <Stack spacing={3}>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <Chip
          label={`Question ${currentNum} of ${maxNum}`}
          size="small"
          sx={{ bgcolor: tokens.color.primaryLight, color: tokens.color.googleBlue, fontWeight: 700 }}
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

          {q.options && q.options.length > 0 ? (
            <RadioGroup
              value={selectedOptionId}
              onChange={(e) => {
                soundFx.playClick();
                setSelectedOptionId(e.target.value);
              }}
            >
              <Stack spacing={1.5}>
                {q.options.map((opt) => (
                  <Card
                    key={opt.id}
                    variant="outlined"
                    sx={{
                      borderRadius: tokens.radius.md,
                      borderColor: selectedOptionId === opt.id ? tokens.color.googleBlue : tokens.color.border,
                      bgcolor: selectedOptionId === opt.id ? tokens.color.primaryLight : 'background.paper',
                      transition: 'all 0.15s ease',
                      '&:hover': {
                        borderColor: tokens.color.googleBlue,
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

          {/* Feedback Result Alert */}
          {feedback && (
            <Box
              sx={{
                p: 2.5,
                borderRadius: tokens.radius.md,
                bgcolor: feedback.correct ? tokens.color.masteredFill : tokens.color.gapFill,
                border: 1,
                borderColor: feedback.correct ? tokens.color.googleGreen : tokens.color.googleRed,
              }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: feedback.correct ? tokens.color.googleGreen : tokens.color.googleRed }}>
                {feedback.correct ? '✓ Correct Answer' : 'Incorrect — Recording Concept Boundary'}
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
                    questionId: q.itemId,
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
                {answerMutation.isPending ? 'Grading Response…' : 'Submit Answer'}
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleNext}
                sx={{
                  px: 4,
                  py: 1.25,
                  bgcolor: tokens.color.googleBlue,
                  '&:hover': { bgcolor: tokens.color.primaryDark },
                }}
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
