import SEO from '@/components/SEO';
import ContactDetails, { OpenNowBadge, STUDIO } from '@/components/ContactDetails';
import PageContent, { pageFaqJsonLd } from '@/components/PageContent';
import { useLanguage } from '@/contexts/LanguageContext';
import { pageUrl } from '@/i18n/config';
import { useCopy } from '@/i18n/content';
import { useContactCopy } from '@/i18n/content/contact';
import studioLounge from '@/assets/gallery/studio-lounge.webp';

const Contact = () => {
  const { language } = useLanguage();
  const copy = useCopy();
  const c = useContactCopy();
  const page = copy.contact;

  const contactPageJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: page.title,
    description: page.desc,
    url: pageUrl(language, 'contact'),
    inLanguage: language,
    about: { '@id': 'https://sanctum-sa.com/#localbusiness' },
    mainEntity: {
      '@type': 'LocalBusiness',
      '@id': 'https://sanctum-sa.com/#localbusiness',
      name: 'Sanctum Sound',
      telephone: STUDIO.phone,
      email: STUDIO.email,
    },
  };

  return (
    <div className="min-h-screen pt-16 md:pt-20">
      <SEO
        title={page.title}
        description={page.desc}
        page="contact"
        jsonLd={[contactPageJsonLd, pageFaqJsonLd(page.faq)]}
      />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${studioLounge})` }}
          aria-hidden="true"
        ></div>
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/85 to-background" aria-hidden="true"></div>
        <div className="container relative mx-auto px-6 pt-14 pb-10 md:pt-24 md:pb-16 text-center">
          <p className="text-xs md:text-sm uppercase tracking-[0.25em] text-muted-foreground mb-4 animate-fade-in">{c.eyebrow}</p>
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-5 md:mb-6 max-w-4xl mx-auto animate-fade-in">{page.h1}</h1>
          <p className="text-base md:text-xl text-muted-foreground max-w-3xl mx-auto mb-6 md:mb-8 animate-fade-in">{page.intro}</p>
          <OpenNowBadge />
        </div>
      </section>

      <section className="pb-12 md:pb-20">
        <div className="container mx-auto px-4 md:px-6">
          <ContactDetails />
        </div>
      </section>

      <PageContent page={page} />
    </div>
  );
};

export default Contact;
