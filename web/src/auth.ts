/**
 * NextAuth (Auth.js v5) configuration - Phase 5 (M6).
 *
 * Decisions (M0): self-hosted Auth.js, multi-user from day one.
 *   - Credentials provider (email + password, bcrypt hashes in users.password)
 *   - Google OAuth provider (upserts the user row via the signIn callback)
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
import { authConfig } from './auth.config';

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;
        let user;
        try {
          const rows = await getDb()
            .select()
            .from(users)
            .where(eq(users.email, parsed.data.email.trim().toLowerCase()))
            .limit(1);
          user = rows[0];
        } catch {
          return null; // DB unavailable — fail closed
        }
        if (!user?.passwordHash) return null;
        const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!valid) return null;
        if (!user.emailVerified) throw new Error('UnverifiedEmail');
        return { id: user.id, email: user.email, name: user.name ?? undefined };
      },
    }),
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
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
            const newId = `user_${crypto.randomUUID()}`;
            await db.insert(users).values({
              id: newId,
              name: user.name ?? null,
              email,
              image: user.image ?? null,
            });
            user.id = newId; // Map NextAuth user.id to our Postgres ID
          } else {
            user.id = existing[0].id; // Map NextAuth user.id to our Postgres ID
          }
        } catch {
          return false;
        }
      }
      return true;
    },
  },
});
