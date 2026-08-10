import { NextRequest, NextResponse } from 'next/server';

import { anonymizeIp, appendConsentLog } from '@/lib/server/store';
import type { CategoryState, ConsentRegion } from '@/lib/consent/types';

/**
 * POST /api/consent — record a user's consent choice in the compliance log.
 * Public (no auth): this is the end-user banner reporting its state.
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      state?: CategoryState;
      region?: ConsentRegion;
      consentString?: string;
      tcfString?: string;
      version?: number;
      accepted?: boolean;
      language?: string;
    };

    if (!body.state || !body.region) {
      return NextResponse.json({ error: 'state and region are required' }, { status: 400 });
    }

    // Geolocation from edge headers (the middleware also stamped the cookie).
    const country =
      request.headers.get('x-vercel-ip-country') ??
      request.headers.get('cf-ipcountry') ??
      request.headers.get('x-consent-country') ??
      '';

    const rawIp =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      request.headers.get('x-real-ip') ??
      '';

    const entry = {
      id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      anonymizedIp: anonymizeIp(rawIp),
      timestamp: new Date().toISOString(),
      geolocation: {
        country,
        region: body.region,
      },
      consentString: body.consentString ?? '',
      tcfString: body.tcfString ?? '',
      state: body.state,
      accepted: Boolean(body.accepted),
      version: body.version ?? 1,
      language: body.language ?? 'en',
    };

    await appendConsentLog(entry);

    const response = NextResponse.json({ ok: true, id: entry.id });
    // Mirror the consent into a strictly HTTP-only first-party cookie so the
    // server-side record is authoritative (never readable by JS).
    response.cookies.set('sh_consent', JSON.stringify(body.state), {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 365,
      path: '/',
    });
    return response;
  } catch {
    return NextResponse.json({ error: 'invalid payload' }, { status: 400 });
  }
}
