import { getSession, signOut } from "next-auth/react";

export const fetchAPI = async (endpoint: string, options: RequestInit = {}) => {
  const session = await getSession();
  
  // Extract the Better Auth sessionToken that we stashed in our NextAuth session
  const token = (session as any)?.sessionToken;

  const headers = new Headers(options.headers || {});
  
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  // To talk properly with the BetterAuth backend we need to pass the Bearer
  // However, BetterAuth might also expect cookies. 
  // By passing Authorization: Bearer {token}, Better Auth explicitly handles it.

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8080'}${endpoint}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    // Sign out to clear the stale NextAuth JWT before redirecting.
    // Without this, the user gets caught in an infinite loop:
    // /login -> auth() detects valid NextAuth session -> redirect to / -> 401 again.
    await signOut({ redirect: false });
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    throw new Error("Unauthorized");
  }

  return res.json();
};
