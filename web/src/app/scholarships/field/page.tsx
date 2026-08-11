import type { Metadata } from 'next';

import { getFields } from '@/lib/queries';

/**
 * Scholarships by field of study (port of templates/scholarships/by_field.html).
 * Ordered by scholarship count descending (Django by_field parity).
 */
export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Scholarships by Field',
  description:
    'Browse fully-funded master\'s scholarships by field of study - renewable energy, water and sanitation, public health, data and AI, engineering and more.',
  alternates: { canonical: '/scholarships/field/' },
};

export default async function ByFieldPage() {
  let fields: Awaited<ReturnType<typeof getFields>> = [];
  try {
    fields = (await getFields()).sort((a, b) => b.scholarship_count - a.scholarship_count);
  } catch {
    fields = [];
  }

  return (
    <>
      <section className="bg-navy py-10 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h1 className="text-2xl font-extrabold sm:text-3xl">📚 Scholarships by Field of Study</h1>
          <p className="mt-1 text-sm text-white/60">Pick your field and find fully-funded master&apos;s opportunities.</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        {fields.length === 0 ? (
          <p className="text-sm text-navy/50">No fields yet - check back soon.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {fields.map((field) => (
              <a
                key={field.slug}
                id={field.slug}
                href={`/scholarships/?field=${field.slug}`}
                className="card flex flex-col items-center gap-1.5 py-5 text-center transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <span className="text-3xl" aria-hidden="true">{field.icon || '📘'}</span>
                <span className="text-sm font-semibold text-navy">{field.name}</span>
                <span className="badge bg-teal-light text-teal">
                  {field.scholarship_count} scholarship{field.scholarship_count === 1 ? '' : 's'}
                </span>
              </a>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
