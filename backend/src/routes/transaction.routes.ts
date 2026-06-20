import { Hono } from 'hono';
import { extractTransaction, getTransactions } from '../controllers/transaction.controller';
import { authMiddleware } from '../middleware/auth.middleware';

export const transactionRoutes = new Hono();

transactionRoutes.use('/*', authMiddleware);
transactionRoutes.post('/extract', extractTransaction);
transactionRoutes.get('/', getTransactions);
