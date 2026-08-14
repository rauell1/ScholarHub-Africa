import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

import { getScholarshipBySlug } from '@/lib/queries';

export const runtime = 'nodejs';
export const revalidate = 3600;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  let detail: Awaited<ReturnType<typeof getScholarshipBySlug>> = null;
  try {
    detail = await getScholarshipBySlug(slug);
  } catch {
    detail = null;
  }

  const name = detail?.name ?? 'Scholarship';
  const shortName = detail?.short_name || name;
  const university = detail?.university ?? '';
  const flag = detail?.country?.flag_emoji ?? '🌍';
  const country = detail?.country?.name ?? 'Africa';
  const score = detail?.score ?? 0;
  const funding = detail?.funding_detail
    ? detail.funding_detail.length > 60
      ? `${detail.funding_detail.slice(0, 59)}…`
      : detail.funding_detail
    : 'Fully funded';

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          background: '#0D1117',
          fontFamily: 'system-ui, sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Teal gradient blob */}
        <div
          style={{
            position: 'absolute',
            top: -120,
            right: -80,
            width: 500,
            height: 500,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(13,148,136,0.3) 0%, transparent 70%)',
          }}
        />

        {/* Brand bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '32px 48px 0',
            gap: 12,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: '#0D9488',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
            }}
          >
            🎓
          </div>
          <span style={{ color: '#9CA3AF', fontSize: 16, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            ScholarHub Africa
          </span>
        </div>

        {/* Main content */}
        <div style={{ display: 'flex', flexDirection: 'column', padding: '40px 48px', flex: 1 }}>
          {/* Country + score row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 100,
                padding: '6px 16px',
                fontSize: 15,
                color: '#E6EDF3',
              }}
            >
              <span style={{ fontSize: 20 }}>{flag}</span>
              <span>{country}</span>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: 'rgba(13,148,136,0.15)',
                border: '1px solid rgba(13,148,136,0.4)',
                borderRadius: 100,
                padding: '6px 16px',
                fontSize: 15,
                color: '#2DD4BF',
                fontWeight: 700,
              }}
            >
              Score {score}/100
            </div>
          </div>

          {/* Scholarship name */}
          <div
            style={{
              fontSize: shortName.length > 40 ? 36 : 48,
              fontWeight: 800,
              color: '#E6EDF3',
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
              maxWidth: 900,
            }}
          >
            {shortName}
          </div>

          {/* University if available */}
          {university && (
            <div style={{ marginTop: 16, fontSize: 20, color: '#9CA3AF' }}>
              {university}
            </div>
          )}

          {/* Funding */}
          <div
            style={{
              marginTop: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 16,
              color: '#6B7280',
            }}
          >
            <span style={{ color: '#0D9488', fontSize: 18 }}>💰</span>
            {funding}
          </div>
        </div>

        {/* Footer bar */}
        <div
          style={{
            padding: '16px 48px',
            borderTop: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ color: '#4B5563', fontSize: 14 }}>Human-verified · Scored for fit</span>
          <span style={{ color: '#0D9488', fontSize: 14, fontWeight: 600 }}>scholarhub.africa</span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}
