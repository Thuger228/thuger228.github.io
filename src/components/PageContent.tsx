import { ChevronDown } from 'lucide-react';
import type { FaqItem, PageCopy } from '@/i18n/content/types';
import { useCopy } from '@/i18n/content';

export const pageFaqJsonLd = (faq: FaqItem[]) =>
  faq.length === 0
    ? null
    : {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faq.map((item) => ({
          '@type': 'Question',
          name: item.q,
          acceptedAnswer: { '@type': 'Answer', text: item.a },
        })),
      };

// H1 + intro paragraph at the top of a page.
export const PageHeader = ({ page }: { page: PageCopy }) => (
  <>
    <h1 className="text-3xl md:text-5xl font-bold text-center mb-4 md:mb-6">{page.h1}</h1>
    <p className="text-base md:text-xl text-muted-foreground text-center max-w-3xl mx-auto mb-10 md:mb-16">
      {page.intro}
    </p>
  </>
);

// The page's H2 sections and its own FAQ. Plain HTML so everything is in the pre-rendered page.
const PageContent = ({ page }: { page: PageCopy }) => {
  const copy = useCopy();
  return (
    <section className="py-12 md:py-16">
      <div className="container mx-auto px-6 max-w-3xl">
        {page.sections.map((section, i) => (
          <div key={i} className="mb-10">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">{section.h2}</h2>
            {section.body.map((paragraph, j) => (
              <p key={j} className="text-base md:text-lg text-muted-foreground mb-4">{paragraph}</p>
            ))}
            {section.list && (
              <ul className="list-disc pl-6 space-y-2 text-base md:text-lg text-muted-foreground">
                {section.list.map((item, j) => <li key={j}>{item}</li>)}
              </ul>
            )}
          </div>
        ))}
        {page.faq.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-6">{copy.ui.faq_page_title}</h2>
            <div className="space-y-4">
              {page.faq.map((item, i) => (
                <details key={i} className="group bg-card border border-border rounded-lg p-5 md:p-6 open:border-primary transition-colors">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base md:text-lg font-semibold">
                    <h3>{item.q}</h3>
                    <ChevronDown className="w-5 h-5 flex-shrink-0 text-primary transition-transform group-open:rotate-180" />
                  </summary>
                  <p className="mt-4 text-sm md:text-base text-muted-foreground">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default PageContent;
