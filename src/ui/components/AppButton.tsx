'use client';

import NextLink from 'next/link';
import Button, { type ButtonProps } from '@mui/material/Button';

/**
 * A MUI Button that navigates with Next.js routing.
 *
 * This wrapper has to be a client component. MUI's polymorphic `component`
 * prop takes a function component, and React cannot serialise a function
 * across the server/client boundary — passing `component={Link}` from a Server
 * Component throws at render. Composing it here lets Server Components link
 * freely while keeping client-side navigation and prefetching.
 */
export function AppButton({
  href,
  children,
  ...rest
}: { href: string; children: React.ReactNode } & Omit<ButtonProps, 'href' | 'children'>) {
  return (
    <Button component={NextLink} href={href} {...rest}>
      {children}
    </Button>
  );
}
