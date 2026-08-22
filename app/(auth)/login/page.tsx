import type { Metadata } from 'next';

import { AuthForm } from '@/ui/auth/AuthForm';
import { AuthLayout, AuthSwitchLink } from '@/ui/auth/AuthLayout';

export const metadata: Metadata = {
  title: 'Sign in · Adaptiq',
  description: 'Sign in to Adaptiq and pick up your knowledge map where you left it.',
};

export default function LoginPage() {
  return (
    <AuthLayout
      mode="login"
      title="Log In"
      subtitle="You are a step away from personalized mastery!"
      footer={<AuthSwitchLink href="/register" prompt="Don't have an account yet?" action="Sign Up" />}
    >
      <AuthForm mode="login" />
    </AuthLayout>
  );
}
