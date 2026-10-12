import { useLanguage } from '@/contexts/LanguageContext';
import { Music, Drum, Waves, Guitar } from 'lucide-react';
import SEO from '@/components/SEO';
import BookingCTA from '@/components/BookingCTA';
import { pageUrl } from '@/i18n/config';
import PageContent, { PageHeader, pageFaqJsonLd } from '@/components/PageContent';
import { useCopy } from '@/i18n/content';

const Rehearsals = () => {
  const { language, t } = useLanguage();
  const page = useCopy().rehearsals;

  const features = [
    { icon: Guitar, title: t('rehearsals_backline_title'), desc: t('rehearsals_backline_desc') },
    { icon: Waves, title: t('rehearsals_acoustic_title'), desc: t('rehearsals_acoustic_desc') },
    { icon: Music, title: t('rehearsals_booking_title'), desc: t('rehearsals_booking_desc') },
    { icon: Drum, title: t('rehearsals_climate_title'), desc: t('rehearsals_climate_desc') },
  ];

  return (
    <div className="min-h-screen pt-16 md:pt-20">
      <SEO
        title={page.title}
        description={page.desc}
        page="rehearsals"
        jsonLd={[
          {
            '@context': 'https://schema.org',
            '@type': 'Service',
            name: page.h1,
            serviceType: 'Rehearsal room rental',
            provider: { '@id': 'https://sanctum-sa.com/#localbusiness' },
            areaServed: { '@type': 'City', name: 'Warszawa' },
            url: pageUrl(language, 'rehearsals'),
          },
          pageFaqJsonLd(page.faq),
        ]}
      />
      <section className="py-12 md:py-20 bg-gradient-to-b from-background to-card">
        <div className="container mx-auto px-6">
          <PageHeader page={page} />

          <div className="grid gap-6 md:grid-cols-2 md:gap-8 max-w-5xl mx-auto">
            {features.map((feature, index) => (
              <div
                key={index}
                className="p-6 md:p-8 bg-card border border-border rounded-lg hover:border-primary transition-all duration-300 group"
              >
                <feature.icon className="w-10 h-10 md:w-12 md:h-12 mb-3 md:mb-4 text-primary group-hover:scale-110 transition-transform" />
                <h3 className="text-xl md:text-2xl font-bold mb-2 md:mb-3">{feature.title}</h3>
                <p className="text-sm md:text-base text-muted-foreground">{feature.desc}</p>
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

export default Rehearsals;
