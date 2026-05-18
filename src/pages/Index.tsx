import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import SEO from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import logo from '@/assets/logo.png';
import { ArrowRight, Mic2, Headphones, Music2, Radio, Guitar, Waves, Music, Drum, Speaker, Mic, Cable, Disc, Check, MapPin, Phone, Instagram, Link as LinkIcon, Eye, ListMusic } from 'lucide-react';
import Gallery from '@/components/Gallery';
import heroBackground from '@/assets/hero-background.jpg';
import recordingStudio from '@/assets/gallery/recording-studio.jpg';
import rehearsalRoom from '@/assets/gallery/rehearsal-room.jpg';
import equipment from '@/assets/gallery/equipment.jpg';
import vocalBooth from '@/assets/gallery/vocal-booth.jpg';
import instruments from '@/assets/gallery/instruments.jpg';
import studioLounge from '@/assets/gallery/studio-lounge.jpg';

const Index = () => {
  const { t } = useLanguage();
  const [gearDialogOpen, setGearDialogOpen] = useState(false);

  const studioGear = [
    {
      category: 'Drums',
      items: [
        'Yamaha Stage Custom Studio',
        'Gibraltar 9608E Drum Throne',
        'Millenium PD-223 Pro Series BD Pedal',
        'Millenium 16" B20 China',
        'Millenium 18" B20 Crash',
        'Zultan 16" Aja Crash',
        'Mapex P401 Pedal',
      ]
    },
    {
      category: 'Bass',
      items: [
        'Darkglass Alpha-Omega 500 Bass Head',
        'Darkglass DG212N Bass Cabinet',
        'Warwick Profet 5.1 Bass Head',
        'Warwick WCA410-4W Bass Cabinet',
      ]
    },
    {
      category: 'Guitars',
      items: [
        'Blackstar HT Stage 100 Mk1 Guitar Head',
        'Blackstar HVT Cabinet',
        'Peavey 6505 Guitar Head',
        'Marshall AVT412 Cabinet',
        'Marshall JCM 2000 TSL 100 Guitar Head',
        'Marshall Mg412 Cabinet',
        'Randall RD45 Guitar Head',
        'Randall Jaguar Cabinet',
      ]
    },
    {
      category: 'PA',
      items: [
        'Vonyx 800W 12\'\' USB BT',
        'Behringer Xenyx X1622USB',
      ]
    },
    {
      category: 'Microphones',
      items: [
        'Microphones Shure Sm 57',
        'Microphones Sennheiser E945',
        'Microphones Shure Sm 58',
      ]
    },
    {
      category: 'Studio Stuff',
      items: [
        'Monitors Genelec 8330 APM',
        'Presonus Studio 1824c Audio Card',
        'DBX 286 S Vocal Preamp',
        'Behringer ADA8200 Ultragain ADAT Audio Interface',
        'Behringer DI20 Di-Box',
        'Tc Electronics Polytune 3 Guitar/Bass Tuner',
        'Overtone Labs Tune Bot Drum Tuner',
        'Boss SD-1 Pedal',
        'Electro Harmonix Metal Muff Pedal',
        'Behringer UM300 Pedal',
        'Amt Electronics Slap Bass Combo Emulator Pedal',
        'Behringer P2 Headphones AMP',
        'Phones Beyerdynamic DT-770 Pro',
        'Phones Beyerdynamic DT-770 M',
        'Phones The t.bone HD 815',
        'Microphone Rode NT1 Signature Black',
        'Microphone Shure SM-7B',
        'Microphone Audiotechnika AT2020',
        'Microphone Shure Beta 52A',
        'Microphones Audix Adx 51',
        'Microphone Behringer BA 19A',
        'Microphone Audix i-5',
        'Microphone Shure Sm57 LC',
        'Microphones AKG P4',
        'Microphone AKG P2',
        'Microphones AKG P17',
        'Bass guitar Harley Benton PJ-4 SBK Deluxe',
        'Electric Guitar Jackson Kelly',
        'Synth Startone MK-400',
        'Acoustic Guitar Fusion Custom Made',
      ]
    },
  ];

  const galleryImages = [
    { src: recordingStudio, alt: 'Professional Recording Studio' },
    { src: rehearsalRoom, alt: 'Rehearsal Room' },
    { src: equipment, alt: 'Audio Equipment' },
    { src: vocalBooth, alt: 'Vocal Recording Booth' },
    { src: instruments, alt: 'Musical Instruments' },
    { src: studioLounge, alt: 'Studio Lounge Area' },
  ];

  const recordingServices = [
    { icon: Mic2, title: t('recording_vocal_title'), desc: t('recording_vocal_desc') },
    { icon: Music2, title: t('recording_instrument_title'), desc: t('recording_instrument_desc') },
    { icon: Headphones, title: t('recording_mixing_title'), desc: t('recording_mixing_desc') },
    { icon: Radio, title: t('recording_production_title'), desc: t('recording_production_desc') },
  ];

  const rehearsalFeatures = [
    { icon: Guitar, title: t('rehearsals_backline_title'), desc: t('rehearsals_backline_desc') },
    { icon: Waves, title: t('rehearsals_acoustic_title'), desc: t('rehearsals_acoustic_desc') },
    { icon: Music, title: t('rehearsals_booking_title'), desc: t('rehearsals_booking_desc') },
    { icon: Drum, title: t('rehearsals_climate_title'), desc: t('rehearsals_climate_desc') },
  ];

  const rentEquipment = [
    { icon: Speaker, title: t('rent_pa_title'), desc: t('rent_pa_desc') },
    { icon: Mic, title: t('rent_mics_title'), desc: t('rent_mics_desc') },
    { icon: Cable, title: t('rent_stage_title'), desc: t('rent_stage_desc') },
    { icon: Disc, title: t('rent_recording_title'), desc: t('rent_recording_desc') },
  ];

  const pricePackages = [
    {
      name: t('price_recording_name'),
      prefix: t('price_from'),
      price: '120 zł',
      unit: '/hour',
      features: [
        t('price_recording_feature1'),
        t('price_recording_feature2'),
        t('price_recording_feature3'),
        t('price_recording_feature4'),
      ],
    },
    {
      name: t('price_rehearsal_name'),
      prefix: t('price_from'),
      price: '50 zł',
      unit: '/hour',
      features: [
        t('price_rehearsal_feature1'),
        t('price_rehearsal_feature2'),
        t('price_rehearsal_feature3'),
        t('price_rehearsal_feature4'),
        t('price_rehearsal_feature5'),
      ],
    },
    {
      name: t('price_rental_name'),
      prefix: '',
      price: t('price_optional'),
      features: [
        t('price_rental_feature1'),
        t('price_rental_feature2'),
        t('price_rental_feature3'),
        t('price_rental_feature4'),
        t('price_rental_feature5'),
        t('price_rental_feature6'),
        t('price_rental_feature7'),
      ],
    },
    {
      name: t('price_mixing_name'),
      prefix: t('price_from'),
      price: '400 zł',
      unit: '/song',
      features: [
        t('price_mixing_feature1'),
        t('price_mixing_feature2'),
        t('price_mixing_feature3'),
        t('price_mixing_feature4'),
      ],
    },
  ];

  return (
    <div className="min-h-screen pt-16 md:pt-20">
      <SEO
        title="Sanctum Sound — Recording Studio & Rehearsal Rooms in Warsaw"
        description="Professional recording studio in Warsaw: recording, mixing, rehearsal rooms and equipment rental for bands and artists."
        path="/"
      />
      <section className="relative flex items-center justify-center min-h-[calc(100vh-4rem)] md:min-h-[calc(100vh-5rem)]">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${heroBackground})` }}></div>
        <div className="absolute inset-0 bg-gradient-to-b from-background via-card to-background opacity-90"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent"></div>
        
        <div className="container mx-auto px-6 text-center relative z-10">
          <div className="mb-8 md:mb-12 flex justify-center">
            <img src={logo} alt="Sanctum Sound" className="h-24 md:h-32 lg:h-48 w-auto animate-fade-in" />
          </div>
          
          <h1 className="text-3xl md:text-5xl lg:text-7xl font-bold mb-4 md:mb-6 animate-fade-in px-4">
            {t('hero_title')}
          </h1>
          
          <p className="text-lg md:text-xl lg:text-2xl text-muted-foreground mb-8 md:mb-12 max-w-2xl mx-auto animate-fade-in px-4">
            {t('hero_subtitle')}
          </p>

          <div className="h-16"></div>
        </div>
      </section>

      {/* Gallery Section */}
      <section className="py-12 md:py-20 bg-card">
        <div className="container mx-auto px-4 md:px-6">
          <Gallery images={galleryImages} />
        </div>
      </section>

      {/* Studio Gear Section */}
      <section id="studio-gear" className="py-12 md:py-20 bg-gradient-to-b from-background to-card">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl md:text-5xl font-bold text-center mb-4 md:mb-6">{t('studio_gear_title')}</h2>
          <p className="text-base md:text-xl text-muted-foreground text-center max-w-3xl mx-auto mb-10 md:mb-12">
            {t('studio_gear_button')}
          </p>
          
          <div className="flex justify-center">
            <Dialog open={gearDialogOpen} onOpenChange={setGearDialogOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="group px-8 md:px-12 py-6 md:py-8 text-base md:text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                  <Eye className="mr-2 w-5 h-5 md:w-6 md:h-6 group-hover:scale-110 transition-transform" />
                  {t('studio_gear_watch')}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-5xl max-h-[85vh] overflow-hidden flex flex-col">
                <DialogHeader className="pb-4 border-b border-border">
                  <DialogTitle className="text-xl md:text-3xl flex items-center gap-3">
                    <ListMusic className="w-6 h-6 md:w-8 md:h-8 text-primary" />
                    {t('studio_gear_title')}
                  </DialogTitle>
                </DialogHeader>
                <div className="overflow-y-auto pr-2 space-y-8 mt-6">
                  {studioGear.map((category, index) => (
                    <div key={index} className="bg-card border border-border rounded-lg p-6 hover:border-primary transition-all duration-300">
                      <h3 className="text-lg md:text-2xl font-bold mb-4 text-primary">{category.category}</h3>
                      <ul className="grid gap-3 md:grid-cols-2">
                        {category.items.map((item, itemIndex) => (
                          <li key={itemIndex} className="flex items-start gap-2 text-sm md:text-base">
                            <Check className="w-4 h-4 md:w-5 md:h-5 text-primary flex-shrink-0 mt-0.5" />
                            <span className="text-muted-foreground">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </section>

      {/* Recording Section */}
      <section id="recording" className="py-12 md:py-20 bg-gradient-to-b from-background to-card">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl md:text-5xl font-bold text-center mb-4 md:mb-6">{t('recording_title')}</h2>
          <p className="text-base md:text-xl text-muted-foreground text-center max-w-3xl mx-auto mb-10 md:mb-16">
            {t('recording_desc')}
          </p>

          <div className="grid gap-6 md:grid-cols-2 md:gap-8 max-w-5xl mx-auto">
            {recordingServices.map((service, index) => (
              <div
                key={index}
                className="p-6 md:p-8 bg-card border border-border rounded-lg hover:border-primary transition-all duration-300 group"
              >
                <service.icon className="w-10 h-10 md:w-12 md:h-12 mb-3 md:mb-4 text-primary group-hover:scale-110 transition-transform" />
                <h3 className="text-xl md:text-2xl font-bold mb-2 md:mb-3">{service.title}</h3>
                <p className="text-sm md:text-base text-muted-foreground">{service.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Rehearsals Section */}
      <section id="rehearsals" className="py-12 md:py-20 bg-gradient-to-b from-card to-background">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl md:text-5xl font-bold text-center mb-4 md:mb-6">{t('rehearsals_title')}</h2>
          <p className="text-base md:text-xl text-muted-foreground text-center max-w-3xl mx-auto mb-10 md:mb-16">
            {t('rehearsals_desc')}
          </p>

          <div className="grid gap-6 md:grid-cols-2 md:gap-8 max-w-5xl mx-auto">
            {rehearsalFeatures.map((feature, index) => (
              <div
                key={index}
                className="p-6 md:p-8 bg-card border border-border rounded-lg hover:border-primary transition-all duration-300 group"
              >
                <feature.icon className="w-10 h-10 md:w-12 md:h-12 mb-3 md:mb-4 text-primary group-hover:scale-110 transition-transform" />
                <h3 className="text-xl md:text-2xl font-bold mb-2 md:mb-3">{feature.title}</h3>
                <p className="text-sm md:text-base text-muted-foreground">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Rent Section */}
      <section id="rent" className="py-12 md:py-20 bg-gradient-to-b from-background to-card">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl md:text-5xl font-bold text-center mb-4 md:mb-6">{t('rent_title')}</h2>
          <p className="text-base md:text-xl text-muted-foreground text-center max-w-3xl mx-auto mb-10 md:mb-16">
            {t('rent_desc')}
          </p>

          <div className="grid gap-6 md:grid-cols-2 md:gap-8 max-w-5xl mx-auto">
            {rentEquipment.map((item, index) => (
              <div
                key={index}
                className="p-6 md:p-8 bg-card border border-border rounded-lg hover:border-primary transition-all duration-300 group"
              >
                <item.icon className="w-10 h-10 md:w-12 md:h-12 mb-3 md:mb-4 text-primary group-hover:scale-110 transition-transform" />
                <h3 className="text-xl md:text-2xl font-bold mb-2 md:mb-3">{item.title}</h3>
                <p className="text-sm md:text-base text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Price Section */}
      <section id="price" className="py-12 md:py-20 bg-gradient-to-b from-card to-background">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl md:text-5xl font-bold text-center mb-4 md:mb-6">{t('price_title')}</h2>
          <p className="text-base md:text-xl text-muted-foreground text-center max-w-3xl mx-auto mb-10 md:mb-16">
            {t('price_subtitle')}
          </p>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 md:gap-8 max-w-7xl mx-auto">
            {pricePackages.map((pkg, index) => (
              <div
                key={index}
                className="p-6 md:p-8 bg-card border border-border rounded-lg hover:border-primary transition-all duration-300 flex flex-col"
              >
                <h3 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">{pkg.name}</h3>
                <div className="mb-4 md:mb-6">
                  <span className="text-xxs md:text-xxs font-bold">{pkg.prefix} </span>
                  <span className="text-3xl md:text-4xl font-bold">{pkg.price}</span>
                  <span className="text-sm md:text-base text-muted-foreground">{pkg.unit}</span>
                </div>
                <ul className="space-y-2 md:space-y-3 flex-grow">
                  {pkg.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="w-4 h-4 md:w-5 md:h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-xs md:text-sm text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-12 md:py-20 bg-gradient-to-b from-background to-card">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl md:text-5xl font-bold text-center mb-10 md:mb-16">{t('contact_title')}</h2>

          <div className="grid gap-8 lg:grid-cols-2 lg:gap-12 max-w-6xl mx-auto">
            {/* Contact Information */}
            <div className="bg-card border border-border rounded-lg p-6 md:p-8">
              <div className="space-y-5 md:space-y-6">
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
                    <p className="text-xs md:text-sm text-muted-foreground">Aleja Stanów Zjednoczonych 67, 03-770 Warszawa</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-primary flex-shrink-0" />
                  <div>
                    <p className="font-medium text-sm md:text-base">{t('contact_phone')}</p>
                    <p className="text-xs md:text-sm text-muted-foreground">+48 881 238 684</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Google Maps */}
            <div className="bg-card border border-border rounded-lg overflow-hidden h-[400px] md:h-[600px]">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2443.022668981685!2d21.083040699999998!3d52.2429719!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x471ecdbef9fd1999%3A0xbae39472934ab9d5!2sAleja%20Stan%C3%B3w%20Zjednoczonych%2067%2C%2003-770%20Warszawa!5e0!3m2!1sru!2spl!4v1763254968136!5m2!1sru!2spl"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
          </div>
        </div>
      </section>

      {/* Fixed Contact Button */}
      <a href="#contact" className="fixed bottom-12 left-1/2 -translate-x-1/2 z-40 animate-fade-in">
        <div className="relative">
          <div className="absolute inset-0 bg-background/60 backdrop-blur-md rounded-lg -z-10 blur-sm"></div>
          <Button 
            size="lg" 
            className="group px-10 py-6 md:px-14 md:py-8 text-lg md:text-xl font-semibold shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105 animate-pulse-subtle"
          >
            {t('nav_contact')}
            <ArrowRight className="ml-2 w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </a>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-8 md:py-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <img src={logo} alt="Sanctum Sound" className="h-16 w-auto" />
            <p className="text-muted-foreground text-sm">
              {t('footer_tagline')}
            </p>
            <p className="text-muted-foreground text-xs">
              © {new Date().getFullYear()} Sanctum Sound. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
