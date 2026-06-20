import { Hono } from 'hono';
import { auth } from '../lib/auth';

export const authRoutes = new Hono();

// Forward all auth requests to Better Auth handler
authRoutes.on(['POST', 'GET'], '/*', (c) => {
  return auth.handler(c.req.raw);
});
