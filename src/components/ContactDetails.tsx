import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CalendarCheck, Check, Clock, Copy, Instagram, Link as LinkIcon, Mail, MapPin, Navigation, Phone, Star } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { pagePath } from '@/i18n/config';
import { useContactCopy } from '@/i18n/content/contact';
import { OPENING_HOURS, STUDIO_TIME_ZONE } from '@/data/booking';
import { Button } from '@/components/ui/button';
import ContactForm from '@/components/ContactForm';

// Every contact detail on the site lives here, so the home page and /contact/ always match.
export const STUDIO = {
  phone: '+48 881 238 684',
  phoneHref: 'tel:+48881238684',
  email: 'support@sanctum-sa.com',
  instagram: '@sanctum_sound_studio',
  instagramUrl: 'https://instagram.com/sanctum_sound_studio',
  linktree: 'linktr.ee/sanctum_sound',
  linktreeUrl: 'https://linktr.ee/sanctum_sound',
  googleUrl: 'https://share.google/E1KUsi1ynfDJUxQ7o',
  street: 'Aleja Stanów Zjednoczonych 67',
  city: '03-770 Warszawa',
  district: 'Praga-Południe',
  directionsUrl:
    'https://www.google.com/maps/dir/?api=1&destination=Aleja+Stan%C3%B3w+Zjednoczonych+67%2C+03-770+Warszawa',
};

// Is the studio open right now (Warsaw time)? null until mounted, because the page is pre-rendered.
const useOpenNow = () => {
  const [open, setOpen] = useState<boolean | null>(null);
  useEffect(() => {
    const check = () => {
      const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: STUDIO_TIME_ZONE,
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
      }).formatToParts(new Date());
      const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
      const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
      const hours = OPENING_HOURS[day];
      if (!hours) return setOpen(false);
      const now = get('hour') + ':' + get('minute');
      setOpen(now >= hours[0] && now < hours[1]);
    };
    check();
    const id = window.setInterval(check, 60_000);
    return () => window.clearInterval(id);
  }, []);
  return open;
};

export const OpenNowBadge = () => {
  const c = useContactCopy();
  const open = useOpenNow();
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full border border-border bg-background/60 backdrop-blur px-4 py-1.5 text-sm"
      aria-live="polite"
    >
      <span className="relative flex h-2.5 w-2.5">
        {open && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />}
        <span
          className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
            open === null ? 'bg-muted-foreground' : open ? 'bg-emerald-400' : 'bg-red-400'
          }`}
        />
      </span>
      <span className="text-muted-foreground">
        {open === null ? c.hours_value : open ? `${c.open_now} · ${c.hours_value}` : c.closed_now}
      </span>
    </span>
  );
};

const CopyButton = ({ value }: { value: string }) => {
  const c = useContactCopy();
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard?.writeText(value).then(() => {
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1800);
        });
      }}
      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
      aria-label={`${c.copy}: ${value}`}
    >
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? c.copied : c.copy}
    </button>
  );
};

// Big tappable shortcuts: call, email, Instagram, online booking.
export const QuickActions = () => {
  const { language } = useLanguage();
  const c = useContactCopy();
  const cardClass =
    'group flex flex-row items-center sm:flex-col sm:items-start gap-4 sm:gap-3 rounded-xl border border-border bg-card p-4 md:p-6 text-left transition-all duration-300 hover:border-primary hover:-translate-y-0.5 hover:shadow-[0_0_40px_hsl(0_0%_100%/0.08)]';
  const iconClass =
    'flex h-11 w-11 md:h-12 md:w-12 flex-shrink-0 items-center justify-center rounded-full bg-secondary text-primary transition-transform group-hover:scale-110';
  const items = [
    { icon: Phone, label: c.call, value: STUDIO.phone, href: STUDIO.phoneHref },
    { icon: Mail, label: c.write_email, value: STUDIO.email, href: `mailto:${STUDIO.email}` },
    { icon: Instagram, label: c.instagram, value: STUDIO.instagram, href: STUDIO.instagramUrl, external: true },
  ];
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 max-w-6xl mx-auto">
      {items.map((item) => (
        <a
          key={item.label}
          href={item.href}
          className={cardClass}
          {...(item.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        >
          <span className={iconClass}>
            <item.icon className="w-5 h-5" />
          </span>
          <span>
            <span className="block text-xs md:text-sm text-muted-foreground">{item.label}</span>
            <span className="block text-sm md:text-base font-semibold break-all">{item.value}</span>
          </span>
        </a>
      ))}
      <Link to={pagePath(language, 'booking')} className={`${cardClass} bg-primary text-primary-foreground border-primary`}>
        <span className="flex h-11 w-11 md:h-12 md:w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary-foreground/10 transition-transform group-hover:scale-110">
          <CalendarCheck className="w-5 h-5" />
        </span>
        <span>
          <span className="block text-xs md:text-sm opacity-70">{c.book_online}</span>
          <span className="flex items-center gap-1 text-sm md:text-base font-semibold">
            {c.book_online_value}
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </span>
        </span>
      </Link>
    </div>
  );
};

const InfoRow = ({ icon: Icon, label, children }: { icon: typeof Phone; label: string; children: React.ReactNode }) => (
  <div className="flex gap-4">
    <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-secondary text-primary">
      <Icon className="w-4 h-4" />
    </span>
    <div className="min-w-0">
      <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">{label}</p>
      {children}
    </div>
  </div>
);

// Quick actions + form + studio details + map. Shared by the home page and the /contact/ page.
const ContactDetails = () => {
  const { language, t } = useLanguage();
  const c = useContactCopy();
  const mapSrc = `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2443.022668981685!2d21.083040699999998!3d52.2429719!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x471ecdbef9fd1999%3A0xbae39472934ab9d5!2sAleja%20Stan%C3%B3w%20Zjednoczonych%2067%2C%2003-770%20Warszawa!5e0!3m2!1s${language}!2spl!4v1763254968136!5m2!1s${language}!2spl`;

  return (
    <div className="space-y-6 md:space-y-8">
      <QuickActions />

      <div className="grid gap-6 md:gap-8 lg:grid-cols-5 max-w-6xl mx-auto">
        {/* Form */}
        <div className="lg:col-span-3 rounded-2xl border border-border bg-card p-6 md:p-10">
          <h3 className="text-2xl md:text-3xl font-bold mb-2">{c.form_title}</h3>
          <p className="text-sm md:text-base text-muted-foreground mb-6 md:mb-8">{c.form_text}</p>
          <ContactForm />
        </div>

        {/* Studio details */}
        <div className="lg:col-span-2 flex flex-col gap-6 md:gap-8">
          <address className="not-italic rounded-2xl border border-border bg-card p-6 md:p-8 space-y-6">
            <InfoRow icon={MapPin} label={c.address_label}>
              <p className="font-semibold">Sanctum Sound</p>
              <p className="text-muted-foreground">{STUDIO.street}</p>
              <p className="text-muted-foreground">
                {STUDIO.city} ({STUDIO.district})
              </p>
              <a
                href={STUDIO.directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                <Navigation className="w-3.5 h-3.5" />
                {c.directions}
              </a>
            </InfoRow>
            <InfoRow icon={Clock} label={c.hours_label}>
              <p className="font-semibold">{c.hours_value}</p>
            </InfoRow>
            <InfoRow icon={Phone} label={t('contact_phone')}>
              <div className="flex flex-wrap items-center gap-x-2">
                <a href={STUDIO.phoneHref} className="font-semibold hover:underline underline-offset-4">
                  {STUDIO.phone}
                </a>
                <CopyButton value={STUDIO.phone} />
              </div>
            </InfoRow>
            <InfoRow icon={Mail} label={c.email_label}>
              <div className="flex flex-wrap items-center gap-x-2">
                <a href={`mailto:${STUDIO.email}`} className="font-semibold break-all hover:underline underline-offset-4">
                  {STUDIO.email}
                </a>
                <CopyButton value={STUDIO.email} />
              </div>
            </InfoRow>
            <div className="border-t border-border pt-5">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">{c.socials_label}</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { icon: Instagram, label: 'Instagram', href: STUDIO.instagramUrl },
                  { icon: LinkIcon, label: 'Linktree', href: STUDIO.linktreeUrl },
                  { icon: Star, label: c.google_profile, href: STUDIO.googleUrl },
                ].map((s) => (
                  <a
                    key={s.href}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-border px-3.5 py-2 text-sm text-muted-foreground hover:border-primary hover:text-foreground transition-colors"
                  >
                    <s.icon className="w-4 h-4" />
                    {s.label}
                  </a>
                ))}
              </div>
            </div>
          </address>

          <div className="rounded-2xl border border-border bg-gradient-to-br from-secondary to-card p-6 md:p-8">
            <p className="text-lg md:text-xl font-bold mb-2">{c.rehearsal_tip_title}</p>
            <p className="text-sm text-muted-foreground mb-5">{c.rehearsal_tip_text}</p>
            <Button asChild className="w-full sm:w-auto">
              <Link to={pagePath(language, 'booking')}>
                {c.rehearsal_tip_button}
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="relative max-w-6xl mx-auto overflow-hidden rounded-2xl border border-border bg-card h-[320px] md:h-[460px]">
        <iframe
          src={mapSrc}
          title={c.map_title}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        ></iframe>
        <a
          href={STUDIO.directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute bottom-4 left-4 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg hover:opacity-90 transition-opacity"
        >
          <Navigation className="w-4 h-4" />
          {c.directions}
        </a>
      </div>
    </div>
  );
};

export default ContactDetails;
