import { NextRequest, NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';

import { users, verificationTokens } from '@/db/schema';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');
  const email = request.nextUrl.searchParams.get('email');

  if (!token || !email) {
    return NextResponse.redirect(new URL('/accounts/login?error=InvalidVerificationLink', request.url));
  }

  try {
    const db = getDb();
    const tokenRecord = await db
      .select()
      .from(verificationTokens)
      .where(and(eq(verificationTokens.identifier, email), eq(verificationTokens.token, token)))
      .limit(1);

    if (tokenRecord.length === 0) {
      return NextResponse.redirect(new URL('/accounts/login?error=InvalidVerificationToken', request.url));
    }

    if (new Date(tokenRecord[0].expires) < new Date()) {
      return NextResponse.redirect(new URL('/accounts/login?error=VerificationTokenExpired', request.url));
    }

    await db
      .update(users)
      .set({ emailVerified: new Date() })
      .where(eq(users.email, email));

    await db
      .delete(verificationTokens)
      .where(and(eq(verificationTokens.identifier, email), eq(verificationTokens.token, token)));

    return NextResponse.redirect(new URL('/accounts/login?verified=true', request.url));
  } catch (err) {
    console.error('Verification failed:', err);
    return NextResponse.redirect(new URL('/accounts/login?error=VerificationFailed', request.url));
  }
}
