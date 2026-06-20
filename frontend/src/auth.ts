import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/auth/sign-in/email`, {
            method: 'POST',
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password
            }),
            headers: { 
              "Content-Type": "application/json",
              "Origin": process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
            }
          });

          const data = await res.json();
          
          // Use token from response body if available, fallback to cookie parsing
          let sessionToken = data?.token || '';
          if (!sessionToken) {
              const cookies = res.headers.get('set-cookie');
              if (cookies) {
                  const match = cookies.match(/better-auth\.session_token=([^;]+)/);
                  if (match) {
                      sessionToken = match[1];
                  }
              }
          }
          
          if (res.ok && data.user && sessionToken) {
            return {
              id: data.user.id,
              name: data.user.name,
              email: data.user.email,
              sessionToken: sessionToken
            };
          } else {
            console.error("Better Auth Login Failed:", data);
            return null;
          }
          
          return null;
        } catch (e) {
          console.error(e);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // user object is only passed in the first time during sign-in
        token.id = user.id;
        token.sessionToken = (user as any).sessionToken;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      // Attach the better-auth token to the session so the client can use it for API calls
      (session as any).sessionToken = token.sessionToken;
      return session;
    }
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: "jwt" // Ensure JWT strategy is used to hold the custom token
  }
})
