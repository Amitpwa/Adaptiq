import { Metadata } from 'next';

import { ProfileViewComponent } from '@/ui/profile/ProfileViewComponent';

export const metadata: Metadata = {
  title: 'Profile & AI Model Settings · Adaptiq',
  description: 'Manage personal cognitive preferences, active goals, and encrypted BYOK language model keys.',
};

export default function ProfilePage() {
  return <ProfileViewComponent />;
}
