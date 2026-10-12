import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { pagePath } from '@/i18n/config';

// Closing call to action on the service pages: book online, or get in touch through the contact form.
const BookingCTA = () => {
  const { language, t } = useLanguage();
  return (
    <section className="py-12 md:py-16 bg-card border-t border-border">
      <div className="container mx-auto px-6 text-center">
        <h2 className="text-2xl md:text-4xl font-bold mb-3 md:mb-4">{t('cta_title')}</h2>
        <p className="text-base md:text-lg text-muted-foreground mb-6 md:mb-8">{t('cta_text')}</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button asChild size="lg">
            <Link to={pagePath(language, 'booking')}>
              {t('book_button')}
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to={pagePath(language, 'contact')}>{t('nav_contact')}</Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default BookingCTA;
