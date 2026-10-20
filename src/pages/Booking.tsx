import SEO from '@/components/SEO';
import BookingForm from '@/components/BookingForm';
import PageContent, { PageHeader, pageFaqJsonLd } from '@/components/PageContent';
import { useBookingCopy } from '@/i18n/content/booking';
import { useLanguage } from '@/contexts/LanguageContext';
import { pageUrl } from '@/i18n/config';

const Booking = () => {
  const { language } = useLanguage();
  const { page, form } = useBookingCopy();
  const url = pageUrl(language, 'booking');
  const hourPrice = (price: number, description?: string) => ({
    '@type': 'Offer',
    ...(description ? { description } : {}),
    priceCurrency: 'PLN',
    price: String(price),
    priceSpecification: { '@type': 'UnitPriceSpecification', price, priceCurrency: 'PLN', unitCode: 'HUR' },
  });

  // Only the rehearsal room is booked and paid online; recording and mixing are request forms.
  const rehearsalJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: page.h1,
    serviceType: 'Rehearsal room rental',
    provider: { '@id': 'https://sanctum-sa.com/#localbusiness' },
    areaServed: { '@type': 'City', name: 'Warszawa' },
    url,
    hoursAvailable: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      opens: '09:00',
      closes: '23:59',
    },
    offers: [hourPrice(60), hourPrice(50, form.opt_solo)],
    potentialAction: {
      '@type': 'ReserveAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: url,
        inLanguage: language,
        actionPlatform: ['https://schema.org/DesktopWebPlatform', 'https://schema.org/MobileWebPlatform'],
      },
      result: { '@type': 'Reservation', name: page.h1 },
    },
  };

  return (
    <div className="min-h-screen pt-16 md:pt-20">
      <SEO
        title={page.title}
        description={page.desc}
        page="booking"
        jsonLd={[rehearsalJsonLd, pageFaqJsonLd(page.faq)]}
      />
      <section className="pt-12 md:pt-20">
        <div className="container mx-auto px-6">
          <PageHeader page={page} />
          <div className="max-w-3xl mx-auto">
            <BookingForm />
          </div>
        </div>
      </section>
      <PageContent page={page} />
    </div>
  );
};

export default Booking;
