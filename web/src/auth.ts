/**
 * NextAuth (Auth.js v5) configuration - Phase 5 (M6).
 *
 * Decisions (M0): self-hosted Auth.js, multi-user from day one.
 *   - Credentials provider (email + password, bcrypt hashes in users.password)
 *   - Google OAuth provider (upserts the user row via the signIn callback -
 *     no adapter needed because sessions use the JWT strategy, which keeps
 *     the edge middleware DB-free)
 *   - JWT sessions (edge-safe middleware gate for /tracker/*)
 */
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

import { users } from '@/db/schema';
import { getDb } from '@/lib/db';

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: 'jwt' },
  pages: { signIn: '/accounts/login' },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;
        try {
          const rows = await getDb()
            .select()
            .from(users)
            .where(eq(users.email, parsed.data.email.trim().toLowerCase()))
            .limit(1);
          const user = rows[0];
          if (!user?.passwordHash) return null;
          const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
          if (!valid) return null;
          return { id: user.id, email: user.email, name: user.name ?? undefined };
        } catch {
          return null; // DB unavailable - fail closed (never grant)
        }
      },
    }),
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google' && user.email) {
        try {
          const db = getDb();
          const email = user.email.toLowerCase();
          const existing = await db
            .select({ id: users.id })
            .from(users)
            .where(eq(users.email, email))
            .limit(1);
          if (existing.length === 0) {
            await db.insert(users).values({
              id: `user_${crypto.randomUUID()}`,
              name: user.name ?? null,
              email,
              image: user.image ?? null,
            });
          }
        } catch {
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
