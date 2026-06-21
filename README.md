# Vessify Personal Finance Extractor

A multi-tenant, production-ready full-stack application built to extract and manage personal finance transactions from messy bank statements. 

## Live Demo
🚀 **Frontend (Vercel):** [https://vessify-assignment-o3g7.vercel.app/](https://vessify-assignment-o3g7.vercel.app/)
⚙️ **Backend API (Render):** [https://vessify-assignment-fyk3.onrender.com](https://vessify-assignment-fyk3.onrender.com)
🗄️ **Database:** Supabase PostgreSQL

## Features
- **Multi-Tenancy:** Secure data isolation using PostgreSQL `Organization` and `Member` tables.
- **Transaction Parser Engine:** Automatically extracts dates, amounts, and calculates confidence scores from unstructured bank statements using Regex heuristics.
- **Secure Authentication:** Better Auth on the backend coupled with Auth.js (NextAuth) on the frontend.
- **Cursor-Based Pagination:** Highly scalable transaction fetching for large personal finance datasets.
- **Rate Limiting:** In-memory sliding window rate limiter to protect backend APIs.
- **Dockerized:** Full Docker Compose support for easy local deployments.

## Architecture & Tech Stack
![Architecture Outline](https://via.placeholder.com/800x400?text=Architecture+Diagram+Placeholder)

- **Frontend:** Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui, Auth.js.
- **Backend:** Hono, TypeScript, Better Auth.
- **Database:** PostgreSQL, Prisma ORM.
- **Testing:** Jest + Supertest.

## Setup Instructions

### 1. Environment Variables
Create `.env` files in both the `backend/` and `frontend/` directories.

**`backend/.env`**
```env
DATABASE_URL="postgresql://user:password@localhost:5432/finance_extractor?schema=public"
BETTER_AUTH_SECRET="your_backend_secret"
PORT=8080
```

**`frontend/.env.local`**
```env
NEXT_PUBLIC_API_URL="http://localhost:8080"
AUTH_SECRET="your_nextauth_secret"
```

### 2. Database Migration
Make sure your PostgreSQL instance is running.
```bash
cd backend
npx prisma db push
```

### 3. Run Commands
**Run Backend:**
```bash
cd backend
npm install
npm run dev
```

**Run Frontend:**
```bash
cd frontend
npm install
npm run dev
```

### 4. Run via Docker Compose
If you have Docker installed, simply run from the root directory:
```bash
docker-compose up --build
```
The frontend will be available at `http://localhost:3000` and the backend at `http://localhost:8080`.

## API Documentation

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/sign-up/email` | Public | Registers a user and creates an Organization. |
| POST | `/api/auth/sign-in/email` | Public | Authenticates and returns a session token. |
| POST | `/api/transactions/extract` | JWT | Parses text and saves transaction. |
| GET | `/api/transactions?limit=20` | JWT | Fetches paginated transactions. |

## Multi-Tenancy & Authentication Approach
We use **Better Auth** to manage users, sessions, and passwords natively on our Hono edge-compatible backend. When a user registers, a `databaseHook` provisions an `Organization`. 

The frontend uses **Auth.js** to proxy the login request, encasing the Better Auth `sessionToken` inside its own encrypted JWT. Our custom API client automatically unpacks this token and injects it as an `Authorization: Bearer` header on protected requests.

Every backend endpoint is guarded by a custom `authMiddleware` which securely extracts the `organizationId` from the DB and forces it into the request context. This makes it impossible for `User A` to query `User B`'s data, strictly enforcing multi-tenancy.

## Testing
To run the backend test suite (covering Auth, Extractions, Pagination, and User Isolation):
```bash
cd backend
npm run test
```
