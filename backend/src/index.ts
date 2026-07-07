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
  origin: [
    'http://127.0.0.1:3000', 'http://127.0.0.1:3001', 'http://127.0.0.1:3002',
    'http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'
  ],
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
