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
import { LearnerIllustration } from '@/ui/graphics/LearnerIllustration';
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
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Top Navbar */}
      <Box
        component="header"
        sx={{
          py: 2.5,
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
                width={120}
                height={32}
                priority
                style={{ height: 'auto' }}
              />
            </Link>

            <Stack direction="row" spacing={{ xs: 1.5, sm: 3 }} sx={{ alignItems: 'center' }}>
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
                About
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
                Adaptive Loop
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
                    transition: 'all 0.15s ease',
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
                    transition: 'all 0.15s ease',
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

      {/* Main Split Content Area */}
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
            gridTemplateColumns: { xs: '1fr', md: '1.05fr 1fr' },
            gap: { xs: 5, md: 8 },
            alignItems: 'center',
          }}
        >
          {/* Left Column: Form & Prompts */}
          <Stack spacing={3.5} sx={{ maxWidth: 480, width: '100%', mx: { xs: 'auto', md: 0 } }}>
            <Stack spacing={1}>
              <Typography
                variant="h1"
                component="h1"
                sx={{
                  fontSize: { xs: '2rem', md: '2.4rem' },
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
                boxShadow: '0 4px 20px rgba(11, 31, 58, 0.04)',
                transition: 'box-shadow 0.2s ease',
                '&:hover': {
                  boxShadow: '0 8px 30px rgba(11, 31, 58, 0.07)',
                },
              }}
            >
              {children}
            </Paper>

            <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center' }}>
              {footer}
            </Typography>
          </Stack>

          {/* Right Column: Hero Graphic Illustration with Micro-Motion */}
          <Box
            sx={{
              display: { xs: 'none', md: 'flex' },
              justifyContent: 'center',
              alignItems: 'center',
              position: 'relative',
              '& .floating-node-1': {
                animation: 'floatSlow 4s ease-in-out infinite',
              },
              '& .floating-node-2': {
                animation: 'floatSlow 4s ease-in-out infinite 2s',
              },
              '@keyframes floatSlow': {
                '0%, 100%': { transform: 'translateY(0px)' },
                '50%': { transform: 'translateY(-8px)' },
              },
            }}
          >
            <LearnerIllustration />
          </Box>
        </Box>
      </Container>

      {/* Modern Bottom Arc Accent */}
      <Box
        aria-hidden="true"
        sx={{
          position: 'absolute',
          bottom: -120,
          right: -80,
          width: 320,
          height: 320,
          borderRadius: '50%',
          bgcolor: tokens.color.textPrimary,
          opacity: 0.95,
          zIndex: -1,
          pointerEvents: 'none',
          display: { xs: 'none', lg: 'block' },
        }}
      />
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
