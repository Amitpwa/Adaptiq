'use client';

import Image from 'next/image';
import Link from 'next/link';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { tokens } from '@/ui/tokens';
import { soundFx } from '@/ui/audio/sound';

export function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        borderTop: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
        py: { xs: 6, md: 8 },
        mt: 'auto',
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          {/* Brand Col */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Stack spacing={2}>
              <Link
                href="/"
                aria-label="Adaptiq home"
                style={{ display: 'inline-flex' }}
                onClick={() => soundFx.playClick()}
              >
                <Image
                  src="/adaptiq-logo.svg"
                  alt="Adaptiq"
                  width={124}
                  height={33}
                  style={{ height: 'auto' }}
                />
              </Link>
              <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 300, lineHeight: 1.6 }}>
                Personalized learning engineered around what you actually know. Intelligent diagnostics, custom paths, and guided tutoring.
              </Typography>
            </Stack>
          </Grid>

          {/* Learning Col */}
          <Grid size={{ xs: 6, sm: 4, md: 2 }}>
            <Stack spacing={1.5}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                Platform
              </Typography>
              <Link
                href="/dashboard"
                onClick={() => soundFx.playClick()}
                style={{ color: tokens.color.textSecondary, textDecoration: 'none', fontSize: '0.875rem' }}
              >
                Knowledge Map
              </Link>
              <Link
                href="/path"
                onClick={() => soundFx.playClick()}
                style={{ color: tokens.color.textSecondary, textDecoration: 'none', fontSize: '0.875rem' }}
              >
                Learning Path
              </Link>
              <Link
                href="/review"
                onClick={() => soundFx.playClick()}
                style={{ color: tokens.color.textSecondary, textDecoration: 'none', fontSize: '0.875rem' }}
              >
                Memory Review
              </Link>
              <Link
                href="/onboarding"
                onClick={() => soundFx.playClick()}
                style={{ color: tokens.color.textSecondary, textDecoration: 'none', fontSize: '0.875rem' }}
              >
                Skill Check
              </Link>
            </Stack>
          </Grid>

          {/* Settings & AI Col */}
          <Grid size={{ xs: 6, sm: 4, md: 3 }}>
            <Stack spacing={1.5}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                Account & AI
              </Typography>
              <Link
                href="/profile"
                onClick={() => soundFx.playClick()}
                style={{ color: tokens.color.textSecondary, textDecoration: 'none', fontSize: '0.875rem' }}
              >
                Profile & Settings
              </Link>
              <Link
                href="/profile"
                onClick={() => soundFx.playClick()}
                style={{ color: tokens.color.textSecondary, textDecoration: 'none', fontSize: '0.875rem' }}
              >
                Bring Your Own Key (BYOK)
              </Link>
              <Link
                href="/login"
                onClick={() => soundFx.playClick()}
                style={{ color: tokens.color.textSecondary, textDecoration: 'none', fontSize: '0.875rem' }}
              >
                Sign In
              </Link>
              <Link
                href="/register"
                onClick={() => soundFx.playClick()}
                style={{ color: tokens.color.textSecondary, textDecoration: 'none', fontSize: '0.875rem' }}
              >
                Create Account
              </Link>
            </Stack>
          </Grid>

          {/* Principles Col */}
          <Grid size={{ xs: 12, sm: 4, md: 3 }}>
            <Stack spacing={1.5}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                How It Works
              </Typography>
              <Link
                href="/#loop"
                onClick={() => soundFx.playClick()}
                style={{ color: tokens.color.textSecondary, textDecoration: 'none', fontSize: '0.875rem' }}
              >
                8-Step Adaptive Cycle
              </Link>
              <Link
                href="/#main-content"
                onClick={() => soundFx.playClick()}
                style={{ color: tokens.color.textSecondary, textDecoration: 'none', fontSize: '0.875rem' }}
              >
                Adaptive Skill Diagnostic
              </Link>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', pt: 0.5 }}>
                AES-256 encrypted credential protection & live continuous progress modeling.
              </Typography>
            </Stack>
          </Grid>
        </Grid>

        <Divider sx={{ my: 4 }} />

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' }, gap: 2 }}
        >
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            © {new Date().getFullYear()} Adaptiq. All rights reserved.
          </Typography>
          <Stack direction="row" spacing={3}>
            <Link
              href="/"
              onClick={() => soundFx.playClick()}
              style={{ color: tokens.color.textSecondary, textDecoration: 'none', fontSize: '0.75rem' }}
            >
              Home
            </Link>
            <Link
              href="/dashboard"
              onClick={() => soundFx.playClick()}
              style={{ color: tokens.color.textSecondary, textDecoration: 'none', fontSize: '0.75rem' }}
            >
              Dashboard
            </Link>
            <Link
              href="/profile"
              onClick={() => soundFx.playClick()}
              style={{ color: tokens.color.textSecondary, textDecoration: 'none', fontSize: '0.75rem' }}
            >
              Privacy & Security
            </Link>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
