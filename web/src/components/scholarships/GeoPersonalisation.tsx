'use client';

import { useEffect, useState } from 'react';
import { AFRICAN_COUNTRIES } from '@/lib/geo-countries';

function readCountryLabel(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)sh_country=([^;]+)/);
  if (!match) return null;
  const iso = decodeURIComponent(match[1]).toUpperCase();
  const info = AFRICAN_COUNTRIES[iso];
  return info ? `${info.flag} ${info.name}` : null;
}

export function GeoBadgeText({
  hasStats,
  openNow,
}: {
  hasStats: boolean;
  openNow: number;
}) {
  const [geoLabel, setGeoLabel] = useState<string | null>(null);

  useEffect(() => {
    setGeoLabel(readCountryLabel());
  }, []);

  if (!hasStats) {
    return <>Verified opportunities open now</>;
  }
  if (geoLabel) {
    return <>{openNow} open now · personalised for {geoLabel} students</>;
  }
  return <>{openNow} opportunities open right now</>;
}

export function GeoTopPicksSubtitle() {
  const [geoLabel, setGeoLabel] = useState<string | null>(null);

  useEffect(() => {
    setGeoLabel(readCountryLabel());
  }, []);

  return <>{geoLabel ? `Picked for ${geoLabel} students` : 'Open now · best fit'}</>;
}
