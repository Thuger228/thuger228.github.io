import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { pagePath } from '@/i18n/config';
import { useCopy } from '@/i18n/content';
import logo from '@/assets/logo.webp';

const Footer = () => {
  const { language, t } = useLanguage();
  const copy = useCopy();

  const links = [
    { slug: 'recording', label: t('nav_recording') },
    { slug: 'rehearsals', label: t('nav_rehearsals') },
    { slug: 'rent', label: t('nav_rent') },
    { slug: 'price', label: t('nav_price') },
    { slug: 'voucher', label: copy.ui.nav_voucher },
    { slug: 'podcast', label: copy.ui.nav_podcast },
    { slug: 'contact', label: t('nav_contact') },
  ] as const;

  return (
    <footer className="bg-card border-t border-border py-8 md:py-12">
      <div className="container mx-auto px-6">
        <div className="flex flex-col items-center text-center space-y-4">
          <Link to={pagePath(language)} aria-label={t('nav_home')}>
            <img src={logo} alt="" width={64} height={64} loading="lazy" className="h-16 w-auto" />
          </Link>
          <nav aria-label="Footer">
            <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2">
              {links.map((link) => (
                <li key={link.slug}>
                  <Link
                    to={pagePath(language, link.slug)}
                    className="inline-block py-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <p className="text-muted-foreground text-sm">
            {t('footer_tagline')}
          </p>
          <address className="not-italic text-muted-foreground text-xs">
            Sanctum Sound · Aleja Stanów Zjednoczonych 67, 03-770 Warszawa ·{' '}
            <a href="tel:+48881238684" className="hover:text-primary">+48 881 238 684</a>
          </address>
          <p className="text-muted-foreground text-xs">
            © {new Date().getFullYear()} Sanctum Sound. {t('footer_rights')}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
