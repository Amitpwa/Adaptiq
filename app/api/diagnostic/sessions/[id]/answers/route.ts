import type { NextRequest } from 'next/server';

import { requireUser } from '@/auth/session';
import { ok, withApi } from '@/lib/api-handler';
import { ValidationError } from '@/lib/errors';
import { RATE_LIMITS, enforce } from '@/lib/rate-limit';
import { submitDiagnosticAnswer } from '@/services/diagnostic';
import { submitAnswerSchema } from '@/validation/diagnostic';

/** Grade an answer server-side and fold it into the knowledge state. */
export const POST = withApi(
  async (request: NextRequest, context: { params: Promise<{ id: string }> }) => {
    const user = await requireUser();
    await enforce(RATE_LIMITS.ANSWER, user.id);

    const { id } = await context.params;
    const body: unknown = await request.json().catch(() => {
      throw ValidationError('Expected a JSON body.');
    });
    const input = submitAnswerSchema.parse(body);

    const result = await submitDiagnosticAnswer(user.id, id, input.itemId, {
      ...(input.optionId ? { optionId: input.optionId } : {}),
      ...(input.text ? { text: input.text } : {}),
    });
    return ok(result);
  },
);
