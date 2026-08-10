import { NextRequest, NextResponse } from 'next/server';

import { isAdminRequest } from '@/lib/server/rbac';
import { getConfig, saveConfig } from '@/lib/server/store';
import type { ConsentConfig } from '@/lib/consent/types';

/**
 * GET  /api/admin/config - current banner configuration.
 * PUT  /api/admin/config - persist admin customisations (colors, fonts, texts).
 * RBAC: role === 'ADMIN' required.
 */
export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return NextResponse.json(await getConfig());
}

export async function PUT(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const incoming = (await request.json().catch(() => ({}))) as Partial<ConsentConfig>;
  const current = await getConfig();
  const next = saveConfig({
    ...current,
    ...incoming,
    theme: { ...current.theme, ...(incoming.theme ?? {}) },
    typography: { ...current.typography, ...(incoming.typography ?? {}) },
    layout: { ...current.layout, ...(incoming.layout ?? {}) },
    company: { ...current.company, ...(incoming.company ?? {}) },
    links: { ...current.links, ...(incoming.links ?? {}) },
    texts: incoming.texts ?? current.texts,
  });

  return NextResponse.json(await next);
}
