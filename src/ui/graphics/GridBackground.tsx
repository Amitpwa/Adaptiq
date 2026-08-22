import Box from '@mui/material/Box';
import type { SxProps, Theme } from '@mui/material/styles';

import { tokens } from '../tokens';

/**
 * Engineering graph-paper ground.
 *
 * Two layers — an 8px minor grid and a 48px major grid — at deliberately very
 * low alpha. The grid is a texture, not an element: it should register as
 * "this is a workbook" peripherally and never compete with content for
 * attention. If you consciously notice it while reading, it is too strong.
 *
 * Static by design. Scroll-linked or parallax backgrounds are a common trigger
 * for vestibular discomfort and would add nothing here.
 */
export function gridSx(): SxProps<Theme> {
  const minor = `${tokens.color.grid}08`; // ~3%
  const major = `${tokens.color.grid}0F`; // ~6%
  return {
    backgroundImage: [
      `linear-gradient(to right, ${minor} 1px, transparent 1px)`,
      `linear-gradient(to bottom, ${minor} 1px, transparent 1px)`,
      `linear-gradient(to right, ${major} 1px, transparent 1px)`,
      `linear-gradient(to bottom, ${major} 1px, transparent 1px)`,
    ].join(', '),
    backgroundSize: '8px 8px, 8px 8px, 48px 48px, 48px 48px',
  };
}

/** Full-bleed fixed grid layer for the application background. */
export function GridBackground() {
  return (
    <Box
      aria-hidden="true"
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: -1,
        pointerEvents: 'none',
        ...gridSx(),
      }}
    />
  );
}
