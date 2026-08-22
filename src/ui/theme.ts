'use client';

import { createTheme } from '@mui/material/styles';

import { FONT_STACKS } from './fonts';
import { tokens } from './tokens';

export const theme = createTheme({
  cssVariables: true,
  palette: {
    mode: 'light',
    primary: { main: tokens.color.primary, dark: tokens.color.primaryDark },
    success: { main: tokens.color.mastered },
    warning: { main: tokens.color.fragile },
    error: { main: tokens.color.gap },
    background: { default: tokens.color.background, paper: tokens.color.surface },
    text: { primary: tokens.color.textPrimary, secondary: tokens.color.textSecondary },
    divider: tokens.color.border,
  },
  // Numeric here by necessity: MUI treats theme.shape.borderRadius as the
  // base multiplier for unitless sx values.
  shape: { borderRadius: 10 },
  spacing: tokens.spacingUnit,
  typography: {
    // Body copy in Inter for sustained reading; display type in Poppins.
    fontFamily: FONT_STACKS.body,
    h1: {
      fontFamily: FONT_STACKS.display,
      fontSize: '2.5rem',
      fontWeight: 600,
      letterSpacing: '-0.02em',
      lineHeight: 1.15,
    },
    h2: {
      fontFamily: FONT_STACKS.display,
      fontSize: '1.875rem',
      fontWeight: 600,
      letterSpacing: '-0.01em',
      lineHeight: 1.2,
    },
    h3: { fontFamily: FONT_STACKS.display, fontSize: '1.375rem', fontWeight: 600, lineHeight: 1.3 },
    h4: { fontFamily: FONT_STACKS.display, fontSize: '1.125rem', fontWeight: 600, lineHeight: 1.4 },
    body1: { fontSize: '1rem', lineHeight: 1.6 },
    body2: { fontSize: '0.9375rem', lineHeight: 1.55 },
    button: { fontFamily: FONT_STACKS.display, textTransform: 'none', fontWeight: 500 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        // A visible, high-contrast focus ring on every focusable element.
        // Never removed: keyboard users must always be able to see where
        // they are.
        '*:focus-visible': {
          outline: `3px solid ${tokens.color.primary}`,
          outlineOffset: '2px',
          borderRadius: '4px',
        },
        // Respect the platform reduced-motion setting globally, as a floor
        // beneath the app's own GSAP matchMedia handling.
        '@media (prefers-reduced-motion: reduce)': {
          '*, *::before, *::after': {
            animationDuration: '0.001ms !important',
            animationIterationCount: '1 !important',
            transitionDuration: '0.001ms !important',
            scrollBehavior: 'auto !important',
          },
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: tokens.radius.pill, paddingInline: '1.25rem', minHeight: 44 },
      },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: { border: `1px solid ${tokens.color.border}`, backgroundImage: 'none' },
      },
    },
    MuiLink: {
      defaultProps: { underline: 'always' },
    },
  },
});
