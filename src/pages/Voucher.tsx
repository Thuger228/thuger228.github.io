import { useLanguage } from '@/contexts/LanguageContext';
import SEO from '@/components/SEO';
import BookingCTA from '@/components/BookingCTA';
import VoucherShop from '@/components/VoucherShop';
import PageContent, { PageHeader, pageFaqJsonLd } from '@/components/PageContent';
import { pageUrl } from '@/i18n/config';
import { useCopy } from '@/i18n/content';
import { useVoucherShopCopy } from '@/i18n/content/voucherShop';
import { VOUCHER_TIERS } from '@/data/vouchers';

// Voucher page: SEO copy plus the "buy a voucher" panel (packages paid online, prices set 2026-10-20).
const Voucher = () => {
  const { language } = useLanguage();
  const page = useCopy().voucher;
  const shop = useVoucherShopCopy();

  return (
    <div className="min-h-screen pt-16 md:pt-20">
      <SEO
        title={page.title}
        description={page.desc}
        page="voucher"
        jsonLd={[
          {
            '@context': 'https://schema.org',
            '@type': 'Service',
            name: page.h1,
            serviceType: 'Gift voucher for studio recording',
            provider: { '@id': 'https://sanctum-sa.com/#localbusiness' },
            areaServed: { '@type': 'City', name: 'Warszawa' },
            url: pageUrl(language, 'voucher'),
            offers: VOUCHER_TIERS.filter((t) => t.price !== null).map((t) => ({
              '@type': 'Offer',
              name: `${shop.tiers[t.id].name}: ${shop.tiers[t.id].items}`,
              price: String(t.price),
              priceCurrency: 'PLN',
              availability: 'https://schema.org/InStock',
              url: pageUrl(language, 'voucher'),
            })),
          },
          pageFaqJsonLd(page.faq),
        ]}
      />
      <section className="pt-12 md:pt-20">
        <div className="container mx-auto px-6">
          <PageHeader page={page} />
        </div>
      </section>
      <VoucherShop />
      <PageContent page={page} />
      <BookingCTA />
    </div>
  );
};

export default Voucher;
