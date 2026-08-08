import { useLanguage } from '@/contexts/LanguageContext';
import { Check } from 'lucide-react';
import SEO from '@/components/SEO';

const Price = () => {
  const { t } = useLanguage();

  const packages = [
    {
      name: t('price_recording_name'),
      prefix: t('price_from'),
      price: '100 zl',
      unit: '/hour',
      features: [
        t('price_recording_feature1'),
        t('price_recording_feature2'),
        t('price_recording_feature3'),
        t('price_recording_feature4'),
      ],
    },
    {
      name: t('price_rehearsal_name'),
      prefix: t('price_from'),
      price: '50 zl',
      unit: '/hour',
      features: [
        t('price_rehearsal_feature1'),
        t('price_rehearsal_feature2'),
        t('price_rehearsal_feature3'),
        t('price_rehearsal_feature4'),
      ],
    },
    {
      name: t('price_rental_name'),
      prefix: '',
      price: t('price_optional'),
      features: [
        t('price_rental_feature1'),
        t('price_rental_feature2'),
        t('price_rental_feature3'),
        t('price_rental_feature4'),
        t('price_rental_feature5'),
        t('price_rental_feature6'),
      ],
    },
    {
      name: t('price_mixing_name'),
      prefix: t('price_from'),
      price: '200 zl',
      unit: '/song',
      features: [
        t('price_mixing_feature1'),
        t('price_mixing_feature2'),
        t('price_mixing_feature3'),
        t('price_mixing_feature4'),
      ],
    },
  ];

  return (
    <div className="min-h-screen pt-16 md:pt-20">
      <SEO
        title="Pricing — Recording, Rehearsals & Mixing | Sanctum Sound"
        description="Transparent pricing at Sanctum Sound Warsaw: recording from 100 PLN/hour, rehearsals from 50 PLN/hour, mixing from 200 PLN/song."
        path="/price"
      />
      <section className="py-12 md:py-20 bg-gradient-to-b from-background to-card">
        <div className="container mx-auto px-6">
          <h1 className="text-3xl md:text-5xl font-bold text-center mb-4 md:mb-6">{t('price_title')}</h1>
          <p className="text-base md:text-xl text-muted-foreground text-center max-w-3xl mx-auto mb-10 md:mb-16">
            {t('price_subtitle')}
          </p>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 md:gap-8 max-w-7xl mx-auto">
            {packages.map((pkg, index) => (
              <div
                key={index}
                className="p-6 md:p-8 bg-card border border-border rounded-lg hover:border-primary transition-all duration-300 flex flex-col"
              >
                <h3 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">{pkg.name}</h3>
                <div className="mb-4 md:mb-6">
                  <span className="text-xxs md:text-base text-muted-foreground">{pkg.prefix} </span>
                  <span className="text-3xl md:text-4xl font-bold">{pkg.price}</span>
                  <span className="text-sm md:text-base text-muted-foreground">{pkg.unit}</span>
                </div>
                <ul className="space-y-2 md:space-y-3 flex-grow">
                  {pkg.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="w-4 h-4 md:w-5 md:h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-xs md:text-sm text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Price;
