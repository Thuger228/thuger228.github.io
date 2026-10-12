import { useLanguage } from '@/contexts/LanguageContext';
import SEO from '@/components/SEO';
import BookingCTA from '@/components/BookingCTA';
import PageContent, { PageHeader, pageFaqJsonLd } from '@/components/PageContent';
import { pageUrl } from '@/i18n/config';
import { useCopy } from '@/i18n/content';

// New page from the Oct 2026 keyword brief. Prices aren't set yet ("price on request"),
// so the Service schema has no offers; add an Offer with price and priceCurrency 'PLN' once they are.
const Podcast = () => {
  const { language } = useLanguage();
  const page = useCopy().podcast;

  return (
    <div className="min-h-screen pt-16 md:pt-20">
      <SEO
        title={page.title}
        description={page.desc}
        page="podcast"
        jsonLd={[
          {
            '@context': 'https://schema.org',
            '@type': 'Service',
            name: page.h1,
            serviceType: 'Podcast recording studio rental',
            provider: { '@id': 'https://sanctum-sa.com/#localbusiness' },
            areaServed: { '@type': 'City', name: 'Warszawa' },
            url: pageUrl(language, 'podcast'),
          },
          pageFaqJsonLd(page.faq),
        ]}
      />
      <section className="pt-12 md:pt-20">
        <div className="container mx-auto px-6">
          <PageHeader page={page} />
        </div>
      </section>
      <PageContent page={page} />
      <BookingCTA />
    </div>
  );
};

export default Podcast;
