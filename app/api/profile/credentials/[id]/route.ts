import { prisma } from '@/lib/db';
import { requireUser } from '@/auth/session';
import { ok, withApi } from '@/lib/api-handler';

export const DELETE = withApi(async (_request: Request, context: { params: Promise<{ id: string }> }) => {
  const user = await requireUser();
  const { id } = await context.params;

  await prisma.llmCredential.deleteMany({
    where: { id, userId: user.id },
  });

  return ok({ success: true });
});
