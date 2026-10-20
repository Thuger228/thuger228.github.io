import { useLanguage } from '@/contexts/LanguageContext';
import SEO from '@/components/SEO';
import BookingCTA from '@/components/BookingCTA';
import VoucherShop from '@/components/VoucherShop';
import PageContent, { PageHeader, pageFaqJsonLd } from '@/components/PageContent';
import { SITE_URL, pageUrl } from '@/i18n/config';
import { useCopy } from '@/i18n/content';
import { useVoucherShopCopy } from '@/i18n/content/voucherShop';
import { GIFT_MAX, GIFT_MIN, VOUCHER_TIERS } from '@/data/vouchers';

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
          },
          // Each voucher as a Product with its own Offer, so search engines can show the price.
          {
            '@context': 'https://schema.org',
            '@graph': VOUCHER_TIERS.map((t) => ({
              '@type': 'Product',
              '@id': `${pageUrl(language, 'voucher')}#${t.id}`,
              name: `Voucher ${shop.tiers[t.id].name} - Sanctum Sound`,
              description: shop.tiers[t.id].items,
              image: `${SITE_URL}/og-image.jpg`,
              brand: { '@type': 'Brand', name: 'Sanctum Sound' },
              category: 'Gift card',
              url: pageUrl(language, 'voucher'),
              offers: {
                '@type': 'Offer',
                priceCurrency: 'PLN',
                ...(t.price !== null
                  ? { price: String(t.price) }
                  : {
                      price: String(GIFT_MIN),
                      priceSpecification: {
                        '@type': 'PriceSpecification',
                        priceCurrency: 'PLN',
                        minPrice: GIFT_MIN,
                        maxPrice: GIFT_MAX,
                      },
                    }),
                availability: 'https://schema.org/InStock',
                url: pageUrl(language, 'voucher'),
                seller: { '@id': 'https://sanctum-sa.com/#localbusiness' },
              },
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
