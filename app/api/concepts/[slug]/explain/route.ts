import type { NextRequest } from 'next/server';

import { requireUser } from '@/auth/session';
import { ok, withApi } from '@/lib/api-handler';
import { prisma } from '@/lib/db';
import { NotFoundError } from '@/lib/errors';
import { resolveLlmForUser, isGenerative } from '@/ai/resolve';
import { slugSchema } from '@/validation/diagnostic';
import { z } from 'zod';

const explainRequestSchema = z.object({
  customPrompt: z.string().max(300).optional(),
  lens: z.enum(['ANALOGY', 'FIRST_PRINCIPLES', 'CODE', 'VISUAL']).optional(),
});

/**
 * On-demand Generative AI explanation tailored dynamically to the learner's
 * background and cognitive lens preference.
 */
export const POST = withApi(
  async (request: NextRequest, context: { params: Promise<{ slug: string }> }) => {
    const user = await requireUser();
    const { slug } = await context.params;
    const conceptSlug = slugSchema.parse(slug);

    const body = await request.json().catch(() => ({}));
    const { customPrompt, lens } = explainRequestSchema.parse(body);

    const concept = await prisma.concept.findFirst({
      where: { slug: conceptSlug },
      include: {
        domain: { select: { title: true } },
        contentLenses: true,
      },
    });

    if (!concept) throw NotFoundError('Concept not found.');

    const resolved = await resolveLlmForUser(user.id);
    const targetLens = lens ?? 'ANALOGY';
    const baseExplanation = concept.contentLenses.find((l) => l.lens === targetLens)?.body ?? concept.summary;

    if (isGenerative(resolved) && resolved.backend && resolved.model) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4500);

        const promptStyle =
          targetLens === 'ANALOGY'
            ? 'Explain using a vivid, intuitive real-world analogy.'
            : targetLens === 'CODE'
              ? 'Explain with clear, well-commented code snippets and execution walkthrough.'
              : targetLens === 'VISUAL'
                ? 'Explain using an ASCII diagram / mental model structure step-by-step.'
                : 'Explain from first mathematical principles and rigorous definitions.';

        const response = await resolved.backend.complete(
          {
            system: `You are the expert AI Tutor for Adaptiq (${concept.domain.title}). Your goal is to explain the concept clearly, directly, and engagingly. ${promptStyle}`,
            messages: [
              {
                role: 'user',
                content: `Concept: ${concept.title}\nSummary: ${concept.summary}\nCurated reference:\n${baseExplanation}\n\nLearner request: ${customPrompt || `Provide an interactive ${targetLens} breakdown of this concept.`}`,
              },
            ],
            maxTokens: 500,
            temperature: 0.3,
            model: resolved.model,
          },
          controller.signal,
        );

        clearTimeout(timeoutId);

        if (response.content.trim()) {
          return ok({
            text: response.content.trim(),
            source: 'AI',
            model: resolved.model,
            attribution: resolved.attribution,
            tokensUsed: response.tokensIn + response.tokensOut,
          });
        }
      } catch {
        // Fallback below
      }
    }

    return ok({
      text: baseExplanation,
      source: 'CURATED',
      attribution: 'Curated Curriculum Reference',
      model: null,
      tokensUsed: 0,
    });
  },
);
