import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { pagePath } from '@/i18n/config';

// Closing call to action on the service pages, linking to the on-site contact form.
const BookingCTA = () => {
  const { language, t } = useLanguage();
  return (
    <section className="py-12 md:py-16 bg-card border-t border-border">
      <div className="container mx-auto px-6 text-center">
        <h2 className="text-2xl md:text-4xl font-bold mb-3 md:mb-4">{t('cta_title')}</h2>
        <p className="text-base md:text-lg text-muted-foreground mb-6 md:mb-8">{t('cta_text')}</p>
        <Button asChild size="lg">
          <Link to={pagePath(language, 'contact')}>
            {t('nav_contact')}
            <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
        </Button>
      </div>
    </section>
  );
};

export default BookingCTA;
