'use client';

import { useState } from 'react';

/**
 * FAQ accordion (port of templates/pages/faq.html - the Alpine/vanilla-JS
 * toggle became a React client component).
 */
export interface FaqItem {
  question: string;
  answer: string;
}

export function FaqAccordion({ faqs }: { faqs: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number>(0);

  return (
    <div className="space-y-3">
      {faqs.map((faq, index) => {
        const isOpen = openIndex === index;
        return (
          <div key={faq.question} className="overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-border">
            <h2>
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? -1 : index)}
                aria-expanded={isOpen}
                aria-controls={`faq-${index}`}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-semibold text-foreground transition-colors hover:text-teal"
              >
                <span>{faq.question}</span>
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal/10 text-lg font-bold text-teal"
                  aria-hidden="true"
                >
                  {isOpen ? '-' : '+'}
                </span>
              </button>
            </h2>
            {isOpen && (
              <div id={`faq-${index}`} className="px-5 pb-5 text-sm leading-relaxed text-foreground/70">
                <p>{faq.answer}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
