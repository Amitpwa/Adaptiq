import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { tokens } from '@/ui/tokens';

export function StepIndicator({
  currentStep,
  totalSteps = 3,
  labels = ['Select Goal', 'Cognitive Lens', 'Diagnostic Assessment'],
}: {
  currentStep: number;
  totalSteps?: number;
  labels?: string[];
}) {
  const progress = Math.min(100, Math.max(0, (currentStep / totalSteps) * 100));

  return (
    <Stack spacing={2} sx={{ width: '100%', mb: 4 }}>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="body2" sx={{ fontWeight: 700, color: tokens.color.googleBlue }}>
          Step {currentStep} of {totalSteps}: {labels[currentStep - 1] ?? ''}
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
          {Math.round(progress)}% Complete
        </Typography>
      </Stack>
      <LinearProgress
        variant="determinate"
        value={progress}
        sx={{
          height: 8,
          borderRadius: tokens.radius.pill,
          bgcolor: tokens.color.primaryLight,
          '& .MuiLinearProgress-bar': {
            bgcolor: tokens.color.googleBlue,
            borderRadius: tokens.radius.pill,
          },
        }}
      />
    </Stack>
  );
}
