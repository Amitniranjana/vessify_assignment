import { Context } from 'hono';
import { prisma } from '../lib/prisma';
import { extractTransactionSchema } from '../utils/zod';
import { parseTransactions } from '../services/transaction.service';

export const extractTransaction = async (c: Context) => {
  const organizationId = c.get('organizationId');
  
  if (!organizationId) {
    return c.json({ error: 'Missing organization context' }, 403);
  }

  const body = await c.req.json();
  const parsed = extractTransactionSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten().fieldErrors }, 400);
  }

  const { text } = parsed.data;
  const extractedArray = parseTransactions(text);

  if (!extractedArray || extractedArray.length === 0) {
    return c.json({ error: 'Could not parse any transactions from provided text' }, 422);
  }

  // Determine type based on amount sign and prepare for bulk insert
  const transactionsData = extractedArray.map(extracted => ({
    date: extracted.date,
    description: extracted.description,
    amount: extracted.amount,
    type: extracted.amount < 0 ? 'DEBIT' : 'CREDIT',
    confidence: extracted.confidence,
    rawText: text.length > 200 ? text.substring(0, 200) + '...' : text, // Keep a snippet to avoid giant DB rows
    organizationId,
  }));

  // Save to DB
  let savedTransactions = [];
  try {
      // @ts-ignore Prisma createManyAndReturn is available in newer versions, if it fails fallback to manual loop or we assume the user has a recent version
      if (prisma.transaction.createManyAndReturn) {
          savedTransactions = await (prisma.transaction as any).createManyAndReturn({
              data: transactionsData,
          });
      } else {
          // Fallback if not available
          for (const tData of transactionsData) {
              const t = await prisma.transaction.create({ data: tData });
              savedTransactions.push(t);
          }
      }
  } catch (error) {
      // Safe fallback
      for (const tData of transactionsData) {
          const t = await prisma.transaction.create({ data: tData });
          savedTransactions.push(t);
      }
  }

  return c.json({ data: savedTransactions }, 201);
};

export const getTransactions = async (c: Context) => {
  const organizationId = c.get('organizationId');
  const cursor = c.req.query('cursor');
  const limit = parseInt(c.req.query('limit') || '20', 10);

  const transactions = await prisma.transaction.findMany({
    take: limit + 1, // take an extra one to check for next page
    where: { organizationId },
    cursor: cursor ? { id: cursor } : undefined,
    skip: cursor ? 1 : 0,
    orderBy: { date: 'desc' },
  });

  let nextCursor: string | undefined = undefined;
  if (transactions.length > limit) {
    const nextItem = transactions.pop();
    nextCursor = nextItem?.id;
  }

  return c.json({
    data: transactions,
    nextCursor,
  });
};

export const deleteAllTransactions = async (c: Context) => {
  const organizationId = c.get('organizationId');
  if (!organizationId) {
    return c.json({ error: 'Missing organization context' }, 403);
  }
  await prisma.transaction.deleteMany({ where: { organizationId } });
  return c.json({ success: true });
};

