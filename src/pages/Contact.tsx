import { useLanguage } from '@/contexts/LanguageContext';
import SEO from '@/components/SEO';
import ContactForm from '@/components/ContactForm';
import ContactDetails from '@/components/ContactDetails';

const Contact = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen pt-16 md:pt-20">
      <SEO
        title={t('seo_contact_title')}
        description={t('seo_contact_desc')}
        page="contact"
      />
      <section className="py-12 md:py-20">
        <div className="container mx-auto px-6">
          <h1 className="text-3xl md:text-5xl font-bold text-center mb-4 md:mb-6">{t('contact_title')}</h1>
          <p className="text-base md:text-xl text-muted-foreground text-center max-w-3xl mx-auto mb-10 md:mb-16">
            {t('contact_subtitle')}
          </p>

          <div className="max-w-3xl mx-auto mb-8 md:mb-12">
            <ContactForm />
          </div>

          <ContactDetails />
        </div>
      </section>
    </div>
  );
};

export default Contact;
