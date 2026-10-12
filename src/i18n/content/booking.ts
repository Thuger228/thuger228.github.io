// Copy for the /booking/ page: page text (title, H1, intro, sections) and the booking form labels.
// Service names, prices and units come from LanguageContext / extra.ts, like on the /price/ page.

import { useLanguage } from '@/contexts/LanguageContext';
import type { Language } from '@/i18n/config';
import type { PageCopy } from './types';

export interface BookingFormCopy {
  service: string;
  date: string;
  time: string;
  hours: string;
  songs: string;
  name: string;
  email: string;
  phone: string;
  notes: string;
  total: string;
  pay_button: string;
  request_button: string;
  sending: string;
  stripe_note: string; // {n} is replaced with the quantity to set on the Stripe page
  confirm_note: string;
  mixing_note: string;
  error_invalid: string;
  error_send: string;
  request_sent_title: string;
  request_sent_text: string;
  paid_title: string;
  paid_text: string;
  new_booking: string;
  duration: string;
  pick_day: string; // heading above the calendar
  free_times: string; // heading above the time slots
  pick_day_hint: string; // shown in the times column before a day is chosen
  no_slots: string;
  taken: string; // label on a time that's already booked
  back: string;
  your_details: string;
  slot_taken: string;
}

export interface BookingCopy {
  page: PageCopy;
  form: BookingFormCopy;
}

const bookingCopy: Record<Language, BookingCopy> = {
  pl: {
    page: {
      title: 'Rezerwacja online — studio nagrań i sala prób | Sanctum',
      desc: 'Zarezerwuj nagranie (od 120 zł/h), salę prób (od 50 zł/h) albo miks i mastering (od 400 zł) w Sanctum Sound w Warszawie i zapłać online przez Stripe.',
      h1: 'Rezerwacja online',
      intro: 'Wybierz usługę i czas trwania, wskaż wolny termin w kalendarzu, podaj dane kontaktowe i zapłać bezpiecznie online. Po otrzymaniu rezerwacji potwierdzimy termin telefonicznie lub mailowo.',
      sections: [
        {
          h2: 'Jak działa rezerwacja',
          body: ['Wolisz porozmawiać? Zadzwoń pod +48 881 238 684 albo napisz przez formularz kontaktowy.'],
          list: [
            'Wybierz usługę: nagranie, salę prób albo miks i mastering.',
            'Wybierz wolny dzień i godzinę w kalendarzu.',
            'Podaj imię, e-mail i telefon.',
            'Zapłać online przez Stripe. Termin potwierdzimy telefonicznie lub mailowo.',
          ],
        },
      ],
      faq: [],
    },
    form: {
      service: 'Usługa',
      date: 'Data',
      time: 'Godzina rozpoczęcia',
      hours: 'Liczba godzin',
      songs: 'Liczba utworów',
      name: 'Imię i nazwisko',
      email: 'E-mail',
      phone: 'Telefon',
      notes: 'Uwagi (opcjonalnie)',
      total: 'Do zapłaty',
      pay_button: 'Przejdź do płatności',
      request_button: 'Wyślij rezerwację',
      sending: 'Wysyłanie…',
      stripe_note: 'Płatność obsługuje Stripe. Na stronie płatności ustaw ilość na {n}.',
      confirm_note: 'Termin potwierdzimy telefonicznie lub mailowo po otrzymaniu rezerwacji.',
      mixing_note: 'Przy miksie i masteringu nie wybierasz daty: skontaktujemy się, żeby ustalić szczegóły i sposób przesłania plików.',
      error_invalid: 'Uzupełnij wszystkie wymagane pola.',
      error_send: 'Nie udało się wysłać rezerwacji. Spróbuj ponownie albo zadzwoń: +48 881 238 684.',
      request_sent_title: 'Rezerwacja wysłana',
      request_sent_text: 'Dziękujemy! Skontaktujemy się, żeby potwierdzić termin i płatność.',
      paid_title: 'Dziękujemy, płatność przyjęta',
      paid_text: 'Skontaktujemy się telefonicznie lub mailowo, żeby potwierdzić Twoją sesję.',
      new_booking: 'Nowa rezerwacja',
      duration: 'Czas trwania',
      pick_day: 'Wybierz dzień',
      free_times: 'Wolne godziny',
      pick_day_hint: 'Wybierz dzień w kalendarzu, żeby zobaczyć wolne godziny.',
      no_slots: 'Brak wolnych godzin w tym dniu. Wybierz inny dzień.',
      taken: 'zajęte',
      back: 'Wstecz',
      your_details: 'Twoje dane',
      slot_taken: 'Ktoś właśnie zarezerwował ten termin. Wybierz inną godzinę.',
    },
  },

  en: {
    page: {
      title: 'Book Online — Recording Studio Warsaw | Sanctum Sound',
      desc: 'Book recording (from 120 PLN/h), the rehearsal room (from 50 PLN/h) or mixing and mastering (from 400 PLN) at Sanctum Sound in Warsaw and pay online with Stripe.',
      h1: 'Book online',
      intro: 'Choose a service and how long you need, pick a free time in the calendar, add your contact details and pay securely online. Once your booking arrives, we’ll confirm the time by phone or email.',
      sections: [
        {
          h2: 'How booking works',
          body: ['Prefer to talk first? Call +48 881 238 684 or send us a message through the contact form.'],
          list: [
            'Choose a service: recording, the rehearsal room, or mixing and mastering.',
            'Pick a free day and time in the calendar.',
            'Enter your name, email and phone number.',
            'Pay online with Stripe. We’ll confirm the time by phone or email.',
          ],
        },
      ],
      faq: [],
    },
    form: {
      service: 'Service',
      date: 'Date',
      time: 'Start time',
      hours: 'Hours',
      songs: 'Number of songs',
      name: 'Full name',
      email: 'Email',
      phone: 'Phone',
      notes: 'Anything we should know? (optional)',
      total: 'Total',
      pay_button: 'Continue to payment',
      request_button: 'Send booking',
      sending: 'Sending…',
      stripe_note: 'Payment is handled by Stripe. On the payment page, set the quantity to {n}.',
      confirm_note: 'We’ll confirm the time by phone or email once we receive your booking.',
      mixing_note: 'Mixing and mastering doesn’t need a date: we’ll contact you to agree the details and how to send your files.',
      error_invalid: 'Please fill in all required fields.',
      error_send: 'We couldn’t send your booking. Please try again or call +48 881 238 684.',
      request_sent_title: 'Booking sent',
      request_sent_text: 'Thank you! We’ll contact you to confirm the time and payment.',
      paid_title: 'Thank you, payment received',
      paid_text: 'We’ll contact you by phone or email to confirm your session.',
      new_booking: 'New booking',
      duration: 'Duration',
      pick_day: 'Choose a day',
      free_times: 'Available times',
      pick_day_hint: 'Pick a day in the calendar to see available times.',
      no_slots: 'No free times on this day. Please choose another day.',
      taken: 'booked',
      back: 'Back',
      your_details: 'Your details',
      slot_taken: 'Someone has just booked this time. Please choose another one.',
    },
  },

  uk: {
    page: {
      title: 'Онлайн-бронювання — студія звукозапису Sanctum, Варшава',
      desc: 'Забронюйте запис (від 120 zł/год), репетиційну залу (від 50 zł/год) або зведення і мастеринг (від 400 zł) у Sanctum Sound у Варшаві та оплатіть онлайн через Stripe.',
      h1: 'Онлайн-бронювання',
      intro: 'Оберіть послугу й тривалість, виберіть вільний час у календарі, залиште контакти та безпечно оплатіть онлайн. Отримавши бронювання, ми підтвердимо час телефоном або електронною поштою.',
      sections: [
        {
          h2: 'Як працює бронювання',
          body: ['Хочете спершу поговорити? Телефонуйте +48 881 238 684 або напишіть через контактну форму.'],
          list: [
            'Оберіть послугу: запис, репетиційну залу або зведення і мастеринг.',
            'Виберіть вільний день і час у календарі.',
            'Залиште ім’я, e-mail і телефон.',
            'Оплатіть онлайн через Stripe. Час ми підтвердимо телефоном або e-mail.',
          ],
        },
      ],
      faq: [],
    },
    form: {
      service: 'Послуга',
      date: 'Дата',
      time: 'Час початку',
      hours: 'Кількість годин',
      songs: 'Кількість треків',
      name: 'Ім’я та прізвище',
      email: 'E-mail',
      phone: 'Телефон',
      notes: 'Коментар (необов’язково)',
      total: 'До сплати',
      pay_button: 'Перейти до оплати',
      request_button: 'Надіслати бронювання',
      sending: 'Надсилаємо…',
      stripe_note: 'Оплату обробляє Stripe. На сторінці оплати вкажіть кількість {n}.',
      confirm_note: 'Ми підтвердимо час телефоном або e-mail, щойно отримаємо бронювання.',
      mixing_note: 'Для зведення і мастерингу дата не потрібна: ми зв’яжемося, щоб узгодити деталі й спосіб передачі файлів.',
      error_invalid: 'Заповніть усі обов’язкові поля.',
      error_send: 'Не вдалося надіслати бронювання. Спробуйте ще раз або зателефонуйте: +48 881 238 684.',
      request_sent_title: 'Бронювання надіслано',
      request_sent_text: 'Дякуємо! Ми зв’яжемося з вами, щоб підтвердити час і оплату.',
      paid_title: 'Дякуємо, оплату отримано',
      paid_text: 'Ми зв’яжемося телефоном або e-mail, щоб підтвердити вашу сесію.',
      new_booking: 'Нове бронювання',
      duration: 'Тривалість',
      pick_day: 'Оберіть день',
      free_times: 'Вільний час',
      pick_day_hint: 'Оберіть день у календарі, щоб побачити вільний час.',
      no_slots: 'На цей день вільного часу немає. Оберіть інший день.',
      taken: 'зайнято',
      back: 'Назад',
      your_details: 'Ваші дані',
      slot_taken: 'Цей час щойно забронювали. Оберіть інший.',
    },
  },

  be: {
    page: {
      title: 'Анлайн-браніраванне — студыя гуказапісу Sanctum, Варшава',
      desc: 'Забраніруйце запіс (ад 120 zł/гадз), рэпетыцыйную залу (ад 50 zł/гадз) або зводку і мастэрынг (ад 400 zł) у Sanctum Sound у Варшаве і аплаціце анлайн праз Stripe.',
      h1: 'Анлайн-браніраванне',
      intro: 'Выберыце паслугу і працягласць, абярыце вольны час у календары, пакіньце кантакты і бяспечна аплаціце анлайн. Атрымаўшы браніраванне, мы пацвердзім час па тэлефоне або электроннай пошце.',
      sections: [
        {
          h2: 'Як працуе браніраванне',
          body: ['Хочаце спачатку пагаварыць? Тэлефануйце +48 881 238 684 або напішыце праз кантактную форму.'],
          list: [
            'Выберыце паслугу: запіс, рэпетыцыйную залу або зводку і мастэрынг.',
            'Абярыце вольны дзень і час у календары.',
            'Пакіньце імя, e-mail і тэлефон.',
            'Аплаціце анлайн праз Stripe. Час мы пацвердзім па тэлефоне або e-mail.',
          ],
        },
      ],
      faq: [],
    },
    form: {
      service: 'Паслуга',
      date: 'Дата',
      time: 'Час пачатку',
      hours: 'Колькасць гадзін',
      songs: 'Колькасць трэкаў',
      name: 'Імя і прозвішча',
      email: 'E-mail',
      phone: 'Тэлефон',
      notes: 'Каментарый (неабавязкова)',
      total: 'Да аплаты',
      pay_button: 'Перайсці да аплаты',
      request_button: 'Адправіць браніраванне',
      sending: 'Адпраўляем…',
      stripe_note: 'Аплату апрацоўвае Stripe. На старонцы аплаты пазначце колькасць {n}.',
      confirm_note: 'Мы пацвердзім час па тэлефоне або e-mail, як толькі атрымаем браніраванне.',
      mixing_note: 'Для зводкі і мастэрынгу дата не патрэбная: мы звяжамся, каб узгадніць дэталі і спосаб перадачы файлаў.',
      error_invalid: 'Запоўніце ўсе абавязковыя палі.',
      error_send: 'Не атрымалася адправіць браніраванне. Паспрабуйце яшчэ раз або патэлефануйце: +48 881 238 684.',
      request_sent_title: 'Браніраванне адпраўлена',
      request_sent_text: 'Дзякуй! Мы звяжамся з вамі, каб пацвердзіць час і аплату.',
      paid_title: 'Дзякуй, аплата атрымана',
      paid_text: 'Мы звяжамся па тэлефоне або e-mail, каб пацвердзіць вашу сесію.',
      new_booking: 'Новае браніраванне',
      duration: 'Працягласць',
      pick_day: 'Выберыце дзень',
      free_times: 'Вольны час',
      pick_day_hint: 'Выберыце дзень у календары, каб убачыць вольны час.',
      no_slots: 'На гэты дзень вольнага часу няма. Выберыце іншы дзень.',
      taken: 'занята',
      back: 'Назад',
      your_details: 'Вашы даныя',
      slot_taken: 'Гэты час толькі што забраніравалі. Выберыце іншы.',
    },
  },

  ru: {
    page: {
      title: 'Онлайн-бронирование — студия звукозаписи Sanctum, Варшава',
      desc: 'Забронируйте запись (от 120 zł/час), репетиционную комнату (от 50 zł/час) или сведение и мастеринг (от 400 zł) в Sanctum Sound в Варшаве и оплатите онлайн через Stripe.',
      h1: 'Онлайн-бронирование',
      intro: 'Выберите услугу и длительность, выберите свободное время в календаре, оставьте контакты и безопасно оплатите онлайн. Получив бронирование, мы подтвердим время по телефону или электронной почте.',
      sections: [
        {
          h2: 'Как работает бронирование',
          body: ['Хотите сначала поговорить? Звоните +48 881 238 684 или напишите через контактную форму.'],
          list: [
            'Выберите услугу: запись, репетиционную комнату или сведение и мастеринг.',
            'Выберите свободный день и время в календаре.',
            'Оставьте имя, e-mail и телефон.',
            'Оплатите онлайн через Stripe. Время мы подтвердим по телефону или e-mail.',
          ],
        },
      ],
      faq: [],
    },
    form: {
      service: 'Услуга',
      date: 'Дата',
      time: 'Время начала',
      hours: 'Количество часов',
      songs: 'Количество треков',
      name: 'Имя и фамилия',
      email: 'E-mail',
      phone: 'Телефон',
      notes: 'Комментарий (необязательно)',
      total: 'К оплате',
      pay_button: 'Перейти к оплате',
      request_button: 'Отправить бронирование',
      sending: 'Отправляем…',
      stripe_note: 'Оплату обрабатывает Stripe. На странице оплаты укажите количество {n}.',
      confirm_note: 'Мы подтвердим время по телефону или e-mail, как только получим бронирование.',
      mixing_note: 'Для сведения и мастеринга дата не нужна: мы свяжемся, чтобы обсудить детали и способ передачи файлов.',
      error_invalid: 'Заполните все обязательные поля.',
      error_send: 'Не удалось отправить бронирование. Попробуйте ещё раз или позвоните: +48 881 238 684.',
      request_sent_title: 'Бронирование отправлено',
      request_sent_text: 'Спасибо! Мы свяжемся с вами, чтобы подтвердить время и оплату.',
      paid_title: 'Спасибо, оплата получена',
      paid_text: 'Мы свяжемся по телефону или e-mail, чтобы подтвердить вашу сессию.',
      new_booking: 'Новое бронирование',
      duration: 'Длительность',
      pick_day: 'Выберите день',
      free_times: 'Свободное время',
      pick_day_hint: 'Выберите день в календаре, чтобы увидеть свободное время.',
      no_slots: 'На этот день свободного времени нет. Выберите другой день.',
      taken: 'занято',
      back: 'Назад',
      your_details: 'Ваши данные',
      slot_taken: 'Это время только что забронировали. Выберите другое.',
    },
  },
};

export const useBookingCopy = (): BookingCopy => bookingCopy[useLanguage().language];
