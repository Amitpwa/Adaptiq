import { requireUser } from '@/auth/session';
import { ok, withApi } from '@/lib/api-handler';
import { nextDiagnosticItem } from '@/services/diagnostic';

/** Serve the next adaptive item, or report that the diagnostic is finished. */
export const GET = withApi(
  async (_request: Request, context: { params: Promise<{ id: string }> }) => {
    const user = await requireUser();
    const { id } = await context.params;

    // Ownership is enforced inside the service by including userId in the
    // query predicate, so a guessed session id resolves to nothing.
    const result = await nextDiagnosticItem(user.id, id);
    return ok(result);
  },
);
