/**
 * Testimonials section (port of templates/components/testimonials.html).
 */
const TESTIMONIALS = [
  {
    quote:
      "I used to keep deadlines in a notes app. ScholarHub's countdown and digest caught two applications I would definitely have missed.",
    name: 'Joy Mwangi',
    meta: 'MSc applicant · Nairobi, Kenya',
    initials: 'JM',
    avatar: 'avatar--teal',
    stars: 5,
  },
  {
    quote:
      "The fit score is honest. It told me where I was competitive and where I wasn't - that focus got me an interview with the Swedish Institute.",
    name: 'Kwame Osei',
    meta: 'Public policy · Accra, Ghana',
    initials: 'KO',
    avatar: 'avatar--amber',
    stars: 5,
  },
  {
    quote:
      'The 24-item checklist made my documents ready months before the deadline. I just followed it top to bottom.',
    name: 'Amina Traoré',
    meta: 'Water engineering · Bamako, Mali',
    initials: 'AT',
    avatar: 'avatar--sky',
    stars: 4,
  },
];

export function Testimonials() {
  return (
    <section className="bg-white py-12" aria-labelledby="testimonials-title">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <h2 id="testimonials-title" className="section-title text-center">What applicants say</h2>
        <p className="mt-2 text-center text-sm text-navy/60">
          Real words from students who stopped guessing and started tracking.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {TESTIMONIALS.map((testimonial) => (
            <figure key={testimonial.name} className="card flex flex-col gap-3">
              <div
                className="flex gap-1 text-amber"
                aria-label={`Rated ${testimonial.stars} out of 5 stars`}
              >
                {Array.from({ length: 5 }).map((_, index) => (
                  <span key={index} aria-hidden="true">
                    {index < testimonial.stars ? '★' : '☆'}
                  </span>
                ))}
              </div>
              <blockquote className="text-sm leading-relaxed text-navy/70">
                &quot;{testimonial.quote}&quot;
              </blockquote>
              <figcaption className="mt-auto flex items-center gap-3">
                <span className={`avatar ${testimonial.avatar}`} aria-hidden="true">
                  {testimonial.initials}
                </span>
                <div>
                  <div className="text-sm font-bold text-navy">{testimonial.name}</div>
                  <div className="text-xs text-navy/50">{testimonial.meta}</div>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
