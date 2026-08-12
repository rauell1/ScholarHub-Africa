'use client';

import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import { useState } from 'react';

import { ThemeToggle } from './ThemeToggle';

/**
 * Site header - port of templates/base.html {% block nav %}, now
 * session-aware (Phase 5): authenticated users see My Tracker / Checklist /
 * Logout instead of Login.
 */
const NAV_LINKS = [
  { href: '/scholarships/', label: 'Scholarships' },
  { href: '/scholarships/country/', label: 'By Country' },
  { href: '/scholarships/field/', label: 'By Field' },
];

export function Navbar() {
  const { status } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const isAuthenticated = status === 'authenticated';

  const logout = () => {
    void signOut({ callbackUrl: '/' });
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 px-3 py-3 backdrop-blur-md transition-all duration-500 md:px-6">
      <div className="mx-auto flex h-12 w-full max-w-7xl items-center justify-between px-2 sm:px-4">
        <Link
          href="/"
          className="group flex items-center gap-2 tracking-tight"
        >
          <span className="text-2xl transition-transform group-hover:scale-105" aria-hidden="true">🎓</span>
          <span>
            <span className="font-display text-lg font-semibold">ScholarHub</span>
            <span className="hidden font-mono text-[10px] uppercase tracking-widest text-muted-foreground sm:inline ml-1 opacity-70">
              / Africa
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1.5 md:flex" aria-label="Main">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="relative rounded-full px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground transition-all duration-300 hover:bg-muted/50 hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
          {isAuthenticated ? (
            <>
              <Link
                href="/tracker/"
                className="relative rounded-full px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground transition-all duration-300 hover:bg-muted/50 hover:text-foreground"
              >
                Tracker
              </Link>
              <Link
                href="/tracker/checklist/"
                className="relative rounded-full px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground transition-all duration-300 hover:bg-muted/50 hover:text-foreground"
              >
                Checklist
              </Link>
              <button type="button" onClick={logout} className="ml-2 btn-outline text-xs h-8 px-3 rounded-full">
                Logout
              </button>
            </>
          ) : (
            <Link href="/accounts/login/" className="ml-2 btn-primary text-xs h-8 px-4 rounded-full">
              Login
            </Link>
          )}
          <span className="ml-2 flex items-center border-l border-border pl-4">
            <ThemeToggle />
          </span>
        </nav>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="grid h-8 w-8 place-items-center rounded-full border border-border bg-card transition-all hover:bg-muted active:scale-95"
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

        {menuOpen && (
          <div className="mx-auto max-w-7xl px-4 pb-4 md:hidden mt-2 border-t border-border/50 pt-4 space-y-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            {isAuthenticated ? (
              <>
                <Link
                  href="/tracker/"
                  className="block rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
                  onClick={() => setMenuOpen(false)}
                >
                  Tracker
                </Link>
                <Link
                  href="/tracker/checklist/"
                  className="block rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
                  onClick={() => setMenuOpen(false)}
                >
                  Checklist
                </Link>
                <button type="button" onClick={logout} className="btn-outline mt-4 block w-full text-center">
                  Logout
                </button>
              </>
            ) : (
              <Link href="/accounts/login/" className="btn-primary mt-4 block text-center w-full">
                Login
              </Link>
            )}
          </div>
        )}
    </header>
  );
}
