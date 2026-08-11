import { NextRequest, NextResponse } from 'next/server';

import { signOut } from '@/auth';

/** POST /accounts/logout - sign out and return home (Django LogoutView parity). */
export async function POST(request: NextRequest) {
  await signOut({ redirect: false });
  const url = new URL('/', request.url);
  return NextResponse.redirect(url);
}

/** GET /accounts/logout - also allowed (Django default allows GET+POST). */
export async function GET(request: NextRequest) {
  await signOut({ redirect: false });
  const url = new URL('/', request.url);
  return NextResponse.redirect(url);
}
