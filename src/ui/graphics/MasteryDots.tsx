import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { masteryPalette } from '../tokens';

export type MasteryBand = keyof typeof masteryPalette;

/**
 * Halftone mastery field — Adaptiq's primary visual encoding.
 *
 * Dot radius is a function of the mastery value, so the quantity is legible
 * from density alone. This is what lets the same graphic work in greyscale,
 * under low contrast, and for colour-blind learners: colour is the fourth
 * redundant channel, after density, label, and (at the node level) icon.
 *
 * Density is quantised into buckets so that repeated renders reuse a small set
 * of pattern definitions rather than generating one per node.
 */

const DOT_PITCH = 10;
const MIN_RADIUS = 0.6;
const MAX_RADIUS = 4.2;
const BUCKETS = 8;

/** Quantise a 0-1 mastery value into a density bucket index. */
export function densityBucket(value: number): number {
  const clamped = Math.min(Math.max(value, 0), 1);
  return Math.min(BUCKETS - 1, Math.round(clamped * (BUCKETS - 1)));
}

/** Dot radius for a bucket, in pattern units. */
export function bucketRadius(bucket: number): number {
  const t = bucket / (BUCKETS - 1);
  return MIN_RADIUS + t * (MAX_RADIUS - MIN_RADIUS);
}

export interface MasteryDotsProps {
  band: MasteryBand;
  /** Effective mastery, 0-1. */
  value: number;
  /** Height of the swatch in pixels; width always fills its container. */
  height?: number;
  /**
   * When false the graphic is decorative and the surrounding component is
   * responsible for the accessible text. Defaults to true.
   */
  labelled?: boolean;
}

export function MasteryDots({ band, value, height = 68, labelled = true }: MasteryDotsProps) {
  const palette = masteryPalette[band];
  const bucket = densityBucket(value);
  const radius = bucketRadius(bucket);
  const patternId = `halftone-b${bucket}-${band.toLowerCase()}`;

  return (
    <Stack spacing={1}>
      <Box
        sx={{
          width: '100%',
          height,
          borderRadius: '8px',
          overflow: 'hidden',
          bgcolor: palette.fill,
          border: 1,
          borderColor: 'divider',
        }}
      >
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 100 62"
          role={labelled ? 'img' : 'presentation'}
          aria-label={
            labelled ? `${palette.label}, ${Math.round(value * 100)} percent mastery` : undefined
          }
          aria-hidden={labelled ? undefined : true}
        >
          <defs>
            <pattern
              id={patternId}
              width={DOT_PITCH}
              height={DOT_PITCH}
              patternUnits="userSpaceOnUse"
            >
              <circle cx={DOT_PITCH / 2} cy={DOT_PITCH / 2} r={radius} fill={palette.main} />
            </pattern>
          </defs>
          <rect width="100" height="62" fill={`url(#${patternId})`} />
        </svg>
      </Box>

      {labelled && (
        <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
          <Box
            aria-hidden="true"
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              bgcolor: palette.main,
              flexShrink: 0,
            }}
          />
          <Typography variant="body2" sx={{ color: palette.main, fontWeight: 600 }}>
            {palette.label}
          </Typography>
        </Stack>
      )}
    </Stack>
  );
}
