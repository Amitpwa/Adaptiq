import type { NextRequest } from 'next/server';

import { requireUser } from '@/auth/session';
import { ok, withApi } from '@/lib/api-handler';
import { getConceptStudioData, submitConceptMicroProbe } from '@/services/concept';
import { slugSchema, submitAnswerSchema } from '@/validation/diagnostic';

/** Retrieve multi-lens explanations, telemetry, and micro-probes for a concept. */
export const GET = withApi(
  async (request: NextRequest, context: { params: Promise<{ slug: string }> }) => {
    const user = await requireUser();
    const { slug } = await context.params;
    const conceptSlug = slugSchema.parse(slug);
    const lens = request.nextUrl.searchParams.get('lens') as 'ANALOGY' | 'FIRST_PRINCIPLES' | 'CODE' | 'VISUAL' | null;

    const data = await getConceptStudioData(user.id, conceptSlug, lens ?? undefined);
    return ok(data);
  },
);

/** Submit an in-flow micro-assessment for immediate Bayesian mastery update. */
export const POST = withApi(
  async (request: NextRequest, context: { params: Promise<{ slug: string }> }) => {
    const user = await requireUser();
    const { slug } = await context.params;
    const conceptSlug = slugSchema.parse(slug);

    const body = await request.json();
    const input = submitAnswerSchema.parse(body);
    const concept = await getConceptStudioData(user.id, conceptSlug);

    const result = await submitConceptMicroProbe(user.id, concept.conceptId, input.itemId, {
      ...(input.optionId ? { optionId: input.optionId } : {}),
      ...(input.text ? { text: input.text } : {}),
    });

    return ok(result);
  },
);
