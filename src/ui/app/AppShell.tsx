'use client';

import { usePathname } from 'next/navigation';
import Image from 'next/image';
import NextLink from 'next/link';
import { signOut } from 'next-auth/react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';

import { tokens } from '@/ui/tokens';

const NAV = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/path', label: 'Your path' },
];

/**
 * Authenticated application chrome.
 *
 * Navigation uses real links rather than click handlers so it works with
 * middle-click, keyboard, and screen-reader link lists. The current page is
 * marked with aria-current, not colour alone.
 */
export function AppShell({ userName, children }: { userName: string; children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <Box sx={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: 'background.paper',
          borderBottom: 1,
          borderColor: 'divider',
          color: 'text.primary',
        }}
      >
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ gap: 3, minHeight: 64 }}>
            <NextLink href="/dashboard" aria-label="Adaptiq dashboard" style={{ display: 'flex' }}>
              <Image
                src="/adaptiq-logo.svg"
                alt="Adaptiq"
                width={96}
                height={26}
                style={{ height: 'auto' }}
              />
            </NextLink>

            <Box component="nav" aria-label="Main" sx={{ flexGrow: 1 }}>
              <Stack direction="row" spacing={0.5}>
                {NAV.map((item) => {
                  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <Button
                      key={item.href}
                      component={NextLink}
                      href={item.href}
                      aria-current={active ? 'page' : undefined}
                      sx={{
                        color: active ? tokens.color.primaryDark : 'text.secondary',
                        bgcolor: active ? tokens.color.primaryLight : 'transparent',
                        fontWeight: active ? 700 : 500,
                      }}
                    >
                      {item.label}
                    </Button>
                  );
                })}
              </Stack>
            </Box>

            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
              <Typography
                variant="body2"
                sx={{ color: 'text.secondary', display: { xs: 'none', sm: 'block' } }}
              >
                {userName}
              </Typography>
              <Button
                variant="outlined"
                size="small"
                onClick={() => void signOut({ callbackUrl: '/' })}
              >
                Sign out
              </Button>
            </Stack>
          </Toolbar>
        </Container>
      </AppBar>

      <Box component="main" id="main-content" sx={{ flexGrow: 1, py: { xs: 3, md: 5 } }}>
        {children}
      </Box>
    </Box>
  );
}
