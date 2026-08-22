/**
 * Design tokens with iconic Google brand accent colors for playful highlights.
 */
export const tokens = {
  color: {
    primary: '#1A5FD0',
    primaryDark: '#12439A',
    primaryLight: '#E8F0FD',

    // Google Signature Quad Palette
    googleBlue: '#4285F4',
    googleRed: '#EA4335',
    googleYellow: '#FBBC05',
    googleGreen: '#34A853',

    mastered: '#137333',
    masteredFill: '#E6F4EA',
    fragile: '#B06000',
    fragileFill: '#FEF7E0',
    inProgress: '#1A73E8',
    inProgressFill: '#E8F0FE',
    gap: '#D93025',
    gapFill: '#FCE8E6',
    locked: '#5F6368',
    lockedFill: '#F1F3F4',

    surface: '#FFFFFF',
    background: '#F8F9FA',
    border: '#DADCE0',
    textPrimary: '#202124',
    textSecondary: '#5F6368',

    grid: '#1A73E8',
  },
  spacingUnit: 8,
  radius: { sm: '6px', md: '10px', lg: '16px', pill: '999px' },
} as const;

export const masteryPalette = {
  MASTERED: { main: tokens.color.mastered, fill: tokens.color.masteredFill, label: 'Mastered' },
  FRAGILE: { main: tokens.color.fragile, fill: tokens.color.fragileFill, label: 'Review Due' },
  IN_PROGRESS: { main: tokens.color.inProgress, fill: tokens.color.inProgressFill, label: 'In Progress' },
  GAP: { main: tokens.color.gap, fill: tokens.color.gapFill, label: 'Foundational Gap' },
  NOT_STARTED: { main: tokens.color.locked, fill: tokens.color.lockedFill, label: 'Not Started' },
} as const;
