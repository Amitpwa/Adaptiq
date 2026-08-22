'use client';

import NextLink from 'next/link';
import MuiLink, { type LinkProps as MuiLinkProps } from '@mui/material/Link';

/**
 * Next.js routing with MUI's link styling.
 *
 * This has to be a client component: MUI's `component` prop takes a function
 * component, and functions cannot be serialised across the server/client
 * boundary. Wrapping the composition here lets Server Components use it freely
 * while keeping client-side navigation and prefetching.
 */
export function AppLink({
  href,
  children,
  ...rest
}: { href: string; children: React.ReactNode } & Omit<MuiLinkProps, 'href' | 'children'>) {
  return (
    <MuiLink component={NextLink} href={href} {...rest}>
      {children}
    </MuiLink>
  );
}
