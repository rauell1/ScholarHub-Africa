'use client';

import Link from 'next/link';
import { useState } from 'react';

import { ThemeToggle } from './ThemeToggle';

/**
 * Site header - port of templates/base.html {% block nav %}.
 * Auth-aware links land in Phase 5 (Auth.js); for now the Login link renders.
 */
const NAV_LINKS = [
  { href: '/scholarships/', label: 'Scholarships' },
  { href: '/scholarships/country/', label: 'By Country' },
  { href: '/scholarships/field/', label: 'By Field' },
];

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="glass-header text-foreground">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-lg font-extrabold tracking-tight transition-transform hover:scale-105"
          >
            <span className="text-2xl" aria-hidden="true">🎓</span>
            <span>
              ScholarHub<span className="text-teal"> Africa</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-2 md:flex" aria-label="Main">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-xl px-3 py-2 text-sm font-medium transition-colors hover:bg-foreground/5"
              >
                {link.label}
              </Link>
            ))}
            {/* TODO(Phase 5): session-aware Login / My Tracker / Checklist / Logout */}
            <Link href="/login/" className="btn-primary ml-2">
              Login
            </Link>
            <span className="ml-2">
              <ThemeToggle />
            </span>
          </nav>

          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="rounded-xl p-2 transition-colors hover:bg-foreground/5"
              aria-label="Toggle menu"
              aria-expanded={menuOpen}
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="space-y-1 pb-4 md:hidden">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block rounded-xl px-3 py-2 text-sm font-medium transition-colors hover:bg-foreground/5"
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            {/* TODO(Phase 5): session-aware links */}
            <Link href="/login/" className="btn-primary mt-4 block text-center">
              Login
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
