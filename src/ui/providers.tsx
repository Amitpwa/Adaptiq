'use client';

import { useState } from 'react';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { theme } from './theme';

/**
 * Client-side providers.
 *
 * The QueryClient is created inside state rather than at module scope so each
 * request gets its own cache during server rendering — a module-level client
 * would leak one learner's data into another's render.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Knowledge state changes only when the learner acts, so polling
            // would be pure waste. Refetch on demand instead.
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  );
}
