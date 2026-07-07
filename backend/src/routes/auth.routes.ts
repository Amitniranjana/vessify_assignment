import { Hono } from 'hono';
import { auth } from '../lib/auth';

export const authRoutes = new Hono();

const isAllowedOrigin = (origin: string): boolean => {
  if (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) return true;
  if (origin.endsWith('.vercel.app') || origin === 'https://vercel.app') return true;
  if (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL) return true;
  return false;
};

// Handle CORS preflight for all auth routes
authRoutes.options('/*', (c) => {
  const origin = c.req.header('Origin') || '';
  const allowed = isAllowedOrigin(origin) ? origin : '';
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': allowed,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Cookie',
      'Access-Control-Allow-Credentials': 'true',
    },
  });
});

// Forward all auth requests to Better Auth handler, then inject CORS headers
authRoutes.on(['POST', 'GET'], '/*', async (c) => {
  const origin = c.req.header('Origin') || '';
  const allowed = isAllowedOrigin(origin) ? origin : '';
  const response = await auth.handler(c.req.raw);
  // Clone with CORS headers added
  const newHeaders = new Headers(response.headers);
  if (allowed) {
    newHeaders.set('Access-Control-Allow-Origin', allowed);
    newHeaders.set('Access-Control-Allow-Credentials', 'true');
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
});
