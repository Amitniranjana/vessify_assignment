import { Hono } from 'hono';
import { auth } from '../lib/auth';

export const authRoutes = new Hono();

const getAllowedOrigins = () => [
  'http://127.0.0.1:3000', 'http://127.0.0.1:3001', 'http://127.0.0.1:3002',
  'http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002',
  ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
];

// Handle CORS preflight for all auth routes
authRoutes.options('/*', (c) => {
  const origin = c.req.header('Origin') || '';
  const allowed = getAllowedOrigins().includes(origin) ? origin : '';
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
  const allowed = getAllowedOrigins().includes(origin) ? origin : '';
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
