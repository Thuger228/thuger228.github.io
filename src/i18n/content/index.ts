import { useLanguage } from '@/contexts/LanguageContext';
import type { Language } from '@/i18n/config';
import type { SiteCopy } from './types';
import pl from './pl';
import en from './en';
import uk from './uk';
import be from './be';
import ru from './ru';

export const siteCopy: Record<Language, SiteCopy> = { pl, en, uk, be, ru };

export const useCopy = (): SiteCopy => siteCopy[useLanguage().language];
