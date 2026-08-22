import { requireUser } from '@/auth/session';
import { ok, withApi } from '@/lib/api-handler';
import { completeDiagnostic } from '@/services/diagnostic';

/**
 * Finalise the diagnostic: extend measured ability across the goal, build the
 * learning path, and generate the first recommendations.
 */
export const POST = withApi(
  async (_request: Request, context: { params: Promise<{ id: string }> }) => {
    const user = await requireUser();
    const { id } = await context.params;
    const result = await completeDiagnostic(user.id, id);
    return ok(result);
  },
);
