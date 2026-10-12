// Copy shared by the site's forms: the phone field and the "taking you to payment" loader.

import { useLanguage } from '@/contexts/LanguageContext';
import type { Language } from '@/i18n/config';

export interface FormsCopy {
  phone_country: string; // accessible name of the country code picker
  phone_other: string; // "other country" option: type the full number with +
  phone_other_placeholder: string;
  phone_invalid: string;
  pay_title: string;
  pay_steps: [string, string, string]; // reserving + creating payment, saving the booking, opening Stripe
  pay_note: string;
}

const pl: FormsCopy = {
  phone_country: 'Numer kierunkowy kraju',
  phone_other: 'Inny kraj',
  phone_other_placeholder: '+39 312 345 6789',
  phone_invalid: 'Sprawdź numer telefonu.',
  pay_title: 'Przygotowujemy bezpieczną płatność',
  pay_steps: ['Rezerwujemy Twój termin', 'Zapisujemy rezerwację', 'Otwieramy stronę płatności Stripe'],
  pay_note: 'To potrwa kilka sekund. Nie zamykaj i nie odświeżaj tej strony.',
};

const en: FormsCopy = {
  phone_country: 'Country code',
  phone_other: 'Other country',
  phone_other_placeholder: '+39 312 345 6789',
  phone_invalid: 'Please check your phone number.',
  pay_title: 'Preparing your secure payment',
  pay_steps: ['Reserving your time slot', 'Saving your booking', 'Opening the Stripe payment page'],
  pay_note: 'This takes a few seconds. Please don’t close or refresh this page.',
};

const uk: FormsCopy = {
  phone_country: 'Код країни',
  phone_other: 'Інша країна',
  phone_other_placeholder: '+39 312 345 6789',
  phone_invalid: 'Перевірте номер телефону.',
  pay_title: 'Готуємо безпечну оплату',
  pay_steps: ['Бронюємо ваш час', 'Зберігаємо бронювання', 'Відкриваємо сторінку оплати Stripe'],
  pay_note: 'Це займе кілька секунд. Не закривайте й не оновлюйте сторінку.',
};

const be: FormsCopy = {
  phone_country: 'Код краіны',
  phone_other: 'Іншая краіна',
  phone_other_placeholder: '+39 312 345 6789',
  phone_invalid: 'Праверце нумар тэлефона.',
  pay_title: 'Рыхтуем бяспечную аплату',
  pay_steps: ['Бранюем ваш час', 'Захоўваем браніраванне', 'Адкрываем старонку аплаты Stripe'],
  pay_note: 'Гэта зойме некалькі секунд. Не закрывайце і не абнаўляйце старонку.',
};

const ru: FormsCopy = {
  phone_country: 'Код страны',
  phone_other: 'Другая страна',
  phone_other_placeholder: '+39 312 345 6789',
  phone_invalid: 'Проверьте номер телефона.',
  pay_title: 'Готовим безопасную оплату',
  pay_steps: ['Бронируем ваше время', 'Сохраняем бронирование', 'Открываем страницу оплаты Stripe'],
  pay_note: 'Это займёт несколько секунд. Не закрывайте и не обновляйте страницу.',
};

export const formsCopy: Record<Language, FormsCopy> = { pl, en, uk, be, ru };

export const useFormsCopy = (): FormsCopy => formsCopy[useLanguage().language];
