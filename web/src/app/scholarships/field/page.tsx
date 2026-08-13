import type { Metadata } from 'next';

import { FieldBrowser } from '@/components/scholarships/FieldBrowser';
import { getFields } from '@/lib/queries';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Scholarships by Field of Study',
  description:
    "Browse fully-funded master's scholarships by field of study — renewable energy, water and sanitation, public health, data science, engineering and more.",
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
      <section className="border-b border-border bg-background py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h1 className="font-display text-3xl font-bold text-foreground sm:text-4xl">
            Scholarships by Field of Study
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Pick your field and find fully-funded master&apos;s opportunities.
          </p>
        </div>
      </section>

      {fields.length === 0 ? (
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <p className="text-sm text-muted-foreground">No fields yet — check back soon.</p>
        </div>
      ) : (
        <FieldBrowser fields={fields} />
      )}
    </>
  );
}
