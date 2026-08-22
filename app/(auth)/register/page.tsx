import type { Metadata } from 'next';

import { AuthForm } from '@/ui/auth/AuthForm';
import { AuthLayout, AuthSwitchLink } from '@/ui/auth/AuthLayout';

export const metadata: Metadata = {
  title: 'Sign Up · Adaptiq',
  description:
    'Create your Adaptiq account. A short diagnostic maps what you already know, so your first lesson fits you.',
};

export default function RegisterPage() {
  return (
    <AuthLayout
      mode="register"
      title="Sign Up"
      subtitle="You are a step away from something great!"
      footer={<AuthSwitchLink href="/login" prompt="Already have an account?" action="Log in" />}
    >
      <AuthForm mode="register" />
    </AuthLayout>
  );
}
