import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { LANGUAGES, LANGUAGE_LABELS, pagePath, slugFromPath } from '@/i18n/config';
import { useCopy } from '@/i18n/content';
import logo from '@/assets/logo.webp';

const Header = () => {
  const { language, t } = useLanguage();
  const copy = useCopy();
  const location = useLocation();
  const homePath = pagePath(language);

  // Every menu item is a real page, so it works the same from the home page and from sub-pages.
  const navItems = [
    { slug: 'recording', label: t('nav_recording') },
    { slug: 'rehearsals', label: t('nav_rehearsals') },
    { slug: 'rent', label: t('nav_rent') },
    { slug: 'price', label: t('nav_price') },
    { slug: 'voucher', label: copy.ui.nav_voucher },
    { slug: 'contact', label: t('nav_contact') },
  ] as const;

  const currentSlug = slugFromPath(location.pathname);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center h-16 md:h-20">
          <Link to={homePath} className="flex items-center shrink-0" aria-label={t('nav_home')}>
            <img src={logo} alt={t('logo_alt')} width={64} height={64} className="h-14 md:h-16 w-auto" />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-3 lg:gap-8 flex-1 justify-center px-3">
            {navItems.map((item) => (
              <Link
                key={item.slug}
                to={pagePath(language, item.slug)}
                aria-current={currentSlug === item.slug ? 'page' : undefined}
                onClick={() => currentSlug === item.slug && window.scrollTo({ top: 0, behavior: 'smooth' })}
                className={`text-xs lg:text-sm whitespace-nowrap font-medium transition-colors hover:text-primary ${
                  currentSlug === item.slug ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Language Switcher: real links so each language URL is crawlable */}
          <nav aria-label={t('lang_label')} className="flex items-center gap-1 md:gap-2 ml-auto">
            {LANGUAGES.map((lang) => (
              <Link
                key={lang}
                to={pagePath(lang, currentSlug)}
                hrefLang={lang}
                lang={lang}
                aria-current={language === lang ? 'true' : undefined}
                className={`inline-flex items-center justify-center min-w-[40px] h-10 px-2 text-xs font-medium rounded transition-colors ${
                  language === lang
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-accent'
                }`}
              >
                {LANGUAGE_LABELS[lang]}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
