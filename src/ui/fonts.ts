import { Inter, Poppins } from 'next/font/google';

/**
 * Typography stack.
 *
 * NOTE ON PRODUCT SANS: Product Sans is Google's proprietary corporate
 * typeface. It is not published on Google Fonts and its licence does not
 * permit third-party use, so it cannot be shipped in this product. Poppins is
 * used for display type instead — it is the closest freely licensed geometric
 * sans and carries the same rounded, single-storey character.
 *
 * Poppins is a geometric display face: excellent for headings, but its wide
 * letterforms and uniform stroke make it tiring for long-form reading at small
 * sizes. In a product where learners read explanations for extended periods,
 * body copy is set in Inter, which is optimised for exactly that. If a single
 * family is preferred, change BODY_FONT below — nothing else needs to move.
 */

export const displayFont = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-display',
});

export const bodyFont = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-body',
});

/** CSS font stacks consumed by the MUI theme. */
export const FONT_STACKS = {
  display: 'var(--font-display), "Poppins", system-ui, sans-serif',
  body: 'var(--font-body), system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
} as const;
