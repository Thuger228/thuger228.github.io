import { useLanguage } from '@/contexts/LanguageContext';
import { Check } from 'lucide-react';
import SEO from '@/components/SEO';
import BookingCTA from '@/components/BookingCTA';
import { usePricePackages } from '@/data/prices';

const Price = () => {
  const { t } = useLanguage();
  const packages = usePricePackages();

  return (
    <div className="min-h-screen pt-16 md:pt-20">
      <SEO
        title={t('seo_price_title')}
        description={t('seo_price_desc')}
        page="price"
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
                <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">{pkg.name}</h2>
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
      <BookingCTA />
    </div>
  );
};

export default Price;
