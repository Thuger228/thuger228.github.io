// Copy for the contact block shared by the home page and the /contact/ page:
// quick actions, opening hours, the contact form and the info card.
// Page-level SEO copy (title, H1, intro, sections) stays in pl.ts, en.ts, ... under `contact`.

import { useLanguage } from '@/contexts/LanguageContext';
import type { Language } from '@/i18n/config';

export type ContactTopic = 'rehearsal' | 'recording' | 'mixing' | 'rent' | 'voucher' | 'other';

export interface ContactCopy {
  call: string;
  write_email: string;
  instagram: string;
  book_online: string;
  book_online_value: string;
  hours_label: string;
  hours_value: string;
  address_label: string;
  directions: string;
  email_label: string;
  socials_label: string;
  google_profile: string;
  copy: string;
  copied: string;
  form_title: string;
  form_text: string;
  topic_label: string;
  topics: Record<ContactTopic, string>;
  message_placeholder: string;
  sending: string;
  sent_title: string;
  sent_text: string;
  send_another: string;
  rehearsal_tip_title: string;
  rehearsal_tip_text: string;
  rehearsal_tip_button: string;
  map_title: string;
}

const pl: ContactCopy = {
  call: 'Zadzwoń',
  write_email: 'Napisz e-mail',
  instagram: 'Instagram',
  book_online: 'Rezerwacja online',
  book_online_value: 'Wybierz termin',
  hours_label: 'Godziny otwarcia',
  hours_value: 'Codziennie 9:00–24:00',
  address_label: 'Adres',
  directions: 'Wyznacz trasę',
  email_label: 'E-mail',
  socials_label: 'Znajdziesz nas też tu',
  google_profile: 'Profil w Google',
  copy: 'Kopiuj',
  copied: 'Skopiowano',
  form_title: 'Napisz do nas',
  form_text: 'Odpowiadamy najszybciej, jak to możliwe - e-mailem albo telefonicznie.',
  topic_label: 'Czego dotyczy wiadomość?',
  topics: {
    rehearsal: 'Sala prób',
    recording: 'Nagranie',
    mixing: 'Miks i mastering',
    rent: 'Wynajem sprzętu',
    voucher: 'Voucher',
    other: 'Inne',
  },
  message_placeholder: 'Opisz, czego potrzebujesz, i podaj terminy, które Ci pasują.',
  sending: 'Wysyłanie…',
  sent_title: 'Dziękujemy, wiadomość dotarła!',
  sent_text: 'Odezwiemy się najszybciej, jak to możliwe.',
  send_another: 'Wyślij kolejną wiadomość',
  rehearsal_tip_title: 'Szukasz sali prób?',
  rehearsal_tip_text: 'Wybierz wolny termin w kalendarzu i zapłać online - bez czekania na odpowiedź.',
  rehearsal_tip_button: 'Zarezerwuj salę prób',
  map_title: 'Sanctum Sound na mapie Google',
};

const en: ContactCopy = {
  call: 'Call us',
  write_email: 'Email us',
  instagram: 'Instagram',
  book_online: 'Book online',
  book_online_value: 'Pick a time',
  hours_label: 'Opening hours',
  hours_value: 'Every day 9:00–24:00',
  address_label: 'Address',
  directions: 'Get directions',
  email_label: 'Email',
  socials_label: 'Also find us on',
  google_profile: 'Google profile',
  copy: 'Copy',
  copied: 'Copied',
  form_title: 'Send us a message',
  form_text: 'We reply as soon as we can, by email or phone.',
  topic_label: 'What is it about?',
  topics: {
    rehearsal: 'Rehearsal room',
    recording: 'Recording',
    mixing: 'Mixing & mastering',
    rent: 'Equipment rental',
    voucher: 'Voucher',
    other: 'Other',
  },
  message_placeholder: 'Tell us what you need and which dates work for you.',
  sending: 'Sending…',
  sent_title: 'Thanks, your message is in!',
  sent_text: 'We’ll get back to you as soon as we can.',
  send_another: 'Send another message',
  rehearsal_tip_title: 'Looking for a rehearsal room?',
  rehearsal_tip_text: 'Pick a free slot in the calendar and pay online, no waiting for a reply.',
  rehearsal_tip_button: 'Book the rehearsal room',
  map_title: 'Sanctum Sound on Google Maps',
};

const uk: ContactCopy = {
  call: 'Зателефонувати',
  write_email: 'Написати e-mail',
  instagram: 'Instagram',
  book_online: 'Онлайн-бронювання',
  book_online_value: 'Обрати час',
  hours_label: 'Години роботи',
  hours_value: 'Щодня 9:00–24:00',
  address_label: 'Адреса',
  directions: 'Прокласти маршрут',
  email_label: 'E-mail',
  socials_label: 'Ми також тут',
  google_profile: 'Профіль у Google',
  copy: 'Копіювати',
  copied: 'Скопійовано',
  form_title: 'Напишіть нам',
  form_text: 'Відповідаємо якнайшвидше - електронною поштою або телефоном.',
  topic_label: 'Чого стосується повідомлення?',
  topics: {
    rehearsal: 'Репетиційна зала',
    recording: 'Запис',
    mixing: 'Зведення і мастеринг',
    rent: 'Оренда обладнання',
    voucher: 'Сертифікат',
    other: 'Інше',
  },
  message_placeholder: 'Опишіть, що вам потрібно, і вкажіть зручні дати.',
  sending: 'Надсилання…',
  sent_title: 'Дякуємо, повідомлення отримано!',
  sent_text: 'Ми відповімо якнайшвидше.',
  send_another: 'Надіслати ще одне',
  rehearsal_tip_title: 'Шукаєте репетиційну залу?',
  rehearsal_tip_text: 'Оберіть вільний час у календарі й оплатіть онлайн - без очікування відповіді.',
  rehearsal_tip_button: 'Забронювати залу',
  map_title: 'Sanctum Sound на Google Maps',
};

const be: ContactCopy = {
  call: 'Патэлефанаваць',
  write_email: 'Напісаць e-mail',
  instagram: 'Instagram',
  book_online: 'Анлайн-браніраванне',
  book_online_value: 'Выбраць час',
  hours_label: 'Гадзіны працы',
  hours_value: 'Штодня 9:00–24:00',
  address_label: 'Адрас',
  directions: 'Пракласці маршрут',
  email_label: 'E-mail',
  socials_label: 'Мы таксама тут',
  google_profile: 'Профіль у Google',
  copy: 'Капіяваць',
  copied: 'Скапіявана',
  form_title: 'Напішыце нам',
  form_text: 'Адказваем як мага хутчэй - па e-mail або па тэлефоне.',
  topic_label: 'Чаго тычыцца паведамленне?',
  topics: {
    rehearsal: 'Рэпетыцыйная зала',
    recording: 'Запіс',
    mixing: 'Мікшаванне і мастэрынг',
    rent: 'Арэнда абсталявання',
    voucher: 'Сертыфікат',
    other: 'Іншае',
  },
  message_placeholder: 'Апішыце, што вам трэба, і пазначце зручныя даты.',
  sending: 'Адпраўка…',
  sent_title: 'Дзякуй, паведамленне атрымана!',
  sent_text: 'Мы адкажам як мага хутчэй.',
  send_another: 'Адправіць яшчэ адно',
  rehearsal_tip_title: 'Шукаеце рэпетыцыйную залу?',
  rehearsal_tip_text: 'Выберыце вольны час у календары і аплаціце анлайн - без чакання адказу.',
  rehearsal_tip_button: 'Забраніраваць залу',
  map_title: 'Sanctum Sound на Google Maps',
};

const ru: ContactCopy = {
  call: 'Позвонить',
  write_email: 'Написать e-mail',
  instagram: 'Instagram',
  book_online: 'Онлайн-бронирование',
  book_online_value: 'Выбрать время',
  hours_label: 'Часы работы',
  hours_value: 'Ежедневно 9:00–24:00',
  address_label: 'Адрес',
  directions: 'Проложить маршрут',
  email_label: 'E-mail',
  socials_label: 'Мы также здесь',
  google_profile: 'Профиль в Google',
  copy: 'Копировать',
  copied: 'Скопировано',
  form_title: 'Напишите нам',
  form_text: 'Отвечаем как можно скорее - по e-mail или по телефону.',
  topic_label: 'Чего касается сообщение?',
  topics: {
    rehearsal: 'Репетиционный зал',
    recording: 'Запись',
    mixing: 'Сведение и мастеринг',
    rent: 'Аренда оборудования',
    voucher: 'Сертификат',
    other: 'Другое',
  },
  message_placeholder: 'Опишите, что вам нужно, и укажите удобные даты.',
  sending: 'Отправка…',
  sent_title: 'Спасибо, сообщение получено!',
  sent_text: 'Мы ответим как можно скорее.',
  send_another: 'Отправить ещё одно',
  rehearsal_tip_title: 'Ищете репетиционный зал?',
  rehearsal_tip_text: 'Выберите свободное время в календаре и оплатите онлайн - без ожидания ответа.',
  rehearsal_tip_button: 'Забронировать зал',
  map_title: 'Sanctum Sound на Google Maps',
};

export const contactCopy: Record<Language, ContactCopy> = { pl, en, uk, be, ru };

export const useContactCopy = (): ContactCopy => contactCopy[useLanguage().language];
