'use client';

import Image from 'next/image';
import Link from 'next/link';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { MasteryDots } from '@/ui/graphics/MasteryDots';
import { Footer } from '@/ui/components/Footer';
import { tokens } from '@/ui/tokens';
import { soundFx } from '@/ui/audio/sound';

const PROSE_WIDTH = 640;

const LOOP_STEPS = [
  {
    num: '01',
    label: 'Smart Skill Check',
    detail: 'A quick 5-minute quiz that pinpoints exactly what you already understand and what you should learn next.',
  },
  {
    num: '02',
    label: 'Real-Time Progress Tracking',
    detail: 'Your mastery level updates instantly after every practice question with continuous accuracy.',
  },
  {
    num: '03',
    label: 'Knowledge Gap Detection',
    detail: 'Identifies missing foundation topics so you never get stuck on advanced lessons.',
  },
  {
    num: '04',
    label: 'Personalized Learning Path',
    detail: 'Creates the shortest step-by-step roadmap tailored specifically to your goals.',
  },
  {
    num: '05',
    label: '4 Learning Styles',
    detail: 'Switch any topic between intuitive analogies, deep explanations, practical code, and visual diagrams.',
  },
  {
    num: '06',
    label: 'Interactive AI Tutor',
    detail: 'Step-by-step guided hints that help you solve problems without spoiling the answer.',
  },
  {
    num: '07',
    label: 'Smart Memory Reviews',
    detail: 'Timed 2-minute refreshers scheduled right before you forget key ideas.',
  },
  {
    num: '08',
    label: 'Clear Next Recommendations',
    detail: 'Always know what to study next with simple, transparent explanations on your dashboard.',
  },
];

const MASTERY_SAMPLES = [
  { band: 'GAP' as const, value: 0.15, concept: 'Pointer arithmetic' },
  { band: 'IN_PROGRESS' as const, value: 0.45, concept: 'Recursion' },
  { band: 'FRAGILE' as const, value: 0.72, concept: 'Big-O notation' },
  { band: 'MASTERED' as const, value: 0.93, concept: 'Variables & types' },
];

function Section({
  children,
  tinted = false,
  id,
}: {
  children: React.ReactNode;
  tinted?: boolean;
  id?: string;
}) {
  return (
    <Box
      component="section"
      id={id}
      sx={
        tinted
          ? {
              bgcolor: 'background.paper',
              borderTop: 1,
              borderBottom: 1,
              borderColor: 'divider',
            }
          : undefined
      }
    >
      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 9 } }}>
        {children}
      </Container>
    </Box>
  );
}

function SectionHeading({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Stack spacing={1.5} sx={{ maxWidth: PROSE_WIDTH, mb: 5 }}>
      <Typography variant="h2" component="h2" sx={{ fontSize: { xs: '1.75rem', md: '2.25rem' } }}>
        {title}
      </Typography>
      <Typography variant="body1" sx={{ color: 'text.secondary', fontSize: '1.05rem', lineHeight: 1.6 }}>
        {children}
      </Typography>
    </Stack>
  );
}

export default function HomePage() {
  return (
    <Box component="main" id="main-content">
      {/* ---------------------------------------------------------------- */}
      {/* Top Navbar with Clean Material Header                            */}
      {/* ---------------------------------------------------------------- */}
      <Box
        component="nav"
        sx={{
          py: 2,
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          backdropFilter: 'blur(8px)',
        }}
      >
        <Container maxWidth="lg">
          <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <Link
              href="/"
              aria-label="Adaptiq home"
              style={{ display: 'flex', alignItems: 'center' }}
              onClick={() => soundFx.playClick()}
            >
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
                href="/login"
                variant="outlined"
                size="small"
                onClick={() => soundFx.playClick()}
                sx={{
                  borderColor: tokens.color.border,
                  color: tokens.color.textPrimary,
                  px: 2.5,
                  fontWeight: 600,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    borderColor: tokens.color.googleBlue,
                    color: tokens.color.googleBlue,
                    transform: 'translateY(-1px)',
                  },
                }}
              >
                Log In
              </Button>
              <Button
                component={Link}
                href="/register"
                variant="contained"
                size="small"
                onClick={() => soundFx.playClick()}
                sx={{
                  bgcolor: tokens.color.googleBlue,
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
                Get Started
              </Button>
            </Stack>
          </Stack>
        </Container>
      </Box>

      {/* ---------------------------------------------------------------- */}
      {/* Hero Section with Clean Language and Highlights                 */}
      {/* ---------------------------------------------------------------- */}
      <Box component="header">
        <Container maxWidth="lg" sx={{ pt: { xs: 6, md: 8 }, pb: { xs: 6, md: 9 } }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', lg: '1.1fr 0.9fr' },
              gap: { xs: 5, lg: 7 },
              alignItems: 'center',
            }}
          >
            {/* Left Hero Copy */}
            <Stack spacing={3.5}>
              <Chip
                label="Personalized Learning Platform"
                size="small"
                sx={{
                  alignSelf: 'flex-start',
                  bgcolor: tokens.color.primaryLight,
                  color: tokens.color.googleBlue,
                  fontWeight: 700,
                  borderRadius: tokens.radius.pill,
                  px: 1,
                }}
              />
              <Typography
                variant="h1"
                component="h1"
                sx={{
                  fontSize: { xs: '2.5rem', md: '3.4rem' },
                  lineHeight: 1.15,
                  letterSpacing: '-0.02em',
                }}
              >
                Learning designed around what you{' '}
                <Box component="span" sx={{ color: tokens.color.googleBlue }}>
                  actually
                </Box>{' '}
                <Box component="span" sx={{ color: tokens.color.googleGreen }}>
                  know
                </Box>
                .
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  fontSize: '1.125rem',
                  color: 'text.secondary',
                  maxWidth: PROSE_WIDTH,
                  lineHeight: 1.7,
                }}
              >
                Traditional courses teach everyone the exact same way. Adaptiq learns what you understand, skips what you already know, and gives you personalized explanations and guided hints for every topic.
              </Typography>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ pt: 1 }}>
                <Button
                  component={Link}
                  href="/register"
                  variant="contained"
                  size="large"
                  onClick={() => soundFx.playClick()}
                  sx={{
                    px: 4,
                    py: 1.5,
                    fontSize: '1rem',
                    fontWeight: 600,
                    bgcolor: tokens.color.googleBlue,
                    boxShadow: '0 4px 16px rgba(66, 133, 244, 0.3)',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: tokens.color.primaryDark,
                      transform: 'translateY(-2px)',
                      boxShadow: '0 6px 20px rgba(66, 133, 244, 0.4)',
                    },
                  }}
                >
                  Start Skill Check →
                </Button>
                <Button
                  component={Link}
                  href="/login"
                  variant="outlined"
                  size="large"
                  onClick={() => soundFx.playClick()}
                  sx={{
                    px: 3.5,
                    py: 1.5,
                    fontSize: '1rem',
                    fontWeight: 600,
                    borderColor: tokens.color.border,
                    color: tokens.color.textPrimary,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      borderColor: tokens.color.googleBlue,
                      color: tokens.color.googleBlue,
                      transform: 'translateY(-2px)',
                    },
                  }}
                >
                  Sign In to Dashboard
                </Button>
              </Stack>
            </Stack>

            {/* Right Hero Image Card with Clean Overlay */}
            <Paper
              elevation={0}
              sx={{
                position: 'relative',
                width: '100%',
                height: { xs: 320, md: 440 },
                borderRadius: tokens.radius.lg,
                overflow: 'hidden',
                border: 1,
                borderColor: 'divider',
                boxShadow: '0 16px 40px rgba(11, 31, 58, 0.09)',
              }}
            >
              <Image
                src="/hero-learning.jpg"
                alt="Students studying and tracking learning progress"
                fill
                style={{ objectFit: 'cover' }}
                priority
              />
              <Box
                sx={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to top, rgba(17, 26, 43, 0.9) 0%, rgba(17, 26, 43, 0.1) 60%)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                  p: 3.5,
                }}
              >
                <Chip
                  label="Adaptive Learning Engine"
                  size="small"
                  sx={{
                    alignSelf: 'flex-start',
                    bgcolor: 'rgba(255, 255, 255, 0.15)',
                    color: '#FFFFFF',
                    backdropFilter: 'blur(4px)',
                    mb: 1,
                    fontSize: '0.75rem',
                  }}
                />
                <Typography variant="h3" sx={{ color: '#FFFFFF', fontSize: '1.25rem', fontWeight: 600 }}>
                  Interactive Knowledge Map
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.8)', mt: 0.5, lineHeight: 1.5 }}>
                  See your progress visually, understand prerequisite topics, and master complex skills step by step.
                </Typography>
              </Box>
            </Paper>
          </Box>
        </Container>
      </Box>

      {/* ---------------------------------------------------------------- */}
      {/* Mastery Status Section                                           */}
      {/* ---------------------------------------------------------------- */}
      <Section tinted>
        <SectionHeading title="Clear progress you can see at a glance">
          Track your journey with intuitive colors and clear status indicators. Every card shows how well you know a topic and when it is time for a quick refresher.
        </SectionHeading>

        <Box
          sx={{
            display: 'grid',
            gap: 2.5,
            gridTemplateColumns: {
              xs: 'repeat(auto-fit, minmax(200px, 1fr))',
              md: 'repeat(4, 1fr)',
            },
          }}
        >
          {MASTERY_SAMPLES.map((sample) => (
            <Paper
              key={sample.band}
              elevation={0}
              sx={{
                p: 3,
                borderRadius: tokens.radius.lg,
                border: 1,
                borderColor: 'divider',
                display: 'flex',
                flexDirection: 'column',
                gap: 2.5,
                bgcolor: 'background.paper',
                boxShadow: '0 4px 16px rgba(11, 31, 58, 0.04)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                '&:hover': {
                  transform: 'translateY(-3px)',
                  boxShadow: '0 8px 24px rgba(11, 31, 58, 0.08)',
                },
              }}
            >
              <MasteryDots band={sample.band} value={sample.value} height={48} labelled={false} />
              <Box sx={{ mt: 'auto' }}>
                <Typography variant="h4" component="h3" sx={{ fontSize: '1.1rem' }}>
                  {sample.concept}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5, fontWeight: 500 }}>
                  {Math.round(sample.value * 100)}% mastered
                </Typography>
              </Box>
            </Paper>
          ))}
        </Box>
      </Section>

      {/* ---------------------------------------------------------------- */}
      {/* 8-Step Simple Learning Flow                                      */}
      {/* ---------------------------------------------------------------- */}
      <Section id="loop">
        <SectionHeading title="How Adaptiq works for you">
          Every part of the platform works together to help you learn faster and remember longer.
        </SectionHeading>

        <Box
          component="ol"
          sx={{
            listStyle: 'none',
            p: 0,
            m: 0,
            display: 'grid',
            gap: 2.5,
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              lg: 'repeat(4, 1fr)',
            },
          }}
        >
          {LOOP_STEPS.map((step) => (
            <Paper
              key={step.label}
              component="li"
              elevation={0}
              sx={{
                p: 3,
                borderRadius: tokens.radius.lg,
                border: 1,
                borderColor: 'divider',
                display: 'flex',
                flexDirection: 'column',
                gap: 1.5,
                bgcolor: 'background.paper',
                boxShadow: '0 4px 16px rgba(11, 31, 58, 0.03)',
                transition: 'transform 0.2s ease',
                '&:hover': { transform: 'translateY(-2px)' },
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  color: tokens.color.googleBlue,
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  fontFamily: 'monospace',
                }}
              >
                {step.num}
              </Typography>
              <Typography variant="h4" component="h3" sx={{ fontSize: '1.125rem' }}>
                {step.label}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.6 }}>
                {step.detail}
              </Typography>
            </Paper>
          ))}
        </Box>
      </Section>

      {/* ---------------------------------------------------------------- */}
      {/* Conversion Banner                                                */}
      {/* ---------------------------------------------------------------- */}
      <Section tinted>
        <Stack spacing={3} sx={{ maxWidth: PROSE_WIDTH, alignItems: 'flex-start' }}>
          <Typography variant="h2" sx={{ fontSize: { xs: '1.75rem', md: '2.25rem' } }}>
            Start with what you already know.
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary', fontSize: '1.05rem', lineHeight: 1.7 }}>
            Take a quick 5-minute initial skill check to unlock your customized learning path today.
          </Typography>
          <Button
            component={Link}
            href="/register"
            variant="contained"
            size="large"
            onClick={() => soundFx.playClick()}
            sx={{
              px: 4,
              py: 1.5,
              fontWeight: 600,
              bgcolor: tokens.color.googleBlue,
              color: '#FFFFFF',
              transition: 'all 0.2s ease',
              '&:hover': {
                bgcolor: tokens.color.primaryDark,
                transform: 'translateY(-2px)',
              },
            }}
          >
            Create Your Account →
          </Button>
        </Stack>
      </Section>

      {/* Complete Footer */}
      <Footer />
    </Box>
  );
}
