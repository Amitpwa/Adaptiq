import Image from 'next/image';
import Link from 'next/link';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { AppButton } from '@/ui/components/AppButton';
import { MasteryDots } from '@/ui/graphics/MasteryDots';
import { tokens } from '@/ui/tokens';

const PROSE_WIDTH = 640;

const LOOP_STEPS = [
  { label: 'Diagnostic', detail: 'Five to seven adaptive questions locate the exact edge of what you know.' },
  { label: 'Knowledge state', detail: 'A Bayesian mastery probability per concept, updated on every answer.' },
  { label: 'Gaps & Misconceptions', detail: 'Unmet prerequisites named directly, not inferred from a coarse test score.' },
  { label: 'Personalised path', detail: 'The shortest topological route to your goal, with mastered ground pruned.' },
  { label: 'Multi-Lens Learning', detail: 'Explanations in the cognitive lens that suits you, then in-flow retrieval probes.' },
  { label: 'Socratic tutoring', detail: 'Four tiered rungs of hints that never hand over the direct answer.' },
  { label: 'Bayesian update', detail: 'Every interaction synchronously updates the mathematical model.' },
  { label: 'Next recommendation', detail: 'Ranked next action, always with the exact rationale shown.' },
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
      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 8 } }}>
        {children}
      </Container>
    </Box>
  );
}

function SectionHeading({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Stack spacing={1.5} sx={{ maxWidth: PROSE_WIDTH, mb: 4 }}>
      <Typography variant="h2" component="h2">
        {title}
      </Typography>
      <Typography variant="body1" sx={{ color: 'text.secondary' }}>
        {children}
      </Typography>
    </Stack>
  );
}

export default function HomePage() {
  return (
    <Box component="main" id="main-content">
      {/* ---------------------------------------------------------------- */}
      {/* Top Navbar with Navigation CTAs                                   */}
      {/* ---------------------------------------------------------------- */}
      <Box
        component="nav"
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
                width={124}
                height={33}
                priority
                style={{ height: 'auto' }}
              />
            </Link>

            <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
              <AppButton
                href="/login"
                variant="outlined"
                size="small"
                sx={{
                  borderColor: tokens.color.border,
                  color: tokens.color.textPrimary,
                  px: 2.5,
                  fontWeight: 600,
                }}
              >
                Log In
              </AppButton>
              <AppButton
                href="/register"
                variant="contained"
                size="small"
                sx={{
                  bgcolor: tokens.color.textPrimary,
                  color: '#FFFFFF',
                  px: 2.5,
                  fontWeight: 600,
                  '&:hover': { bgcolor: tokens.color.primaryDark },
                }}
              >
                Get Started
              </AppButton>
            </Stack>
          </Stack>
        </Container>
      </Box>

      {/* ---------------------------------------------------------------- */}
      {/* Hero Section with Interactive Call to Actions                    */}
      {/* ---------------------------------------------------------------- */}
      <Box component="header">
        <Container maxWidth="lg" sx={{ pt: { xs: 6, md: 9 }, pb: { xs: 6, md: 9 } }}>
          <Stack spacing={4} sx={{ maxWidth: 820 }}>
            <Chip
              label="NextGen Adaptive Learning Intelligence System"
              size="small"
              sx={{
                alignSelf: 'flex-start',
                bgcolor: tokens.color.primaryLight,
                color: tokens.color.primaryDark,
                fontWeight: 700,
                borderRadius: tokens.radius.pill,
                px: 1,
              }}
            />
            <Typography variant="h1" component="h1" sx={{ fontSize: { xs: '2.4rem', md: '3.4rem' }, lineHeight: 1.15 }}>
              Learning built around what you actually know.
            </Typography>
            <Typography
              variant="body1"
              sx={{ fontSize: '1.125rem', color: 'text.secondary', maxWidth: PROSE_WIDTH, lineHeight: 1.7 }}
            >
              Most courses are designed for everyone and optimised for no one. Adaptiq models your
              evolving knowledge state across a concept graph — finding the exact boundary of what
              you have and haven&apos;t mastered — and adapts every explanation, question, and hint
              to it.
            </Typography>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ pt: 1 }}>
              <AppButton
                href="/register"
                variant="contained"
                size="large"
                sx={{
                  px: 4,
                  py: 1.5,
                  fontSize: '1rem',
                  fontWeight: 600,
                  bgcolor: tokens.color.primary,
                  '&:hover': { bgcolor: tokens.color.primaryDark },
                }}
              >
                Start Adaptive Diagnostic →
              </AppButton>
              <AppButton
                href="/login"
                variant="outlined"
                size="large"
                sx={{
                  px: 3.5,
                  py: 1.5,
                  fontSize: '1rem',
                  fontWeight: 600,
                  borderColor: tokens.color.border,
                  color: tokens.color.textPrimary,
                }}
              >
                Sign In to Dashboard
              </AppButton>
            </Stack>
          </Stack>
        </Container>
      </Box>

      {/* ---------------------------------------------------------------- */}
      {/* Mastery encoding                                                 */}
      {/* ---------------------------------------------------------------- */}
      <Section tinted>
        <SectionHeading title="Mastery you can read at a glance">
          Knowledge is partial and probabilistic, so Adaptiq draws it that way. Dot density carries
          the mastery value, which keeps it readable in greyscale, at low contrast, and with any
          form of colour vision deficiency. Colour is the last channel, never the only one.
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
              sx={{
                p: 2.5,
                borderRadius: tokens.radius.lg,
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                transition: 'transform 0.15s ease',
                '&:hover': { transform: 'translateY(-2px)' },
              }}
            >
              <MasteryDots band={sample.band} value={sample.value} />
              <Box sx={{ mt: 'auto' }}>
                <Typography variant="h4" component="h3">
                  {sample.concept}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {Math.round(sample.value * 100)}% mastery
                </Typography>
              </Box>
            </Paper>
          ))}
        </Box>
      </Section>

      {/* ---------------------------------------------------------------- */}
      {/* The adaptive loop                                                */}
      {/* ---------------------------------------------------------------- */}
      <Section id="loop">
        <SectionHeading title="One connected cognitive loop">
          Not a collection of isolated screens. Every interaction writes to the next one, and the whole chain
          runs on your real answers and Bayesian knowledge tracing.
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
              xs: 'repeat(auto-fit, minmax(220px, 1fr))',
              lg: 'repeat(4, 1fr)',
            },
          }}
        >
          {LOOP_STEPS.map((step, index) => (
            <Paper
              key={step.label}
              component="li"
              sx={{
                p: 2.5,
                borderRadius: tokens.radius.lg,
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
              }}
            >
              <Box
                aria-hidden="true"
                sx={{
                  width: 26,
                  height: 26,
                  borderRadius: tokens.radius.pill,
                  bgcolor: tokens.color.primaryLight,
                  color: tokens.color.primaryDark,
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  mb: 0.5,
                }}
              >
                {index + 1}
              </Box>
              <Typography variant="h4" component="h3">
                {step.label}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {step.detail}
              </Typography>
            </Paper>
          ))}
        </Box>
      </Section>

      {/* ---------------------------------------------------------------- */}
      {/* CTA Footer Banner                                                */}
      {/* ---------------------------------------------------------------- */}
      <Section tinted>
        <Stack spacing={3} sx={{ maxWidth: PROSE_WIDTH, alignItems: 'flex-start' }}>
          <Typography variant="h2">
            Ready to experience adaptive learning?
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            Take the 5-minute cold-start diagnostic to calibrate your personal knowledge map and unlock tailored learning paths.
          </Typography>
          <AppButton
            href="/register"
            variant="contained"
            size="large"
            sx={{ px: 4, py: 1.5, fontWeight: 600 }}
          >
            Create Your Free Account →
          </AppButton>
        </Stack>
      </Section>
    </Box>
  );
}
