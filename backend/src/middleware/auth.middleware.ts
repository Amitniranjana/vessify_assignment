import { Context, Next } from 'hono';
import { auth } from '../lib/auth';
import { prisma } from '../lib/prisma';

export const authMiddleware = async (c: Context, next: Next) => {
  console.log("Authorization header:", c.req.raw.headers.get("Authorization"));
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });
  console.log("Better Auth Session:", session);

  if (!session) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  // Get the member record to find the user's organization
  const member = await prisma.member.findFirst({
    where: { userId: session.user.id },
  });

  if (!member) {
    return c.json({ error: 'No organization access' }, 403);
  }

  // Set the context variables for downstream handlers
  c.set('userId', session.user.id);
  c.set('organizationId', member.organizationId);

  await next();
};
