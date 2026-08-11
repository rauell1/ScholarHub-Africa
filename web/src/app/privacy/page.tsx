import type { Metadata } from 'next';

import { Breadcrumbs } from '@/components/scholarships/Breadcrumbs';
import { site } from '@/lib/site';

/**
 * Privacy Policy (port of templates/pages/privacy.html).
 */
export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'ScholarHub Africa explains how it collects, uses and protects your personal data: emails, names and usage analytics, under GDPR and Kenyan data protection law.',
  alternates: { canonical: '/privacy/' },
};

export default function PrivacyPage() {
  return (
    <>
      <section className="bg-navy py-10 text-white">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <Breadcrumbs items={[{ name: 'Home', href: '/' }]} current="Privacy Policy" />
          <h1 className="mt-4 text-2xl font-extrabold sm:text-3xl">Privacy Policy</h1>
          <p className="mt-2 text-sm text-white/70">Last updated: 10 August 2026 · Applies to {site.domain}</p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="space-y-8 text-sm leading-relaxed text-navy/80">
          <div>
            <h2 className="text-lg font-bold text-navy">1. Who we are</h2>
            <p className="mt-2">
              {site.name} (&quot;we&quot;, &quot;us&quot;) operates the website {site.domain}. We are based in{' '}
              {site.address}. For any privacy question, contact{' '}
              <a className="text-teal underline" href={`mailto:${site.email}`}>{site.email}</a>.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-navy">2. What we collect</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>
                <strong>Email address</strong> - when you contact us, sign up for the weekly digest, or create an account.
              </li>
              <li>
                <strong>Name</strong> - when you contact us or complete your applicant profile.
              </li>
              <li>
                <strong>Usage analytics</strong> - anonymised, aggregated page views and feature usage, used to improve the platform. Analytics are subject to your consent choices.
              </li>
              <li>
                <strong>Consent records</strong> - your cookie-consent choices (stored with an anonymised IP) so we can prove compliance.
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-bold text-navy">3. How we use your data</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>To reply to your messages and provide support (legitimate interest).</li>
              <li>To send the weekly scholarship digest if you subscribe (consent).</li>
              <li>To improve the product through anonymised analytics (legitimate interest).</li>
              <li>To comply with legal obligations and keep records for audits.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-bold text-navy">4. Legal bases (GDPR)</h2>
            <p className="mt-2">
              Where the GDPR applies (EU/EEA/UK visitors), we process personal data on the bases of{' '}
              <strong>consent</strong> (newsletter, analytics cookies), <strong>contract performance</strong>{' '}
              (providing the service you requested) and <strong>legitimate interest</strong> (security, support,
              product improvement). You may withdraw consent at any time - for cookies via the preference panel,
              for emails via the unsubscribe link.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-navy">5. Sharing</h2>
            <p className="mt-2">
              We do <strong>not sell</strong> your personal information. We share data only with service providers
              who help us operate (hosting, email delivery, analytics) under written data-processing agreements,
              and only to the extent necessary.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-navy">6. Retention</h2>
            <p className="mt-2">
              Contact messages are kept for up to 12 months; consent logs for up to 2 years (for compliance audits);
              newsletter subscriptions until you unsubscribe.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-navy">7. Your rights</h2>
            <p className="mt-2">
              Depending on where you live, you may have the right to <strong>access, correct, delete, restrict, or
              port</strong> your data, and to <strong>object</strong> to processing. To exercise any right, email{' '}
              <a className="text-teal underline" href={`mailto:${site.email}`}>{site.email}</a>. We respond within
              30 days. You may also lodge a complaint with your local data protection authority (in Kenya, the
              Office of the Data Protection Commissioner).
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-navy">8. Cookies</h2>
            <p className="mt-2">
              We use only necessary cookies (consent preference, region) by default, plus any analytics you opt
              into. Full details are in our Cookie Policy, and you can change your choices anytime via the shield
              icon.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-navy">9. Children</h2>
            <p className="mt-2">
              The service is not directed at children under 16 and we do not knowingly collect their data.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-navy">10. Changes</h2>
            <p className="mt-2">
              We may update this policy; the current version always lives at this URL with a new date. Material
              changes will be announced on the site.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
