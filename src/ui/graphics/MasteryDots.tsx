import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import LockIcon from '@mui/icons-material/Lock';
import ErrorIcon from '@mui/icons-material/Error';

import { masteryPalette } from '../tokens';

export type MasteryBand = keyof typeof masteryPalette;

const BAND_ICONS: Record<MasteryBand, typeof CheckCircleIcon> = {
  MASTERED: CheckCircleIcon,
  FRAGILE: WarningAmberIcon,
  IN_PROGRESS: HourglassEmptyIcon,
  GAP: ErrorIcon,
  NOT_STARTED: LockIcon,
};

export interface MasteryDotsProps {
  band: MasteryBand;
  /** Effective mastery, 0-1. */
  value: number;
  /** Height in pixels. */
  height?: number;
  labelled?: boolean;
}

export function MasteryDots({ band, value, height = 48, labelled = true }: MasteryDotsProps) {
  const palette = masteryPalette[band] ?? masteryPalette.NOT_STARTED;
  const IconComponent = BAND_ICONS[band] ?? LockIcon;
  const percentage = Math.round(Math.min(Math.max(value, 0), 1) * 100);

  return (
    <Stack spacing={1}>
      <Box
        sx={{
          width: '100%',
          height,
          borderRadius: '8px',
          bgcolor: palette.fill,
          border: 1.5,
          borderColor: palette.main,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.03)',
        }}
      >
        <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
          <IconComponent sx={{ color: palette.main, fontSize: 22 }} />
          <Typography variant="body2" sx={{ color: palette.main, fontWeight: 700 }}>
            {palette.label}
          </Typography>
        </Stack>

        <Typography variant="subtitle2" sx={{ color: palette.main, fontWeight: 800, fontFamily: 'monospace' }}>
          {percentage}%
        </Typography>
      </Box>

      {labelled && (
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
            Calculated via Bayesian Knowledge Tracing
          </Typography>
        </Stack>
      )}
    </Stack>
  );
}
