import 'server-only';

import { prisma } from '@/lib/db';
import { loadDecayedStates } from './knowledge-state';

export interface ReviewQueueItem {
  conceptId: string;
  conceptSlug: string;
  title: string;
  summary: string;
  effectiveMastery: number;
  retrievability: number;
  dueAt: Date;
  estimatedMinutes: number;
}

export async function getDueReviews(userId: string): Promise<ReviewQueueItem[]> {
  const dueSchedules = await prisma.reviewSchedule.findMany({
    where: {
      userId,
      dueAt: { lte: new Date() },
    },
    include: {
      concept: {
        select: {
          id: true,
          slug: true,
          title: true,
          summary: true,
          estimatedMinutes: true,
        },
      },
    },
    orderBy: { dueAt: 'asc' },
  });

  if (dueSchedules.length === 0) return [];

  const conceptIds = dueSchedules.map((s) => s.conceptId);
  const knowledge = await loadDecayedStates(userId, conceptIds);

  return dueSchedules.map((s) => {
    const state = knowledge.get(s.conceptId);
    return {
      conceptId: s.concept.id,
      conceptSlug: s.concept.slug,
      title: s.concept.title,
      summary: s.concept.summary,
      effectiveMastery: state?.effectiveMastery ?? 0,
      retrievability: state?.retrievability ?? 0.65,
      dueAt: s.dueAt,
      estimatedMinutes: s.concept.estimatedMinutes,
    };
  });
}
