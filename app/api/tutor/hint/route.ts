import type { NextRequest } from 'next/server';
import { z } from 'zod';

import { requireUser } from '@/auth/session';
import { ok, withApi } from '@/lib/api-handler';
import { getNextSocraticHint } from '@/services/tutor';

const hintRequestSchema = z.object({
  questionId: z.string().min(1),
  currentLevel: z.number().int().min(0).max(4),
});

/** Serve the next tiered Socratic hint with answer-leakage guards & deterministic fallback. */
export const POST = withApi(async (request: NextRequest) => {
  const user = await requireUser();
  const body = await request.json();
  const { questionId, currentLevel } = hintRequestSchema.parse(body);

  const hint = await getNextSocraticHint(user.id, questionId, currentLevel);
  return ok(hint);
});
