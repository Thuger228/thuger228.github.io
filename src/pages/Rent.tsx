import { useLanguage } from '@/contexts/LanguageContext';
import { Speaker, Mic, Cable, Disc } from 'lucide-react';
import SEO from '@/components/SEO';

const Rent = () => {
  const { t } = useLanguage();

  const equipment = [
    { icon: Speaker, title: 'PA Systems', desc: 'Professional sound reinforcement systems' },
    { icon: Mic, title: 'Microphones', desc: 'Premium microphones for any application' },
    { icon: Cable, title: 'Stage Equipment', desc: 'Cables, stands, and stage accessories' },
    { icon: Disc, title: 'Recording Gear', desc: 'Portable recording equipment for field work' },
  ];

  return (
    <div className="min-h-screen pt-16 md:pt-20">
      <SEO
        title="Equipment Rental in Warsaw — Sanctum Sound"
        description="Rent PA systems, premium microphones, stage gear and portable recording equipment from Sanctum Sound studio in Warsaw."
        path="/rent"
      />
      <section className="py-12 md:py-20 bg-gradient-to-b from-background to-card">
        <div className="container mx-auto px-6">
          <h1 className="text-3xl md:text-5xl font-bold text-center mb-4 md:mb-6">{t('rent_title')}</h1>
          <p className="text-base md:text-xl text-muted-foreground text-center max-w-3xl mx-auto mb-10 md:mb-16">
            {t('rent_desc')}
          </p>

          <div className="grid gap-6 md:grid-cols-2 md:gap-8 max-w-5xl mx-auto">
            {equipment.map((item, index) => (
              <div
                key={index}
                className="p-6 md:p-8 bg-card border border-border rounded-lg hover:border-primary transition-all duration-300 group"
              >
                <item.icon className="w-10 h-10 md:w-12 md:h-12 mb-3 md:mb-4 text-primary group-hover:scale-110 transition-transform" />
                <h3 className="text-xl md:text-2xl font-bold mb-2 md:mb-3">{item.title}</h3>
                <p className="text-sm md:text-base text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Rent;
