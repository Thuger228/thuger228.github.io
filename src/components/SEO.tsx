import { Helmet } from 'react-helmet-async';
import { useLanguage } from '@/contexts/LanguageContext';
import { DEFAULT_LANGUAGE, LANGUAGES, OG_LOCALES, PageSlug, SITE_URL, pageUrl } from '@/i18n/config';

interface SEOProps {
  title: string;
  description: string;
  page: PageSlug;
  jsonLd?: object | object[];
  noindex?: boolean;
}

const OG_IMAGE = `${SITE_URL}/og-image.jpg`;

const SEO = ({ title, description, page, jsonLd, noindex }: SEOProps) => {
  const { language } = useLanguage();
  const url = pageUrl(language, page);
  const ldArray = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];
  return (
    <Helmet>
      <html lang={language} />
      <title>{title}</title>
      <meta name="description" content={description} />
      {noindex && <meta name="robots" content="noindex" />}
      {!noindex && <link rel="canonical" href={url} />}
      {!noindex &&
        LANGUAGES.map((lang) => (
          <link key={lang} rel="alternate" hrefLang={lang} href={pageUrl(lang, page)} />
        ))}
      {!noindex && <link rel="alternate" hrefLang="x-default" href={pageUrl(DEFAULT_LANGUAGE, page)} />}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="Sanctum Sound" />
      <meta property="og:locale" content={OG_LOCALES[language]} />
      <meta property="og:image" content={OG_IMAGE} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content="Sanctum Sound" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={OG_IMAGE} />
      {ldArray.map((ld, i) => (
        <script key={i} type="application/ld+json">{JSON.stringify(ld)}</script>
      ))}
    </Helmet>
  );
};

export default SEO;
