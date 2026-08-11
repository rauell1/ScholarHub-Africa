import type { Metadata } from 'next';

import { ContactForm } from '@/components/ContactForm';
import { Breadcrumbs } from '@/components/scholarships/Breadcrumbs';
import { site } from '@/lib/site';

/**
 * Contact (port of templates/pages/contact.html): form + 24h promise +
 * map & directions.
 */
export const metadata: Metadata = {
  title: 'Contact us',
  description:
    'Questions about scholarships, tracking or partnerships? Contact ScholarHub Africa - we reply within 24 hours on weekdays. Find us in Westlands, Nairobi, Kenya.',
  alternates: { canonical: '/contact/' },
};

export default function ContactPage() {
  const mapsQuery = encodeURIComponent(site.address);
  return (
    <>
      <section className="bg-navy py-10 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Breadcrumbs items={[{ name: 'Home', href: '/' }]} current="Contact" />
          <h1 className="mt-4 text-2xl font-extrabold sm:text-3xl">Contact us</h1>
          <p className="mt-2 max-w-2xl text-sm text-white/70">
            Questions, feedback or partnership ideas - we&apos;d love to hear from you.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="card">
            <h2 className="text-lg font-bold text-navy">Send us a message</h2>

            <div className="mt-3 flex items-center gap-3 rounded-xl bg-forest-light px-4 py-3">
              <span className="text-2xl" aria-hidden="true">⏱️</span>
              <div>
                <p className="text-sm font-bold text-forest">We&apos;ll get back to you within 24 hours</p>
                <p className="text-xs text-navy/60">
                  Mon–Fri, 9:00–18:00 EAT. Most questions answered same day.
                </p>
              </div>
            </div>

            <ContactForm />
          </div>

          <div className="card">
            <h2 className="text-lg font-bold text-navy">Find us</h2>
            <address className="mt-2 text-sm not-italic text-navy/70">
              <span className="font-semibold text-navy">{site.name}</span>
              <br />
              {site.address}
              <br />
              <a href={`mailto:${site.email}`} className="text-teal underline">{site.email}</a>
              <br />
              <a href={`tel:${site.phone.replaceAll(' ', '')}`} className="text-teal underline">{site.phone}</a>
            </address>

            <div className="mt-4 overflow-hidden rounded-2xl ring-1 ring-navy/10">
              <iframe
                title={`Map showing ${site.name} office in ${site.address}`}
                src={`https://www.google.com/maps?q=${mapsQuery}&output=embed`}
                width="100%"
                height={280}
                style={{ border: 0 }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>

            <h3 className="mt-5 text-sm font-bold uppercase tracking-wide text-navy">Directions</h3>
            <ul className="mt-2 space-y-2 text-sm text-navy/70">
              <li className="flex gap-2">
                <span aria-hidden="true">🚗</span>
                <span>
                  <strong>By car:</strong> from Nairobi CBD take Waiyaki Way west, turn into Woodvale Grove - we&apos;re the fifth building on the right, free visitor parking.
                </span>
              </li>
              <li className="flex gap-2">
                <span aria-hidden="true">🚌</span>
                <span>
                  <strong>By matatu/bus:</strong> routes 105/106 from the CBD to Westlands terminus, then a 5-minute walk north on Woodvale Grove.
                </span>
              </li>
              <li className="flex gap-2">
                <span aria-hidden="true">🚶</span>
                <span>
                  <strong>Walking:</strong> 10 minutes from Westlands Square - follow the signs to the chiromo side of the mall.
                </span>
              </li>
            </ul>
            <p className="mt-3 text-xs text-navy/50">Hours: {site.hours}. Drop-ins welcome.</p>
          </div>
        </div>
      </section>
    </>
  );
}
