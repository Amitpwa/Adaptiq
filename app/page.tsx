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
import { tokens } from '@/ui/tokens';

const PROSE_WIDTH = 640;

const LOOP_STEPS = [
  {
    num: '01',
    label: 'Dynamic IRT Diagnostic',
    detail: 'Five to seven adaptive questions locate the exact boundary of what you know using 2PL Item Response Theory.',
  },
  {
    num: '02',
    label: 'Bayesian Knowledge Tracing',
    detail: 'Tracks concept mastery probability P(M) in real-time, synchronously updating with every attempt.',
  },
  {
    num: '03',
    label: 'Prerequisite Gap Interception',
    detail: 'Unmet prerequisite blockers are identified directly across the DAG, not inferred from a coarse test score.',
  },
  {
    num: '04',
    label: 'Topological Path Generation',
    detail: 'The shortest route to your goal, pruning mastered ground and focusing exclusively on your Zone of Proximal Development.',
  },
  {
    num: '05',
    label: 'Multi-Lens Conceptual Explanations',
    detail: 'Every concept renders in four lenses on demand: Intuitive Analogy, First Principles, Executable Code, and Visual Graphs.',
  },
  {
    num: '06',
    label: '4-Tier Socratic AI Tutoring',
    detail: 'Scaffolded hint ladder (Clarifying question → Concept reminder → Isomorphic example → Walkthrough) that never leaks the answer.',
  },
  {
    num: '07',
    label: 'Ebbinghaus Forgetting Decay',
    detail: 'Mastery decays lazily over time based on memory stability S. Interleaved micro-probes trigger before knowledge is lost.',
  },
  {
    num: '08',
    label: 'Explainable Next Recommendation',
    detail: 'Ranked next action with the exact mathematical rationale clearly surfaced on your dashboard.',
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
                Get Started
              </Button>
            </Stack>
          </Stack>
        </Container>
      </Box>

      {/* ---------------------------------------------------------------- */}
      {/* Hero Section: Technical Positioning + Professional Photo Grid    */}
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
                label="Cognitive Learning Intelligence System (PRD v1.0)"
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
              <Typography
                variant="h1"
                component="h1"
                sx={{
                  fontSize: { xs: '2.5rem', md: '3.4rem' },
                  lineHeight: 1.15,
                  letterSpacing: '-0.02em',
                }}
              >
                Learning engineered around what you actually know.
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
                Traditional courses are designed for everyone and optimised for no one. Adaptiq models your
                evolving knowledge state across a mathematical concept graph — finding the exact boundary of what
                you have and haven&apos;t mastered — and adapts every explanation, question, and Socratic hint to it.
              </Typography>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ pt: 1 }}>
                <Button
                  component={Link}
                  href="/register"
                  variant="contained"
                  size="large"
                  sx={{
                    px: 4,
                    py: 1.5,
                    fontSize: '1rem',
                    fontWeight: 600,
                    bgcolor: tokens.color.primary,
                    boxShadow: '0 4px 16px rgba(26, 95, 208, 0.25)',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: tokens.color.primaryDark,
                      transform: 'translateY(-2px)',
                      boxShadow: '0 6px 20px rgba(26, 95, 208, 0.35)',
                    },
                  }}
                >
                  Calibrate Diagnostic →
                </Button>
                <Button
                  component={Link}
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
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      borderColor: tokens.color.primary,
                      transform: 'translateY(-2px)',
                    },
                  }}
                >
                  Sign In to Dashboard
                </Button>
              </Stack>
            </Stack>

            {/* Right Hero Image Card with Telemetry Overlay */}
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
                alt="Technical engineers analyzing knowledge graph telemetry"
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
                  label="Deterministic Core · Bayesian Tracing"
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
                  Real-Time Cognitive Knowledge Graph
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.8)', mt: 0.5, lineHeight: 1.5 }}>
                  Continuous 2PL Item Response Theory & Bayesian Knowledge Tracing synchronize with every attempt in O(1).
                </Typography>
              </Box>
            </Paper>
          </Box>
        </Container>
      </Box>

      {/* ---------------------------------------------------------------- */}
      {/* Mastery Encoding (Halftone Substrate)                            */}
      {/* ---------------------------------------------------------------- */}
      <Section tinted>
        <SectionHeading title="Mastery you can read at a glance">
          Knowledge is partial and probabilistic, so Adaptiq draws it that way. Halftone dot density carries
          the mastery quantity, ensuring clarity in greyscale, under low contrast, and for colour vision deficiencies.
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
              <MasteryDots band={sample.band} value={sample.value} height={52} />
              <Box sx={{ mt: 'auto' }}>
                <Typography variant="h4" component="h3" sx={{ fontSize: '1.1rem' }}>
                  {sample.concept}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5, fontWeight: 500 }}>
                  {Math.round(sample.value * 100)}% effective mastery
                </Typography>
              </Box>
            </Paper>
          ))}
        </Box>
      </Section>

      {/* ---------------------------------------------------------------- */}
      {/* The 8-Step Adaptive Cognitive Cycle                              */}
      {/* ---------------------------------------------------------------- */}
      <Section id="loop">
        <SectionHeading title="One connected cognitive learning loop">
          Not isolated screens. Every interaction writes synchronously to the next phase, creating a closed-loop system grounded in active retrieval.
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
                  color: tokens.color.primary,
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
            Start with what you know.
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary', fontSize: '1.05rem', lineHeight: 1.7 }}>
            Take the 5-minute Bayesian Computerized Adaptive Diagnostic to localize your exact boundary of competence and unlock your tailored learning path.
          </Typography>
          <Button
            component={Link}
            href="/register"
            variant="contained"
            size="large"
            sx={{
              px: 4,
              py: 1.5,
              fontWeight: 600,
              bgcolor: tokens.color.textPrimary,
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
    </Box>
  );
}
