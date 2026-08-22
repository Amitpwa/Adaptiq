'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import CircularProgress from '@mui/material/CircularProgress';
import FormControlLabel from '@mui/material/FormControlLabel';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { MIN_PASSWORD_LENGTH } from '@/auth/password-policy';
import { tokens } from '@/ui/tokens';

type Mode = 'login' | 'register';

interface FieldErrors {
  name?: string;
  email?: string;
  password?: string;
  terms?: string;
}

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const isRegister = mode === 'register';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function validate(): boolean {
    const errors: FieldErrors = {};
    if (isRegister && name.trim().length === 0) errors.name = 'Enter your name or username.';
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) errors.email = 'Enter a valid email address.';
    if (isRegister && password.length < MIN_PASSWORD_LENGTH) {
      errors.password = `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
    }
    if (!isRegister && password.length === 0) errors.password = 'Enter your password.';
    if (isRegister && !agreedToTerms) errors.terms = 'Please accept the terms of service.';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFormError(null);
    if (!validate()) return;

    setBusy(true);
    try {
      if (isRegister) {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ name: name.trim(), email: email.trim(), password }),
        });

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as {
            error?: { message?: string; details?: Array<{ field: string; message: string }> };
          } | null;

          const details = payload?.error?.details;
          if (Array.isArray(details) && details.length > 0) {
            const mapped: FieldErrors = {};
            for (const detail of details) {
              if (detail.field === 'name' || detail.field === 'email' || detail.field === 'password') {
                mapped[detail.field] = detail.message;
              }
            }
            setFieldErrors(mapped);
          }
          setFormError(payload?.error?.message ?? 'We could not create your account.');
          return;
        }
      }

      const result = await signIn('credentials', {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });

      if (result?.error) {
        setFormError(
          isRegister
            ? 'Your account was created, but sign-in failed. Try signing in.'
            : 'That email and password combination is not right.',
        );
        return;
      }

      router.push('/dashboard');
      router.refresh();
    } catch {
      setFormError('We could not reach the server. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  }

  const passwordHelp = isRegister
    ? `At least ${MIN_PASSWORD_LENGTH} characters.`
    : undefined;

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Stack spacing={2.5}>
        {formError && (
          <Alert severity="error" role="alert" sx={{ borderRadius: tokens.radius.sm }}>
            {formError}
          </Alert>
        )}

        {isRegister && (
          <TextField
            id="name"
            name="name"
            label="Username / Name"
            placeholder="e.g. alex_rivera"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={Boolean(fieldErrors.name)}
            helperText={fieldErrors.name}
            autoComplete="name"
            required
            fullWidth
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: tokens.radius.md,
                transition: 'all 0.15s ease',
              },
            }}
          />
        )}

        <TextField
          id="email"
          name="email"
          type="email"
          label="Email"
          placeholder="learner@adaptiq.ai"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={Boolean(fieldErrors.email)}
          helperText={fieldErrors.email}
          autoComplete="email"
          required
          fullWidth
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: tokens.radius.md,
              transition: 'all 0.15s ease',
            },
          }}
        />

        <TextField
          id="password"
          name="password"
          type="password"
          label="Password"
          placeholder="••••••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={Boolean(fieldErrors.password)}
          helperText={fieldErrors.password ?? passwordHelp}
          autoComplete={isRegister ? 'new-password' : 'current-password'}
          required
          fullWidth
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: tokens.radius.md,
              transition: 'all 0.15s ease',
            },
          }}
        />

        {isRegister && (
          <Stack spacing={0.5}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  size="small"
                  sx={{ color: tokens.color.border }}
                />
              }
              label={
                <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
                  I agree to the{' '}
                  <Typography component="span" sx={{ color: tokens.color.textPrimary, textDecoration: 'underline', fontWeight: 600 }}>
                    terms of service
                  </Typography>
                </Typography>
              }
            />
            {fieldErrors.terms && (
              <Typography variant="caption" sx={{ color: 'error.main', pl: 3.5 }}>
                {fieldErrors.terms}
              </Typography>
            )}
          </Stack>
        )}

        {/* Action Buttons */}
        <Stack direction="row" spacing={2} sx={{ pt: 1 }}>
          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={busy}
            aria-busy={busy}
            startIcon={busy ? <CircularProgress size={16} color="inherit" /> : undefined}
            sx={{
              bgcolor: tokens.color.textPrimary,
              color: '#FFFFFF',
              px: 4,
              py: 1.25,
              borderRadius: tokens.radius.md,
              fontWeight: 600,
              boxShadow: 'none',
              transition: 'all 0.15s ease',
              '&:hover': {
                bgcolor: tokens.color.primaryDark,
                transform: 'translateY(-1px)',
              },
            }}
          >
            {busy
              ? isRegister
                ? 'Creating account…'
                : 'Signing in…'
              : isRegister
                ? 'Sign Up'
                : 'Log In'}
          </Button>

          <Button
            component={Link}
            href={isRegister ? '/login' : '/register'}
            variant="outlined"
            size="large"
            sx={{
              borderColor: tokens.color.border,
              color: tokens.color.textPrimary,
              px: 3,
              py: 1.25,
              borderRadius: tokens.radius.md,
              fontWeight: 600,
              transition: 'all 0.15s ease',
              '&:hover': {
                borderColor: tokens.color.primary,
                transform: 'translateY(-1px)',
              },
            }}
          >
            {isRegister ? 'Log In' : 'Sign Up'}
          </Button>
        </Stack>

        <Typography variant="caption" sx={{ color: 'text.secondary', pt: 1 }}>
          * Every interaction synchronously updates your Bayesian knowledge graph.
        </Typography>
      </Stack>
    </Box>
  );
}
