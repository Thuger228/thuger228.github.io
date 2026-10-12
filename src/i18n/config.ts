// Site-wide language and URL configuration.
// Polish lives at the root (/), other languages under their own prefix (/en/, /uk/, /be/, /ru/),
// so every language has its own indexable URL.

export const SITE_URL = 'https://sanctum-sa.com';

export const LANGUAGES = ['pl', 'en', 'uk', 'be', 'ru'] as const;
export type Language = (typeof LANGUAGES)[number];
export const DEFAULT_LANGUAGE: Language = 'pl';

export const LANGUAGE_LABELS: Record<Language, string> = {
  pl: 'PL',
  en: 'EN',
  uk: 'UA',
  be: 'BY',
  ru: 'RU',
};

export const OG_LOCALES: Record<Language, string> = {
  pl: 'pl_PL',
  en: 'en_US',
  uk: 'uk_UA',
  be: 'be_BY',
  ru: 'ru_RU',
};

// '' is the home page
export const PAGES = ['', 'recording', 'rehearsals', 'rent', 'price', 'contact', 'voucher', 'booking'] as const;
export type PageSlug = (typeof PAGES)[number];

export const langPrefix = (lang: Language) => (lang === DEFAULT_LANGUAGE ? '' : `/${lang}`);

// Paths always end with a slash so they match the pre-rendered folder/index.html on GitHub Pages.
export const pagePath = (lang: Language, slug: PageSlug = '') =>
  `${langPrefix(lang)}/${slug ? `${slug}/` : ''}`;

export const pageUrl = (lang: Language, slug: PageSlug = '') => `${SITE_URL}${pagePath(lang, slug)}`;

export const languageFromPath = (pathname: string): Language => {
  const first = pathname.split('/')[1];
  return (LANGUAGES as readonly string[]).includes(first) && first !== DEFAULT_LANGUAGE
    ? (first as Language)
    : DEFAULT_LANGUAGE;
};

export const slugFromPath = (pathname: string): PageSlug => {
  const parts = pathname.split('/').filter(Boolean);
  if (parts[0] && (LANGUAGES as readonly string[]).includes(parts[0])) parts.shift();
  const slug = parts[0] ?? '';
  return (PAGES as readonly string[]).includes(slug) ? (slug as PageSlug) : '';
};
