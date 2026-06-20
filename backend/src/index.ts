import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

import { authRoutes } from './routes/auth.routes';
import { transactionRoutes } from './routes/transaction.routes';
import { errorMiddleware } from './middleware/error.middleware';
import { rateLimiter } from './middleware/rateLimit.middleware';

const app = new Hono();

// Global Middlewares
app.use('*', logger());
app.use('*', rateLimiter);
app.use('*', cors({
  origin: 'http://localhost:3000', // Assuming frontend on 3000
  credentials: true,
}));
app.use('*', errorMiddleware);

// Routes
app.route('/api/auth', authRoutes);
app.route('/api/transactions', transactionRoutes);

app.get('/', (c) => c.text('API is running!'));

const port = process.env.PORT ? parseInt(process.env.PORT) : 8080;
console.log(`Server is running on port ${port}`);

serve({
  fetch: app.fetch,
  port
});

export default app; // For testing
