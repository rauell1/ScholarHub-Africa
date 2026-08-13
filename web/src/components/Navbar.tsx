'use client';

import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import { useState } from 'react';

const NAV_LINKS = [
  { href: '/scholarships/', label: 'Scholarships' },
  { href: '/scholarships/country/', label: 'By Country' },
  { href: '/scholarships/field/', label: 'By Field' },
];

function LockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
    </svg>
  );
}

export function Navbar() {
  const { data: session, status } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const isAuthenticated = status === 'authenticated';
  const isAdmin = isAuthenticated && session?.user?.email === 'royokola3@gmail.com';

  const logout = () => {
    void signOut({ callbackUrl: '/' });
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 px-3 py-3 backdrop-blur-md transition-all duration-500 md:px-6">
      <div className="mx-auto flex h-12 w-full max-w-7xl items-center justify-between px-2 sm:px-4">

        {/* Logo */}
        <Link href="/" className="group flex items-center gap-2 tracking-tight">
          <span className="text-2xl transition-transform group-hover:scale-105" aria-hidden="true">🎓</span>
          <span>
            <span className="font-display text-lg font-semibold">ScholarHub</span>
            <span className="hidden font-mono text-[10px] uppercase tracking-widest text-muted-foreground sm:inline ml-1 opacity-70">
              / Africa
            </span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground transition-all duration-200 hover:bg-muted/60 hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}

          {isAuthenticated ? (
            <div className="ml-3 flex items-center gap-1.5 border-l border-border pl-3">
              <Link
                href="/tracker/"
                className="rounded-full px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground transition-all duration-200 hover:bg-muted/60 hover:text-foreground"
              >
                Tracker
              </Link>
              {isAdmin && (
                <Link
                  href="/admin/"
                  aria-label="Admin dashboard"
                  className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition-all duration-200 hover:bg-muted/60 hover:text-foreground"
                >
                  <LockIcon className="h-4 w-4" />
                </Link>
              )}
              <button
                type="button"
                onClick={logout}
                className="btn-outline h-8 px-3 text-xs"
              >
                Log out
              </button>
            </div>
          ) : (
            <Link href="/accounts/login/" className="ml-3 btn-primary h-8 px-4 text-xs">
              Log in
            </Link>
          )}
        </nav>

        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className="grid h-8 w-8 place-items-center rounded-full border border-border bg-card transition-all hover:bg-muted active:scale-95 md:hidden"
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            {menuOpen
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            }
          </svg>
        </button>
      </div>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="mx-auto mt-2 max-w-7xl space-y-1 border-t border-border/50 px-4 pb-4 pt-4 md:hidden">
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
                My Tracker
              </Link>
              {isAdmin && (
                <Link
                  href="/admin/"
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
                  onClick={() => setMenuOpen(false)}
                >
                  <LockIcon className="h-4 w-4" />
                  Admin dashboard
                </Link>
              )}
              <button
                type="button"
                onClick={logout}
                className="btn-outline mt-3 block w-full text-center"
              >
                Log out
              </button>
            </>
          ) : (
            <Link
              href="/accounts/login/"
              className="btn-primary mt-3 block text-center w-full"
              onClick={() => setMenuOpen(false)}
            >
              Log in
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
