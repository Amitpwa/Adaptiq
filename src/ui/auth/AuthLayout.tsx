'use client';

import Image from 'next/image';
import Link from 'next/link';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { AppLink } from '@/ui/components/AppLink';
import { tokens } from '@/ui/tokens';

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
  mode,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
  mode: 'login' | 'register';
}) {
  return (
    <Box
      component="main"
      id="main-content"
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Top Navbar */}
      <Box
        component="header"
        sx={{
          py: 2,
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Container maxWidth="lg">
          <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <Link href="/" aria-label="Adaptiq home" style={{ display: 'flex', alignItems: 'center' }}>
              <Image
                src="/adaptiq-logo.svg"
                alt="Adaptiq"
                width={124}
                height={33}
                priority
                style={{ height: 'auto' }}
              />
            </Link>

            <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
              <Button
                component={Link}
                href="/"
                sx={{
                  color: 'text.secondary',
                  display: { xs: 'none', md: 'inline-flex' },
                  fontWeight: 500,
                  '&:hover': { color: 'text.primary' },
                }}
              >
                Overview
              </Button>
              <Button
                component={Link}
                href="/#loop"
                sx={{
                  color: 'text.secondary',
                  display: { xs: 'none', md: 'inline-flex' },
                  fontWeight: 500,
                  '&:hover': { color: 'text.primary' },
                }}
              >
                Adaptive Cycle
              </Button>

              {mode === 'register' ? (
                <Button
                  component={Link}
                  href="/login"
                  variant="outlined"
                  size="small"
                  sx={{
                    borderColor: tokens.color.border,
                    color: tokens.color.textPrimary,
                    px: 2.5,
                    fontWeight: 600,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      borderColor: tokens.color.primary,
                      transform: 'translateY(-1px)',
                    },
                  }}
                >
                  Log In
                </Button>
              ) : (
                <Button
                  component={Link}
                  href="/register"
                  variant="contained"
                  size="small"
                  sx={{
                    bgcolor: tokens.color.textPrimary,
                    color: '#FFFFFF',
                    px: 2.5,
                    fontWeight: 600,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: tokens.color.primaryDark,
                      transform: 'translateY(-1px)',
                    },
                  }}
                >
                  Sign Up
                </Button>
              )}
            </Stack>
          </Stack>
        </Container>
      </Box>

      {/* Main Split Content Area with Professional Photography */}
      <Container
        maxWidth="lg"
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          py: { xs: 4, md: 6 },
        }}
      >
        <Box
          sx={{
            width: '100%',
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            gap: { xs: 5, md: 7 },
            alignItems: 'center',
          }}
        >
          {/* Left Column: Form Card */}
          <Stack spacing={3} sx={{ maxWidth: 480, width: '100%', mx: { xs: 'auto', md: 0 } }}>
            <Stack spacing={1}>
              <Typography
                variant="h1"
                component="h1"
                sx={{
                  fontSize: { xs: '2rem', md: '2.5rem' },
                  fontWeight: 600,
                  letterSpacing: '-0.02em',
                }}
              >
                {title}
              </Typography>
              <Typography variant="body1" sx={{ color: 'text.secondary', fontSize: '1rem' }}>
                {subtitle}
              </Typography>
            </Stack>

            <Paper
              elevation={0}
              sx={{
                p: { xs: 3, sm: 4 },
                borderRadius: tokens.radius.lg,
                border: 1,
                borderColor: 'divider',
                bgcolor: 'background.paper',
                boxShadow: '0 4px 20px rgba(11, 31, 58, 0.05)',
                transition: 'box-shadow 0.2s ease',
                '&:hover': {
                  boxShadow: '0 8px 30px rgba(11, 31, 58, 0.08)',
                },
              }}
            >
              {children}
            </Paper>

            <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center' }}>
              {footer}
            </Typography>
          </Stack>

          {/* Right Column: Editorial Real Photography & Cognitive Telemetry */}
          <Box
            sx={{
              display: { xs: 'none', md: 'flex' },
              flexDirection: 'column',
              gap: 2.5,
              alignItems: 'center',
            }}
          >
            <Paper
              elevation={0}
              sx={{
                position: 'relative',
                width: '100%',
                maxWidth: 480,
                height: 400,
                borderRadius: tokens.radius.lg,
                overflow: 'hidden',
                border: 1,
                borderColor: 'divider',
                boxShadow: '0 12px 36px rgba(11, 31, 58, 0.08)',
              }}
            >
              <Image
                src="/auth-learner.jpg"
                alt="Technical engineer learning concepts in Adaptiq"
                fill
                style={{ objectFit: 'cover' }}
                priority
              />
              <Box
                sx={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to top, rgba(17, 26, 43, 0.85) 0%, rgba(17, 26, 43, 0) 60%)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                  p: 3,
                }}
              >
                <Typography variant="subtitle1" sx={{ color: '#FFFFFF', fontWeight: 600 }}>
                  Smart Practice at Your Exact Level
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.8)', mt: 0.5 }}>
                  Adaptiq continuously learns what you know and tailors every question, explanation, and hint to your pace.
                </Typography>
              </Box>
            </Paper>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}

export function AuthSwitchLink({ href, prompt, action }: { href: string; prompt: string; action: string }) {
  return (
    <>
      {prompt}{' '}
      <AppLink href={href} sx={{ fontWeight: 600, color: tokens.color.primary }}>
        {action}
      </AppLink>
    </>
  );
}
