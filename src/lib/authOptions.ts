import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";

// Minimal dashboard authentication so leads/drafts are scoped to a real
// sales rep. This uses a lightweight "email only" credentials provider —
// swap for Google Workspace SSO or your existing IdP in production.
export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: "Email",
      credentials: {
        email: { label: "Work email", type: "email" },
        name: { label: "Name", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;

        const user = await prisma.user.upsert({
          where: { email: credentials.email.toLowerCase() },
          update: {},
          create: {
            email: credentials.email.toLowerCase(),
            name: credentials.name || credentials.email.split("@")[0],
          },
        });

        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.userId = (user as { id: string }).id;
      return token;
    },
    async session({ session, token }) {
      if (session.user) (session.user as { id?: string }).id = token.userId as string;
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};
