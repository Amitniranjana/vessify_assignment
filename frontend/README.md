# Vessify Finance Extractor - Frontend

This is the Next.js 15 App Router frontend for the Vessify Finance Extractor. It uses Auth.js to seamlessly integrate with the Better Auth powered Hono backend.

## Frontend Architecture

- **Next.js 15 App Router**: Server Components are utilized on the root layout and protected dashboard page to check auth before rendering and pre-fetch initial paginated data.
- **Auth.js Integration**: The `Credentials` provider is configured to forward login requests to the Better Auth backend. The backend session token is stashed inside the Auth.js JWT, acting as a secure proxy.
- **Reusable API Client**: All data-fetching routes use `src/lib/api.ts`, which automatically retrieves the backend session token from Auth.js and passes it via the `Authorization: Bearer <token>` header.
- **UI & State**: The application uses `shadcn/ui` and `Tailwind CSS`. Loading states and Toasts (`sonner`) ensure immediate user feedback.

## Setup & Running Commands

1. **Install dependencies**:
```bash
npm install
```

2. **Set Environment Variables**:
Create a `.env.local` file in the root of the `frontend` folder:
```env
NEXT_PUBLIC_API_URL="http://localhost:8080"

# Required by Auth.js to sign JWTs (Generate one via `npx auth secret`)
AUTH_SECRET="your_generated_secret_string"
```

3. **Run the development server**:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Testing Sample Statements

You can paste the following text into the Dashboard extractor to verify the regex/parsing accuracy:

**1. Starbucks (Standard layout):**
```text
Date: 11 Dec 2025
Description: STARBUCKS COFFEE MUMBAI
Amount: -420.00
```

**2. Uber (Messy date layout):**
```text
Uber Ride * Airport Drop
12/11/2025 → ₹1,250.00 debited
```

**3. Amazon (Continuous string):**
```text
txn123 2025-12-10 Amazon.in Order #403 ₹2,999 Dr
```
