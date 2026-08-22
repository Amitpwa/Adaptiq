/**
 * Design tokens.
 *
 * Deliberately free of the 'use client' directive and of any MUI import: this
 * module is plain data, so Server Components can read the actual values.
 * A module marked 'use client' exports client *references* across the server
 * boundary, not values — importing tokens from the theme would yield undefined
 * on the server.
 */
/**
 * Adaptiq design tokens.
 *
 * Light theme only, per the product requirement. Every colour pairing below
 * was chosen to clear WCAG 2.2 AA contrast (4.5:1 for text, 3:1 for UI
 * boundaries) against the surfaces it is actually used on — the status colours
 * in particular have a darker `text` variant separate from their `fill`,
 * because an amber that reads well as a chip background fails as body text.
 */
export const tokens = {
  color: {
    primary: '#1A5FD0',
    primaryDark: '#12439A',
    primaryLight: '#E8F0FD',

    mastered: '#1B7F4B',
    masteredFill: '#D8F0E2',
    fragile: '#8A5A00',
    fragileFill: '#FDECC8',
    inProgress: '#1A5FD0',
    inProgressFill: '#E8F0FD',
    gap: '#B3261E',
    gapFill: '#FBE3E1',
    locked: '#5F6368',
    lockedFill: '#ECEEF1',

    surface: '#FFFFFF',
    background: '#F7F8FA',
    border: '#DCE0E6',
    textPrimary: '#111A2B',
    textSecondary: '#4C5567',

    /** Graph-paper grid ink. Used at very low alpha. */
    grid: '#0B1F3A',
  },
  /** 8px base spacing scale — every gap in the product is a multiple. */
  spacingUnit: 8,
  /**
   * Corner radii as CSS lengths, NOT unitless numbers.
   *
   * MUI's `sx` prop multiplies a unitless `borderRadius` by
   * `theme.shape.borderRadius`, so `borderRadius: 16` renders as 160px. Keeping
   * these as strings makes them mean what they say wherever they are used.
   */
  radius: { sm: '6px', md: '10px', lg: '16px', pill: '999px' },
} as const;

/** Mastery band presentation. Colour is never the only channel — each band
 *  also carries a distinct label and, at the component level, an icon. */
export const masteryPalette = {
  MASTERED: { main: tokens.color.mastered, fill: tokens.color.masteredFill, label: 'Mastered' },
  FRAGILE: { main: tokens.color.fragile, fill: tokens.color.fragileFill, label: 'Needs review' },
  IN_PROGRESS: {
    main: tokens.color.inProgress,
    fill: tokens.color.inProgressFill,
    label: 'In progress',
  },
  GAP: { main: tokens.color.gap, fill: tokens.color.gapFill, label: 'Gap' },
  NOT_STARTED: { main: tokens.color.locked, fill: tokens.color.lockedFill, label: 'Not started' },
} as const;
