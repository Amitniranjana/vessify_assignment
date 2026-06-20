import request from 'supertest';
import app from '../src/index';

// We mock the DB and Auth to run fast, deterministic tests without needing a live PostgreSQL database
jest.mock('../src/lib/auth', () => ({
  auth: {
    handler: jest.fn((req) => new Response(JSON.stringify({ user: { id: 'userA' } }), { status: 200 })),
    api: {
      getSession: jest.fn()
    }
  }
}));

jest.mock('../src/lib/prisma', () => ({
  prisma: {
    member: {
      findFirst: jest.fn()
    },
    transaction: {
      create: jest.fn(),
      findMany: jest.fn()
    }
  }
}));

const authMock = require('../src/lib/auth').auth;
const prismaMock = require('../src/lib/prisma').prisma;

describe('Backend API Tests', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Auth', () => {
    it('1. Register User', async () => {
      const res = await request(app.fetch).post('/api/auth/sign-up/email').send({ email: 'test@test.com', password: 'password', name: 'Test' });
      expect(res.status).toBe(200);
    });

    it('2. Login User', async () => {
      const res = await request(app.fetch).post('/api/auth/sign-in/email').send({ email: 'test@test.com', password: 'password' });
      expect(res.status).toBe(200);
    });

    it('3. Invalid Login', async () => {
      // Override mock to simulate 401
      authMock.handler.mockImplementationOnce(() => new Response(JSON.stringify({ error: 'Invalid credentials' }), { status: 401 }));
      const res = await request(app.fetch).post('/api/auth/sign-in/email').send({ email: 'wrong@test.com', password: 'wrong' });
      expect(res.status).toBe(401);
    });
  });

  describe('Transactions', () => {
    beforeEach(() => {
      authMock.api.getSession.mockResolvedValue({ user: { id: 'userA' }, session: { id: 'sessA' } });
      prismaMock.member.findFirst.mockResolvedValue({ userId: 'userA', organizationId: 'orgA' });
    });

    it('4. Extract Transaction', async () => {
      prismaMock.transaction.create.mockResolvedValue({ id: 'txn1', amount: -420, date: new Date(), organizationId: 'orgA' });
      const res = await request(app.fetch)
        .post('/api/transactions/extract')
        .set('Authorization', 'Bearer dummy_token')
        .send({ text: 'Date: 11 Dec 2025 Description: STARBUCKS Amount: -420.00' });
      
      expect(res.status).toBe(201);
      expect(res.body.data).toBeDefined();
    });

    it('5. Fetch Transactions', async () => {
      prismaMock.transaction.findMany.mockResolvedValue([{ id: 'txn1', amount: -420, organizationId: 'orgA' }]);
      const res = await request(app.fetch)
        .get('/api/transactions?limit=20')
        .set('Authorization', 'Bearer dummy_token');
      
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('6. User Isolation Test', async () => {
      // Simulate User A
      authMock.api.getSession.mockResolvedValueOnce({ user: { id: 'userA' } });
      prismaMock.member.findFirst.mockResolvedValueOnce({ userId: 'userA', organizationId: 'orgA' });
      
      await request(app.fetch).get('/api/transactions').set('Authorization', 'Bearer token_A');
      
      // The DB MUST be queried exactly with orgA
      expect(prismaMock.transaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { organizationId: 'orgA' } })
      );

      // Simulate User B
      authMock.api.getSession.mockResolvedValueOnce({ user: { id: 'userB' } });
      prismaMock.member.findFirst.mockResolvedValueOnce({ userId: 'userB', organizationId: 'orgB' });
      
      await request(app.fetch).get('/api/transactions').set('Authorization', 'Bearer token_B');
      
      // The DB MUST be queried exactly with orgB
      expect(prismaMock.transaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { organizationId: 'orgB' } })
      );
      
      // If user A asks for orgB, they can't, because the middleware strictly sets organizationId to the authenticated user's organization.
    });
  });
});
