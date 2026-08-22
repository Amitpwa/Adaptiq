'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import KeyIcon from '@mui/icons-material/VpnKey';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { tokens } from '@/ui/tokens';
import { soundFx } from '@/ui/audio/sound';

export interface ProfileData {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  profile: {
    cognitivePreference: 'ANALOGY' | 'FIRST_PRINCIPLES' | 'CODE' | 'VISUAL';
    motionPreference: 'SYSTEM' | 'FULL' | 'REDUCED';
    activeGoal: { title: string; slug: string } | null;
  };
  activeLlm: {
    tier: string;
    attribution: string;
    model: string | null;
    openSource: boolean;
  };
  credentials: Array<{
    id: string;
    provider: string;
    model: string;
    baseUrl: string | null;
    lastTestedAt: string;
    createdAt: string;
  }>;
}

export function ProfileViewComponent({ initialData }: { initialData?: ProfileData }) {
  const queryClient = useQueryClient();

  const { data = initialData } = useQuery<ProfileData>({
    queryKey: ['learner-profile'],
    initialData,
    queryFn: async () => {
      const res = await fetch('/api/profile');
      if (!res.ok) throw new Error('Failed to load profile');
      const payload = await res.json();
      return payload.data ?? payload;
    },
  });

  // State for adding BYOK key
  const [provider, setProvider] = useState<'ANTHROPIC' | 'OPENAI' | 'OPENAI_COMPATIBLE' | 'OLLAMA'>('ANTHROPIC');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('claude-3-5-sonnet-20241022');
  const [baseUrl, setBaseUrl] = useState('');

  // Add Credential Mutation
  const addCredMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          apiKey,
          model,
          ...(baseUrl ? { baseUrl } : {}),
        }),
      });
      if (!res.ok) throw new Error('Failed to save credential');
      return res.json();
    },
    onSuccess: () => {
      soundFx.playSuccess();
      setApiKey('');
      queryClient.invalidateQueries({ queryKey: ['learner-profile'] });
    },
  });

  // Delete Credential Mutation
  const deleteCredMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/profile/credentials/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      return res.json();
    },
    onSuccess: () => {
      soundFx.playClick();
      queryClient.invalidateQueries({ queryKey: ['learner-profile'] });
    },
  });

  if (!data) return null;

  return (
    <Box component="main" id="main-content" sx={{ py: { xs: 4, md: 6 } }}>
      <Container maxWidth="lg">
        <Stack spacing={5}>
          {/* Header */}
          <Stack spacing={1}>
            <Typography variant="h1" sx={{ fontSize: { xs: '2rem', md: '2.5rem' } }}>
              Learner Profile & AI Settings
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: 720 }}>
              Manage your personal cognitive preferences, active curriculum goal, and Bring-Your-Own-Key (BYOK) language model credentials.
            </Typography>
          </Stack>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1.2fr 0.8fr' },
              gap: 4,
              alignItems: 'start',
            }}
          >
            {/* Left Column: Account & Active LLM Status */}
            <Stack spacing={4}>
              {/* Account Card */}
              <Paper sx={{ p: 3.5, borderRadius: tokens.radius.lg, border: 1, borderColor: 'divider' }}>
                <Typography variant="h3" sx={{ mb: 2.5 }}>
                  Account Details
                </Typography>
                <Stack spacing={2}>
                  <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Name:
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {data.user.name}
                    </Typography>
                  </Stack>
                  <Divider />
                  <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Email / ID:
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {data.user.email}
                    </Typography>
                  </Stack>
                  <Divider />
                  <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Active Curriculum Goal:
                    </Typography>
                    <Chip
                      label={data.profile.activeGoal?.title ?? 'Not Selected'}
                      size="small"
                      sx={{ bgcolor: tokens.color.primaryLight, color: tokens.color.googleBlue, fontWeight: 700 }}
                    />
                  </Stack>
                </Stack>
              </Paper>

              {/* Active AI Tier Banner */}
              <Paper
                sx={{
                  p: 3.5,
                  borderRadius: tokens.radius.lg,
                  border: 1.5,
                  borderColor: tokens.color.googleBlue,
                  bgcolor: 'background.paper',
                }}
              >
                <Stack spacing={2}>
                  <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                      <AutoAwesomeIcon sx={{ color: tokens.color.googleBlue, fontSize: 24 }} />
                      <Typography variant="h3" sx={{ fontSize: '1.2rem' }}>
                        Active Language Model Resolution (PRD §4.3)
                      </Typography>
                    </Stack>
                    <Chip
                      label={data.activeLlm.tier.replace('_', ' ')}
                      size="small"
                      sx={{
                        bgcolor: tokens.color.primaryLight,
                        color: tokens.color.googleBlue,
                        fontWeight: 800,
                        fontSize: '0.7rem',
                      }}
                    />
                  </Stack>

                  <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.6 }}>
                    Current active provider: <strong>{data.activeLlm.attribution}</strong>
                    {data.activeLlm.model && ` (Model: ${data.activeLlm.model})`}.
                    {data.activeLlm.openSource && ' (Open Weights Model)'}
                  </Typography>

                  <Box
                    sx={{
                      p: 2,
                      borderRadius: tokens.radius.md,
                      bgcolor: tokens.color.background,
                      border: 1,
                      borderColor: tokens.color.border,
                    }}
                  >
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Priority Order: 1. Learner BYOK Key → 2. Operator Commercial Key → 3. OpenRouter Free Tier → 4. Deterministic Curriculum Ladder.
                    </Typography>
                  </Box>
                </Stack>
              </Paper>

              {/* Saved BYOK Keys */}
              <Paper sx={{ p: 3.5, borderRadius: tokens.radius.lg, border: 1, borderColor: 'divider' }}>
                <Typography variant="h3" sx={{ mb: 2 }}>
                  Connected BYOK Keys
                </Typography>
                {data.credentials.length === 0 ? (
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    No personal API keys connected. Adaptiq will seamlessly use the community free tier or curated deterministic Socratic scaffolding.
                  </Typography>
                ) : (
                  <Stack spacing={2}>
                    {data.credentials.map((cred) => (
                      <Card
                        key={cred.id}
                        variant="outlined"
                        sx={{
                          p: 2,
                          borderRadius: tokens.radius.md,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <Stack spacing={0.5}>
                          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                            <CheckCircleIcon sx={{ color: tokens.color.googleGreen, fontSize: 18 }} />
                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                              {cred.provider} · {cred.model}
                            </Typography>
                          </Stack>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            Encrypted at rest with AES-256-GCM. Added {new Date(cred.createdAt).toLocaleDateString()}.
                          </Typography>
                        </Stack>
                        <Button
                          color="error"
                          size="small"
                          onClick={() => deleteCredMutation.mutate(cred.id)}
                          startIcon={<DeleteIcon />}
                        >
                          Remove
                        </Button>
                      </Card>
                    ))}
                  </Stack>
                )}
              </Paper>
            </Stack>

            {/* Right Column: Connect New Key Form */}
            <Paper sx={{ p: 3.5, borderRadius: tokens.radius.lg, border: 1, borderColor: 'divider' }}>
              <Stack spacing={3}>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  <KeyIcon sx={{ color: tokens.color.googleBlue }} />
                  <Typography variant="h3">Connect Personal Key</Typography>
                </Stack>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Your secret keys never leave the server unencrypted and are used exclusively for your Socratic tutoring requests.
                </Typography>

                <TextField
                  select
                  label="Provider"
                  value={provider}
                  onChange={(e) => {
                    const val = e.target.value as typeof provider;
                    setProvider(val);
                    if (val === 'ANTHROPIC') setModel('claude-3-5-sonnet-20241022');
                    else if (val === 'OPENAI') setModel('gpt-4o');
                    else if (val === 'OLLAMA') setModel('llama3.2');
                  }}
                  fullWidth
                >
                  <MenuItem value="ANTHROPIC">Anthropic (Claude)</MenuItem>
                  <MenuItem value="OPENAI">OpenAI (GPT-4o)</MenuItem>
                  <MenuItem value="OPENAI_COMPATIBLE">OpenAI-Compatible / OpenRouter / Groq</MenuItem>
                  <MenuItem value="OLLAMA">Local Ollama Gateway</MenuItem>
                </TextField>

                <TextField
                  label="Model Identifier"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  fullWidth
                />

                {(provider === 'OPENAI_COMPATIBLE' || provider === 'OLLAMA') && (
                  <TextField
                    label="Custom Base URL"
                    placeholder="https://api.groq.com/openai/v1"
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    fullWidth
                  />
                )}

                <TextField
                  label="API Key Secret"
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-ant-..."
                  fullWidth
                />

                <Button
                  variant="contained"
                  disabled={!apiKey.trim() || !model.trim() || addCredMutation.isPending}
                  onClick={() => addCredMutation.mutate()}
                  sx={{
                    py: 1.5,
                    bgcolor: tokens.color.googleBlue,
                    '&:hover': { bgcolor: tokens.color.primaryDark },
                  }}
                >
                  {addCredMutation.isPending ? 'Encrypting & Verifying…' : 'Save & Encrypt Key →'}
                </Button>
              </Stack>
            </Paper>
          </Box>
        </Stack>
      </Container>
    </Box>
  );
}
