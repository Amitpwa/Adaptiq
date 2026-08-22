import type { NextRequest } from 'next/server';

import { requireUser } from '@/auth/session';
import { created, ok, withApi } from '@/lib/api-handler';
import { ValidationError } from '@/lib/errors';
import { startDiagnostic } from '@/services/diagnostic';
import { startDiagnosticSchema } from '@/validation/diagnostic';

/** Start (or resume) the adaptive diagnostic for a goal. */
export const POST = withApi(async (request: NextRequest) => {
  const user = await requireUser();

  const body: unknown = await request.json().catch(() => {
    throw ValidationError('Expected a JSON body.');
  });
  const { goalSlug } = startDiagnosticSchema.parse(body);

  const result = await startDiagnostic(user.id, goalSlug);
  const payload = {
    sessionId: result.sessionId,
    goalSlug: result.goal.goalSlug,
    goalTitle: result.goal.goalTitle,
    conceptCount: result.goal.concepts.length,
  };

  // Resuming is not creation, so it does not report 201.
  return result.resumed ? ok(payload) : created(payload);
});
