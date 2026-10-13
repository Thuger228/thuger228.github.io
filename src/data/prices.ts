import { useLanguage } from '@/contexts/LanguageContext';

export interface PricePackage {
  name: string;
  prefix: string;
  price: string;
  unit?: string;
  features: string[];
}

// Single source for prices, shared by the home page and the /price page.
export const usePricePackages = (): PricePackage[] => {
  const { t } = useLanguage();
  return [
    {
      name: t('price_recording_name'),
      prefix: t('price_from'),
      price: '120 zł',
      unit: t('unit_hour'),
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
      unit: t('unit_hour'),
      features: [
        t('price_rehearsal_feature1'),
        t('price_rehearsal_feature2'),
        t('price_rehearsal_feature3'),
        t('price_rehearsal_feature4'),
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
      ],
    },
    {
      name: t('price_mixing_name'),
      prefix: t('price_from'),
      price: '400 zł',
      unit: t('unit_song'),
      features: [
        t('price_mixing_feature1'),
        t('price_mixing_feature2'),
        t('price_mixing_feature3'),
        t('price_mixing_feature4'),
      ],
    },
  ];
};
