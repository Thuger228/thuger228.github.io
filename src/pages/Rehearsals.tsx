import { useLanguage } from '@/contexts/LanguageContext';
import { Music, Drum, Waves, Guitar } from 'lucide-react';
import SEO from '@/components/SEO';

const Rehearsals = () => {
  const { t } = useLanguage();

  const features = [
    { icon: Guitar, title: 'Full Backline', desc: 'Amplifiers, drums, and PA system included' },
    { icon: Waves, title: 'Acoustic Treatment', desc: 'Professionally treated rooms for optimal sound' },
    { icon: Music, title: 'Flexible Booking', desc: 'Hourly, daily, or monthly rental options' },
    { icon: Drum, title: 'Climate Control', desc: 'Perfect temperature and humidity for instruments' },
  ];

  return (
    <div className="min-h-screen pt-16 md:pt-20">
      <SEO
        title="Rehearsal Rooms in Warsaw — Sanctum Sound"
        description="Acoustically treated rehearsal rooms in Warsaw with full backline, PA system and flexible hourly, daily or monthly booking."
        path="/rehearsals"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Service',
          serviceType: 'Rehearsal room rental',
          provider: { '@type': 'LocalBusiness', name: 'Sanctum Sound', telephone: '+48 881 238 684' },
          areaServed: 'Warszawa',
        }}
      />
      <section className="py-12 md:py-20 bg-gradient-to-b from-background to-card">
        <div className="container mx-auto px-6">
          <h1 className="text-3xl md:text-5xl font-bold text-center mb-4 md:mb-6">{t('rehearsals_title')}</h1>
          <p className="text-base md:text-xl text-muted-foreground text-center max-w-3xl mx-auto mb-10 md:mb-16">
            {t('rehearsals_desc')}
          </p>

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
    </div>
  );
};

export default Rehearsals;
