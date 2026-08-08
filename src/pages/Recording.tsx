import { useLanguage } from '@/contexts/LanguageContext';
import { Mic2, Headphones, Music2, Radio } from 'lucide-react';
import SEO from '@/components/SEO';

const Recording = () => {
  const { t } = useLanguage();

  const services = [
    { icon: Mic2, titleKey: 'recording_vocal_title', descKey: 'recording_vocal_desc' },
    { icon: Music2, titleKey: 'recording_instrument_title', descKey: 'recording_instrument_desc' },
    { icon: Headphones, titleKey: 'recording_mixing_title', descKey: 'recording_mixing_desc' },
    { icon: Radio, titleKey: 'recording_production_title', descKey: 'recording_production_desc' },
  ];

  return (
    <div className="min-h-screen pt-16 md:pt-20">
      <SEO
        title="Recording Services — Sanctum Sound Warsaw"
        description="Vocal and instrument recording, mixing and mastering at Sanctum Sound — a professional recording studio in Warsaw."
        path="/recording"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Service',
          serviceType: 'Recording, mixing and mastering',
          provider: { '@type': 'LocalBusiness', name: 'Sanctum Sound', telephone: '+48 881 238 684' },
          areaServed: 'Warszawa',
        }}
      />
      <section className="py-12 md:py-20 bg-gradient-to-b from-background to-card">
        <div className="container mx-auto px-6">
          <h1 className="text-3xl md:text-5xl font-bold text-center mb-4 md:mb-6">{t('recording_title')}</h1>
          <p className="text-base md:text-xl text-muted-foreground text-center max-w-3xl mx-auto mb-10 md:mb-16">
            {t('recording_desc')}
          </p>

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
    </div>
  );
};

export default Recording;
