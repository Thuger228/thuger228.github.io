import SEO from '@/components/SEO';
import ContactForm from '@/components/ContactForm';
import ContactDetails from '@/components/ContactDetails';
import PageContent, { PageHeader, pageFaqJsonLd } from '@/components/PageContent';
import { useCopy } from '@/i18n/content';

const Contact = () => {
  const copy = useCopy();
  const page = copy.contact;

  return (
    <div className="min-h-screen pt-16 md:pt-20">
      <SEO
        title={page.title}
        description={page.desc}
        page="contact"
        jsonLd={[pageFaqJsonLd(page.faq)]}
      />
      <section className="py-12 md:py-20">
        <div className="container mx-auto px-6">
          <PageHeader page={page} />

          <div className="max-w-3xl mx-auto mb-8 md:mb-12">
            <ContactForm />
          </div>

          <ContactDetails />
          <p className="text-center mt-6">
            <a
              href="https://www.google.com/maps/dir/?api=1&destination=Aleja+Stan%C3%B3w+Zjednoczonych+67%2C+03-770+Warszawa"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-4"
            >
              {copy.ui.directions_link}
            </a>
          </p>
        </div>
      </section>
      <PageContent page={page} />
    </div>
  );
};

export default Contact;
