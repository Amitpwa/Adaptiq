import Box from '@mui/material/Box';
import type { SxProps, Theme } from '@mui/material/styles';

/**
 * Premium Modern Grid with Gradient Glow Background.
 *
 * Combines a clean, subtle 32px modern UI grid with smooth, ambient linear and radial
 * gradients (subtle slate/indigo/blue glow) that deliver an ultra-premium SaaS aesthetic
 * rather than a raw notebook graph-paper look.
 */
export function gridSx(): SxProps<Theme> {
  return {
    background: [
      // Ambient radial gradient spots for depth and softness
      'radial-gradient(ellipse at 15% 0%, rgba(26, 95, 208, 0.07) 0%, transparent 60%)',
      'radial-gradient(ellipse at 85% 10%, rgba(14, 165, 233, 0.05) 0%, transparent 50%)',
      'radial-gradient(ellipse at 50% 90%, rgba(99, 102, 241, 0.04) 0%, transparent 60%)',
      // Clean modern orthogonal grid
      'linear-gradient(to right, rgba(17, 26, 43, 0.04) 1px, transparent 1px)',
      'linear-gradient(to bottom, rgba(17, 26, 43, 0.04) 1px, transparent 1px)',
      // Base premium soft slate-to-white subtle gradient
      'linear-gradient(180deg, #F8FAFC 0%, #F1F5F9 50%, #FFFFFF 100%)',
    ].join(', '),
    backgroundSize: '100% 100%, 100% 100%, 100% 100%, 36px 36px, 36px 36px, 100% 100%',
  };
}

/** Full-bleed fixed modern grid layer for the application background. */
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
