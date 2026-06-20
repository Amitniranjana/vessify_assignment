import { Context, Next } from 'hono';

// Simple in-memory store for rate limiting
// Key: IP Address or User ID -> Value: { count: number, resetTime: number }
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// 100 requests per 15 minutes window
const WINDOW_MS = 15 * 60 * 1000; 
const MAX_REQUESTS = 100;

export const rateLimiter = async (c: Context, next: Next) => {
  // Try to rate limit by user ID first, fallback to IP address
  const identifier = c.get('userId') || c.req.header('x-forwarded-for') || 'anonymous';
  const now = Date.now();

  let record = rateLimitStore.get(identifier);

  if (!record || record.resetTime < now) {
    // New window
    record = { count: 0, resetTime: now + WINDOW_MS };
  }

  record.count++;
  rateLimitStore.set(identifier, record);

  // Set rate limit headers (Standard practice)
  c.header('X-RateLimit-Limit', MAX_REQUESTS.toString());
  c.header('X-RateLimit-Remaining', Math.max(0, MAX_REQUESTS - record.count).toString());

  if (record.count > MAX_REQUESTS) {
    return c.json({ error: 'Too many requests, please try again later.' }, 429);
  }

  await next();
};
