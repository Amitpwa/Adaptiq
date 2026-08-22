import 'server-only';

import { prisma } from '@/lib/db';
import { NotFoundError } from '@/lib/errors';
import { resolveLlmForUser, isGenerative } from '@/ai/resolve';

export interface SocraticHintResponse {
  hintLevel: number;
  body: string;
  source: 'AI' | 'FALLBACK';
  attribution?: string;
  isFinalLevel: boolean;
}

export async function getNextSocraticHint(
  userId: string,
  questionId: string,
  currentLevel: number,
): Promise<SocraticHintResponse> {
  const targetLevel = Math.min(4, Math.max(1, currentLevel + 1));

  // Load deterministic hints for question
  const question = await prisma.question.findUnique({
    where: { id: questionId },
    include: {
      hints: {
        where: { level: targetLevel },
      },
    },
  });

  if (!question) {
    throw NotFoundError('Question not found.');
  }

  const fallbackHint = question.hints[0];
  const fallbackBody = fallbackHint?.body ?? 'Reflect on the core definition of the concept and examine how the inputs affect the outcome.';

  const resolved = await resolveLlmForUser(userId);

  // If generative AI is active, invoke LLM backend
  if (isGenerative(resolved) && resolved.backend && resolved.model) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const response = await resolved.backend.complete(
        {
          system: `You are the Socratic Tutor for Adaptiq. CRITICAL RULE: NEVER provide the direct answer to the question. Guide the learner Socratically. Provide a concise, helpful hint calibrated to Level ${targetLevel} of 4 (Level 1: Clarifying question, Level 2: Conceptual reminder, Level 3: Isomorphic example, Level 4: Worked walkthrough + new challenge).`,
          messages: [
            {
              role: 'user',
              content: `Question: ${question.stem}\nCanonical Answer: ${question.canonicalAnswer ?? 'N/A'}\nCurated baseline hint: ${fallbackBody}\nGenerate Socratic Hint:`,
            },
          ],
          maxTokens: 250,
          temperature: 0.2,
          model: resolved.model,
        },
        controller.signal,
      );

      clearTimeout(timeoutId);

      if (response.content.trim()) {
        return {
          hintLevel: targetLevel,
          body: response.content.trim(),
          source: 'AI',
          attribution: resolved.attribution,
          isFinalLevel: targetLevel >= 4,
        };
      }
    } catch {
      // Fall through to deterministic fallback
    }
  }

  return {
    hintLevel: targetLevel,
    body: fallbackBody,
    source: 'FALLBACK',
    attribution: 'Curated Scaffolding',
    isFinalLevel: targetLevel >= 4,
  };
}
