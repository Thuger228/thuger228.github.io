import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { LANGUAGES, LANGUAGE_LABELS, pagePath, slugFromPath } from '@/i18n/config';
import logo from '@/assets/logo.webp';

const Header = () => {
  const { language, t } = useLanguage();
  const location = useLocation();
  const homePath = pagePath(language);
  const isHome = location.pathname === homePath;

  const navItems = [
    { hash: '#recording', label: t('nav_recording') },
    { hash: '#rehearsals', label: t('nav_rehearsals') },
    { hash: '#rent', label: t('nav_rent') },
    { hash: '#price', label: t('nav_price') },
    { hash: '#contact', label: t('nav_contact') },
  ];

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, hash: string) => {
    if (!isHome) return; // follow the link to the home page section
    e.preventDefault();
    const element = document.querySelector(hash);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const currentSlug = slugFromPath(location.pathname);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center h-16 md:h-20">
          <Link to={homePath} className="flex items-center" aria-label={t('nav_home')}>
            <img src={logo} alt={t('logo_alt')} width={64} height={64} className="h-14 md:h-16 w-auto" />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8 flex-1 justify-center">
            {navItems.map((item) => (
              <a
                key={item.hash}
                href={`${homePath}${item.hash}`}
                onClick={(e) => handleNavClick(e, item.hash)}
                className="text-sm font-medium transition-colors hover:text-primary text-muted-foreground"
              >
                {item.label}
              </a>
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
