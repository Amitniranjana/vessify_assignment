# Vessify — Personal Finance Transaction Extractor

A **multi-tenant, production-ready full-stack application** that extracts and manages personal finance transactions from messy, unstructured bank statement text using a custom Regex parser engine.

## 🌐 Live Demo

| Service | URL |
|---|---|
| 🚀 Frontend (Vercel) | [https://vessify-assignment-o3g7.vercel.app](https://vessify-assignment-o3g7.vercel.app) |
| ⚙️ Backend API (Render) | [https://vessify-assignment-fyk3.onrender.com](https://vessify-assignment-fyk3.onrender.com) |
| 🗄️ Database | Supabase PostgreSQL |

---

## ✨ Features

- **Multi-Tenancy** — Secure data isolation via `Organization` and `Member` tables. User A can never access User B's data.
- **Transaction Parser Engine** — Custom Regex heuristics extract dates, amounts, types (DEBIT/CREDIT), and confidence scores from raw bank statement text.
- **Secure Authentication** — [Better Auth](https://better-auth.com) on the backend + [Auth.js (NextAuth)](https://authjs.dev) on the frontend, bridged via a Bearer token strategy.
- **Cursor-Based Pagination** — Scalable transaction fetching using DB-level cursors.
- **Rate Limiting** — In-memory sliding window rate limiter protecting all backend APIs.
- **Dockerized** — Full Docker Compose support for local deployments.
- **Dynamic CORS** — All Vercel preview and production deployments are automatically allowed.

---

## 🏗️ Architecture & Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui, Auth.js |
| **Backend** | Hono, TypeScript, Better Auth, Node.js |
| **Database** | PostgreSQL (Supabase), Prisma ORM |
| **Deployment** | Vercel (frontend), Render (backend), Supabase (DB) |
| **Testing** | Jest + Supertest |

---

## 🚀 Local Setup

### 1. Clone & Install

```bash
git clone https://github.com/Amitniranjana/vessify_assignment
cd vessify_assignment
```

### 2. Backend Environment

Create `backend/.env`:

```env
# Supabase — Connection Pooler (for runtime queries)
DATABASE_URL="postgresql://user:password@pooler.supabase.com:6543/postgres?pgbouncer=true"

# Supabase — Direct Connection (for migrations)
DIRECT_URL="postgresql://user:password@pooler.supabase.com:5432/postgres"

# Better Auth
BETTER_AUTH_SECRET="your-secret-here"
BETTER_AUTH_URL="http://localhost:8080"

# CORS — set to your frontend URL in production
FRONTEND_URL="http://localhost:3000"

PORT=8080
```

### 3. Frontend Environment

Create `frontend/.env.local`:

```env
# Backend API URL
NEXT_PUBLIC_API_URL="http://localhost:8080"
API_URL="http://localhost:8080"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
AUTH_SECRET="your-nextauth-secret-here"
```

### 4. Database Migration

```bash
cd backend
npx prisma db push
```

### 5. Run Locally

**Backend:**
```bash
cd backend
npm install
npm run dev        # http://localhost:8080
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev        # http://localhost:3000
```

### 6. Docker Compose (Alternative)

```bash
docker-compose up --build
```

Frontend → `http://localhost:3000` | Backend → `http://localhost:8080`

---

## ☁️ Production Deployment

### Render (Backend)

Set these environment variables in **Render → Environment**:

| Key | Value |
|---|---|
| `DATABASE_URL` | Supabase pooled URL (port 6543) |
| `DIRECT_URL` | Supabase direct URL (port 5432) |
| `BETTER_AUTH_SECRET` | Your secret key |
| `BETTER_AUTH_URL` | `https://your-backend.onrender.com` |
| `FRONTEND_URL` | `https://your-frontend.vercel.app` |

**Build Command:** `npm install && npm run build`  
**Start Command:** `npm start`  
**Pre-Deploy Command:** `npx prisma db push`

### Vercel (Frontend)

Set these environment variables in **Vercel → Settings → Environment Variables**:

| Key | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://your-backend.onrender.com` |
| `API_URL` | `https://your-backend.onrender.com` |
| `NEXTAUTH_URL` | `https://your-frontend.vercel.app` |
| `AUTH_SECRET` | Your NextAuth secret |

---

## 📡 API Reference

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/sign-up/email` | Public | Register user + auto-create Organization |
| `POST` | `/api/auth/sign-in/email` | Public | Authenticate and get session token |
| `POST` | `/api/transactions/extract` | Bearer JWT | Parse text and save transactions |
| `GET` | `/api/transactions?limit=20` | Bearer JWT | Fetch paginated transactions |

---

## 🔐 Authentication & Multi-Tenancy

**Better Auth** manages users, sessions, and passwords natively on the Hono backend. On registration, a `databaseHook` automatically provisions an `Organization` for each new user.

The frontend uses **Auth.js** to proxy login requests, encasing the Better Auth `sessionToken` inside its own encrypted JWT. The custom API client automatically unpacks and injects this token as an `Authorization: Bearer` header on all protected requests.

Every backend endpoint is guarded by `authMiddleware` which:
1. Validates the Bearer token via Better Auth
2. Fetches the user's `organizationId` from DB
3. Injects it into the request context

This makes it **architecturally impossible** for User A to access User B's data.

---

## 🧪 Testing

```bash
cd backend
npm run test
```

Covers: Authentication, Transaction Extraction, Pagination, and Multi-tenant User Isolation.
