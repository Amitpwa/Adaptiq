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
import SettingsIcon from '@mui/icons-material/Settings';

import { tokens } from '@/ui/tokens';
import { soundFx } from '@/ui/audio/sound';

const NAV = [
  { href: '/dashboard', label: 'Knowledge Map' },
  { href: '/path', label: 'Topological Path' },
  { href: '/review', label: 'Spaced Retrieval' },
  { href: '/profile', label: 'Profile & BYOK' },
];

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
            <NextLink
              href="/dashboard"
              aria-label="Adaptiq dashboard"
              style={{ display: 'flex' }}
              onClick={() => soundFx.playClick()}
            >
              <Image
                src="/adaptiq-logo.svg"
                alt="Adaptiq"
                width={112}
                height={30}
                style={{ height: 'auto' }}
              />
            </NextLink>

            <Box component="nav" aria-label="Main" sx={{ flexGrow: 1 }}>
              <Stack direction="row" spacing={1}>
                {NAV.map((item) => {
                  const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                  return (
                    <Button
                      key={item.href}
                      component={NextLink}
                      href={item.href}
                      onClick={() => soundFx.playClick()}
                      aria-current={active ? 'page' : undefined}
                      sx={{
                        color: active ? tokens.color.googleBlue : 'text.secondary',
                        bgcolor: active ? tokens.color.primaryLight : 'transparent',
                        fontWeight: active ? 700 : 500,
                        borderRadius: tokens.radius.pill,
                        px: 2,
                        '&:hover': {
                          bgcolor: active ? tokens.color.primaryLight : tokens.color.lockedFill,
                        },
                      }}
                    >
                      {item.label}
                    </Button>
                  );
                })}
              </Stack>
            </Box>

            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
              <Button
                component={NextLink}
                href="/profile"
                size="small"
                onClick={() => soundFx.playClick()}
                startIcon={<SettingsIcon sx={{ fontSize: 18 }} />}
                sx={{
                  color: 'text.secondary',
                  display: { xs: 'none', sm: 'inline-flex' },
                  fontWeight: 600,
                }}
              >
                {userName}
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  soundFx.playClick();
                  void signOut({ callbackUrl: '/' });
                }}
                sx={{
                  borderColor: tokens.color.border,
                  color: tokens.color.textPrimary,
                  fontWeight: 600,
                }}
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
