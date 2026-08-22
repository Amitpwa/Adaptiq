import 'server-only';

import { prisma } from '@/lib/db';
import { encryptSecret } from '@/lib/crypto';
import { requireUser } from '@/auth/session';
import { ok, withApi } from '@/lib/api-handler';
import { addCredentialSchema, updateProfileSchema } from '@/validation/profile';
import { resolveLlm } from '@/ai/resolve';

export const GET = withApi(async () => {
  const user = await requireUser();

  const profile = await prisma.learnerProfile.findUnique({
    where: { userId: user.id },
    include: {
      activeGoal: { select: { title: true, slug: true } },
    },
  });

  const credentials = await prisma.learnerLlmCredential.findMany({
    where: { userId: user.id },
    select: {
      id: true,
      provider: true,
      model: true,
      baseUrl: true,
      lastTestedAt: true,
      lastError: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  const activeLlm = await resolveLlm(user.id);

  return ok({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    profile: {
      cognitivePreference: profile?.cognitivePreference ?? 'ANALOGY',
      motionPreference: profile?.motionPreference ?? 'SYSTEM',
      activeGoal: profile?.activeGoal ?? null,
    },
    activeLlm: {
      tier: activeLlm.tier,
      attribution: activeLlm.attribution,
      model: activeLlm.model,
      openSource: activeLlm.openSource,
    },
    credentials,
  });
});

export const PATCH = withApi(async (request: Request) => {
  const user = await requireUser();
  const body = await request.json();
  const input = updateProfileSchema.parse(body);

  await prisma.user.update({
    where: { id: user.id },
    data: { name: input.name },
  });

  const updatedProfile = await prisma.learnerProfile.update({
    where: { userId: user.id },
    data: {
      cognitivePreference: input.cognitivePreference,
      motionPreference: input.motionPreference,
    },
  });

  return ok(updatedProfile);
});

export const POST = withApi(async (request: Request) => {
  const user = await requireUser();
  const body = await request.json();
  const input = addCredentialSchema.parse(body);

  const encryptedKey = encryptSecret(input.apiKey);

  const cred = await prisma.learnerLlmCredential.create({
    data: {
      userId: user.id,
      provider: input.provider,
      encryptedKey,
      baseUrl: input.baseUrl,
      model: input.model,
      lastTestedAt: new Date(),
    },
    select: {
      id: true,
      provider: true,
      model: true,
      createdAt: true,
    },
  });

  return ok(cred);
});
