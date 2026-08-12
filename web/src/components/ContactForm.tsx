'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

/**
 * Contact form (port of templates/pages/contact.html). Posts to /api/contact
 * (honeypot + server validation + rate limit) and redirects to the thank-you
 * page like Django's contact view.
 */
const HEAR_ABOUT_CHOICES = [
  ['', 'How did you hear about us? (optional)'],
  ['google', 'Google search'],
  ['ai_assistant', 'ChatGPT / Claude / Perplexity / other AI assistant'],
  ['social', 'Social media (X, LinkedIn, Instagram…)'],
  ['whatsapp', 'WhatsApp'],
  ['friend', 'Friend or family'],
  ['other', 'Other'],
] as const;

export function ContactForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setBusy(true);
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        router.push(`/thank-you/?name=${encodeURIComponent(String(data.name ?? ''))}`);
      } else {
        setError('Please check your details and try again.');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="mt-5 space-y-4" noValidate>
      {/* Honeypot - invisible to humans, catches bots (Security 3.1) */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="website">Leave this field empty</label>
        <input type="text" id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      {error && (
        <div className="rounded-xl bg-crimson-light px-4 py-3 text-sm text-crimson" role="alert">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="mb-1 block text-sm font-semibold text-foreground">Your name</label>
          <input type="text" id="name" name="name" maxLength={120} required className="input" placeholder="e.g. Achieng Otieno" />
        </div>
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-semibold text-foreground">Email</label>
          <input type="email" id="email" name="email" maxLength={254} required className="input" placeholder="you@example.com" />
        </div>
      </div>
      <div>
        <label htmlFor="subject" className="mb-1 block text-sm font-semibold text-foreground">Subject</label>
        <input type="text" id="subject" name="subject" maxLength={200} className="input" placeholder="What's this about?" />
      </div>
      <div>
        <label htmlFor="hear_about" className="mb-1 block text-sm font-semibold text-foreground">
          How did you hear about us?
        </label>
        <select id="hear_about" name="hear_about" className="input">
          {HEAR_ABOUT_CHOICES.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-muted-foreground">
          Helps us understand where students find ScholarHub - including AI assistants.
        </p>
      </div>
      <div>
        <label htmlFor="message" className="mb-1 block text-sm font-semibold text-foreground">Message</label>
        <textarea id="message" name="message" rows={5} required maxLength={4000} className="input" placeholder="Write your message…" />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          We only use your details to reply. See our{' '}
          <Link href="/privacy/" className="text-teal underline">Privacy Policy</Link>.
        </p>
        <button type="submit" disabled={busy} className="btn-primary">
          {busy ? 'Sending…' : 'Send message →'}
        </button>
      </div>
    </form>
  );
}
