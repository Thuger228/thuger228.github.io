import { useLanguage } from '@/contexts/LanguageContext';
import { Mic2, Headphones, Music2, Radio } from 'lucide-react';
import SEO from '@/components/SEO';
import BookingCTA from '@/components/BookingCTA';
import { pageUrl } from '@/i18n/config';
import PageContent, { PageHeader, pageFaqJsonLd } from '@/components/PageContent';
import { useCopy } from '@/i18n/content';

const Recording = () => {
  const { language, t } = useLanguage();
  const page = useCopy().recording;

  const services = [
    { icon: Mic2, titleKey: 'recording_vocal_title', descKey: 'recording_vocal_desc' },
    { icon: Music2, titleKey: 'recording_instrument_title', descKey: 'recording_instrument_desc' },
    { icon: Headphones, titleKey: 'recording_mixing_title', descKey: 'recording_mixing_desc' },
    { icon: Radio, titleKey: 'recording_production_title', descKey: 'recording_production_desc' },
  ];

  return (
    <div className="min-h-screen pt-16 md:pt-20">
      <SEO
        title={page.title}
        description={page.desc}
        page="recording"
        jsonLd={[
          {
            '@context': 'https://schema.org',
            '@type': 'Service',
            name: page.h1,
            serviceType: 'Recording, mixing and mastering',
            provider: { '@id': 'https://sanctum-sa.com/#localbusiness' },
            areaServed: { '@type': 'City', name: 'Warszawa' },
            url: pageUrl(language, 'recording'),
          },
          pageFaqJsonLd(page.faq),
        ]}
      />
      <section className="py-12 md:py-20 bg-gradient-to-b from-background to-card">
        <div className="container mx-auto px-6">
          <PageHeader page={page} />

          <div className="grid gap-6 md:grid-cols-2 md:gap-8 max-w-5xl mx-auto">
            {services.map((service, index) => (
              <div
                key={index}
                className="p-6 md:p-8 bg-card border border-border rounded-lg hover:border-primary transition-all duration-300 group"
              >
                <service.icon className="w-10 h-10 md:w-12 md:h-12 mb-3 md:mb-4 text-primary group-hover:scale-110 transition-transform" />
                <h3 className="text-xl md:text-2xl font-bold mb-2 md:mb-3">{t(service.titleKey)}</h3>
                <p className="text-sm md:text-base text-muted-foreground">{t(service.descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <PageContent page={page} />
      <BookingCTA />
    </div>
  );
};

export default Recording;
