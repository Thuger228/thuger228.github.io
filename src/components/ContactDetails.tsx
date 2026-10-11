import { MapPin, Phone, Instagram, Link as LinkIcon } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

// Contact information + Google Map, shared by the home page and the /contact page.
const ContactDetails = () => {
  const { language, t } = useLanguage();
  const mapSrc = `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2443.022668981685!2d21.083040699999998!3d52.2429719!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x471ecdbef9fd1999%3A0xbae39472934ab9d5!2sAleja%20Stan%C3%B3w%20Zjednoczonych%2067%2C%2003-770%20Warszawa!5e0!3m2!1s${language}!2spl!4v1763254968136!5m2!1s${language}!2spl`;

  return (
    <div className="grid gap-8 lg:grid-cols-2 lg:gap-12 max-w-6xl mx-auto">
      {/* Contact Information */}
      <div className="bg-card border border-border rounded-lg p-6 md:p-8">
        <div className="space-y-5 md:space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-5 flex-shrink-0"></div>
            <p className="text-sm md:text-base font-semibold text-primary">{t('contact_subtitle')}</p>
          </div>
          <div className="flex items-center gap-3">
            <LinkIcon className="w-5 h-5 text-primary flex-shrink-0" />
            <div>
              <p className="font-medium text-sm md:text-base">Linktree</p>
              <a href="https://linktr.ee/sanctum_sound" target="_blank" rel="noopener noreferrer" className="text-xs md:text-sm text-muted-foreground hover:text-primary transition-colors break-all">linktr.ee/sanctum_sound</a>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Instagram className="w-5 h-5 text-primary flex-shrink-0" />
            <div>
              <p className="font-medium text-sm md:text-base">Instagram</p>
              <a href="https://instagram.com/sanctum_sound_studio" target="_blank" rel="noopener noreferrer" className="text-xs md:text-sm text-muted-foreground hover:text-primary transition-colors">@sanctum_sound_studio</a>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-primary flex-shrink-0" />
            <div>
              <p className="font-medium text-sm md:text-base">{t('contact_address')}</p>
              <p className="text-xs md:text-sm text-muted-foreground">Aleja Stanów Zjednoczonych 67, 03-770 Warszawa (Praga-Południe)</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Phone className="w-5 h-5 text-primary flex-shrink-0" />
            <div>
              <p className="font-medium text-sm md:text-base">{t('contact_phone')}</p>
              <a href="tel:+48881238684" className="text-xs md:text-sm text-muted-foreground hover:text-primary transition-colors">+48 881 238 684</a>
            </div>
          </div>
        </div>
      </div>

      {/* Google Maps */}
      <div className="bg-card border border-border rounded-lg overflow-hidden h-[400px] md:h-[600px]">
        <iframe
          src={mapSrc}
          title="Sanctum Sound — Google Maps"
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        ></iframe>
      </div>
    </div>
  );
};

export default ContactDetails;
