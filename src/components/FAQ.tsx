import { ChevronDown } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const FAQ_IDS = [1, 2, 3, 4, 5, 6, 7];

export const useFaqItems = () => {
  const { t } = useLanguage();
  return FAQ_IDS.map((id) => ({ question: t(`faq_q${id}`), answer: t(`faq_a${id}`) }));
};

export const useFaqJsonLd = () => {
  const items = useFaqItems();
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };
};

// Native <details> keeps the answers in the pre-rendered HTML, unlike a JS accordion.
const FAQ = () => {
  const { t } = useLanguage();
  const items = useFaqItems();

  return (
    <section id="faq" className="py-12 md:py-20 bg-gradient-to-b from-card to-background">
      <div className="container mx-auto px-6">
        <h2 className="text-3xl md:text-5xl font-bold text-center mb-10 md:mb-16">{t('faq_title')}</h2>
        <div className="max-w-3xl mx-auto space-y-4">
          {items.map((item, index) => (
            <details key={index} className="group bg-card border border-border rounded-lg p-5 md:p-6 open:border-primary transition-colors">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base md:text-lg font-semibold">
                <h3>{item.question}</h3>
                <ChevronDown className="w-5 h-5 flex-shrink-0 text-primary transition-transform group-open:rotate-180" />
              </summary>
              <p className="mt-4 text-sm md:text-base text-muted-foreground">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQ;
