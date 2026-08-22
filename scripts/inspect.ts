import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL as string }),
});

const user = await prisma.user.findUnique({
  where: { email: 'priya@example.com' },
  include: { profile: true },
});

if (!user) {
  console.log('user not found');
} else {
  console.log('user id       :', user.id);
  console.log('role          :', user.role);
  console.log('hash prefix   :', user.passwordHash.slice(0, 7), '(bcrypt, cost 12)');
  console.log('plaintext?    :', user.passwordHash === 'correct-horse-battery' ? 'YES - LEAK' : 'no');
  console.log('profile stage :', user.profile?.onboardingStage);
  console.log('motion pref   :', user.profile?.motionPreference);
}

console.log('activity rows :', await prisma.activityEvent.count());
const mallory = await prisma.user.findUnique({ where: { email: 'mallory@example.com' } });
console.log('escalation    :', mallory === null ? 'rejected, no row' : 'YES - LEAK');
console.log('rate limits   :', await prisma.rateLimit.count());

await prisma.$disconnect();
