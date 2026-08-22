import 'dotenv/config';
import { listGoals } from '../src/repositories/curriculum';
import { prisma } from '../src/lib/db';

try {
  const goals = await listGoals();
  console.log('listGoals OK:', JSON.stringify(goals[0], null, 2));
} catch (e) {
  console.log('listGoals FAILED:', e instanceof Error ? e.message.split('\n')[0] : e);
}
await prisma.$disconnect();
