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
  // Recording and mixing are requests (no date, no online payment): the studio writes or calls back.
  recording_note: string;
  describe_recording: string;
  describe_recording_hint: string;
  describe_songs: string; // mixing: label of the free-text field about the songs
  describe_songs_hint: string;
  ask_button: string;
  ask_sent_title: string;
  ask_sent_text: string;
  name: string;
  email: string;
  phone: string;
  notes: string;
  total: string;
  pay_button: string;
  extras: string; // rehearsal room extras
  opt_cymbals: string;
  opt_double_pedal: string;
  opt_solo: string;
  request_button: string;
  sending: string;
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
  checking: string; // shown while busy times load
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
      intro: 'Salę prób rezerwujesz od razu: wybierz czas trwania i dodatki, wskaż wolny termin w kalendarzu i zapłać online. Nagranie oraz miks i mastering to krótkie zapytanie: zostaw kontakt, a odpiszemy lub oddzwonimy, żeby ustalić szczegóły.',
      sections: [
        {
          h2: 'Jak działa rezerwacja',
          body: ['Wolisz porozmawiać? Zadzwoń pod +48 881 238 684 albo napisz przez formularz kontaktowy.'],
          list: [
            'Sala prób: wybierz czas trwania (1–4 h) i dodatki.',
            'Wskaż wolny dzień i godzinę w kalendarzu.',
            'Podaj imię, e-mail i telefon, a potem zapłać online przez Stripe.',
            'Nagranie, miks i mastering: wyślij zapytanie, a odpiszemy lub oddzwonimy.',
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
      recording_note: 'Zostaw kontakt, a odpiszemy lub oddzwonimy, żeby ustalić termin i szczegóły. Śmiało opisz, co chcesz nagrać.',
      describe_recording: 'Co chcesz nagrać (opcjonalnie)',
      describe_recording_hint: 'Ile utworów, solo czy zespół, gatunek, pasujące dni…',
      describe_songs: 'Twoje utwory (opcjonalnie)',
      describe_songs_hint: 'Ile utworów, gatunek, linki do demo, czego oczekujesz…',
      ask_button: 'Wyślij zapytanie',
      ask_sent_title: 'Zapytanie wysłane',
      ask_sent_text: 'Dziękujemy! Odpiszemy lub oddzwonimy, żeby omówić szczegóły.',
      name: 'Imię i nazwisko',
      email: 'E-mail',
      phone: 'Telefon',
      notes: 'Uwagi (opcjonalnie)',
      total: 'Do zapłaty',
      pay_button: 'Przejdź do płatności',
      extras: 'Dodatki',
      opt_cymbals: 'Zestaw talerzy',
      opt_double_pedal: 'Podwójna stopa',
      opt_solo: 'Tylko perkusja lub tylko wokal',
      request_button: 'Wyślij rezerwację',
      sending: 'Wysyłanie…',
      confirm_note: 'Termin potwierdzimy telefonicznie lub mailowo po otrzymaniu rezerwacji.',
      mixing_note: 'Zostaw kontakt, a odpiszemy lub oddzwonimy, żeby omówić szczegóły. Śmiało opisz swoje utwory.',
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
      checking: 'Sprawdzam wolne terminy…',
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
      intro: 'Book the rehearsal room straight away: choose how long and any extras, pick a free time in the calendar and pay online. For recording or mixing and mastering, send a short request and we’ll write or call you back to agree the details.',
      sections: [
        {
          h2: 'How booking works',
          body: ['Prefer to talk first? Call +48 881 238 684 or send us a message through the contact form.'],
          list: [
            'Rehearsal room: choose how long (1–4 h) and any extras.',
            'Pick a free day and time in the calendar.',
            'Enter your name, email and phone number, then pay online with Stripe.',
            'Recording, mixing and mastering: send a request and we’ll write or call you back.',
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
      recording_note: 'Leave your details and we’ll write or call you back to agree the date and details. Feel free to describe what you want to record.',
      describe_recording: 'What you want to record (optional)',
      describe_recording_hint: 'How many songs, solo or band, genre, days that suit you…',
      describe_songs: 'About your songs (optional)',
      describe_songs_hint: 'How many songs, genre, demo links, what you’re after…',
      ask_button: 'Send request',
      ask_sent_title: 'Request sent',
      ask_sent_text: 'Thank you! We’ll write or call you back to talk it through.',
      name: 'Full name',
      email: 'Email',
      phone: 'Phone',
      notes: 'Anything we should know? (optional)',
      total: 'Total',
      pay_button: 'Continue to payment',
      extras: 'Extras',
      opt_cymbals: 'Cymbal set',
      opt_double_pedal: 'Double bass drum pedal',
      opt_solo: 'Drums or vocals only',
      request_button: 'Send booking',
      sending: 'Sending…',
      confirm_note: 'We’ll confirm the time by phone or email once we receive your booking.',
      mixing_note: 'Leave your details and we’ll write or call you back to talk it through. Feel free to describe your songs.',
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
      checking: 'Checking free times…',
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
      intro: 'Репетиційну залу можна забронювати одразу: оберіть тривалість і додатки, виберіть вільний час у календарі та оплатіть онлайн. Для запису або зведення і мастерингу надішліть короткий запит, і ми напишемо або зателефонуємо, щоб узгодити деталі.',
      sections: [
        {
          h2: 'Як працює бронювання',
          body: ['Хочете спершу поговорити? Телефонуйте +48 881 238 684 або напишіть через контактну форму.'],
          list: [
            'Репетиційна зала: оберіть тривалість (1–4 год) і додатки.',
            'Виберіть вільний день і час у календарі.',
            'Залиште ім’я, e-mail і телефон та оплатіть онлайн через Stripe.',
            'Запис, зведення і мастеринг: надішліть запит, і ми напишемо або зателефонуємо.',
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
      recording_note: 'Залиште контакти, і ми напишемо або передзвонимо, щоб узгодити дату й деталі. Сміливо опишіть, що хочете записати.',
      describe_recording: 'Що хочете записати (необов’язково)',
      describe_recording_hint: 'Скільки треків, соло чи гурт, жанр, зручні дні…',
      describe_songs: 'Про ваші треки (необов’язково)',
      describe_songs_hint: 'Скільки треків, жанр, посилання на демо, чого очікуєте…',
      ask_button: 'Надіслати запит',
      ask_sent_title: 'Запит надіслано',
      ask_sent_text: 'Дякуємо! Ми напишемо або передзвонимо, щоб обговорити деталі.',
      name: 'Ім’я та прізвище',
      email: 'E-mail',
      phone: 'Телефон',
      notes: 'Коментар (необов’язково)',
      total: 'До сплати',
      pay_button: 'Перейти до оплати',
      extras: 'Додатково',
      opt_cymbals: 'Комплект тарілок',
      opt_double_pedal: 'Подвійна педаль',
      opt_solo: 'Тільки барабани або тільки вокал',
      request_button: 'Надіслати бронювання',
      sending: 'Надсилаємо…',
      confirm_note: 'Ми підтвердимо час телефоном або e-mail, щойно отримаємо бронювання.',
      mixing_note: 'Залиште контакти, і ми напишемо або передзвонимо, щоб обговорити деталі. Сміливо опишіть свої треки.',
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
      checking: 'Перевіряємо вільний час…',
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
      intro: 'Рэпетыцыйную залу можна забраніраваць адразу: выберыце працягласць і дадаткі, абярыце вольны час у календары і аплаціце анлайн. Для запісу або зводкі і мастэрынгу дашліце кароткі запыт, і мы напішам або патэлефануем, каб узгадніць дэталі.',
      sections: [
        {
          h2: 'Як працуе браніраванне',
          body: ['Хочаце спачатку пагаварыць? Тэлефануйце +48 881 238 684 або напішыце праз кантактную форму.'],
          list: [
            'Рэпетыцыйная зала: выберыце працягласць (1–4 гадз) і дадаткі.',
            'Абярыце вольны дзень і час у календары.',
            'Пакіньце імя, e-mail і тэлефон і аплаціце анлайн праз Stripe.',
            'Запіс, зводка і мастэрынг: дашліце запыт, і мы напішам або патэлефануем.',
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
      recording_note: 'Пакіньце кантакты, і мы напішам або ператэлефануем, каб узгадніць дату і дэталі. Смела апішыце, што хочаце запісаць.',
      describe_recording: 'Што хочаце запісаць (неабавязкова)',
      describe_recording_hint: 'Колькі трэкаў, сола ці гурт, жанр, зручныя дні…',
      describe_songs: 'Пра вашы трэкі (неабавязкова)',
      describe_songs_hint: 'Колькі трэкаў, жанр, спасылкі на дэма, чаго чакаеце…',
      ask_button: 'Адправіць запыт',
      ask_sent_title: 'Запыт адпраўлены',
      ask_sent_text: 'Дзякуй! Мы напішам або ператэлефануем, каб абмеркаваць дэталі.',
      name: 'Імя і прозвішча',
      email: 'E-mail',
      phone: 'Тэлефон',
      notes: 'Каментарый (неабавязкова)',
      total: 'Да аплаты',
      pay_button: 'Перайсці да аплаты',
      extras: 'Дадаткова',
      opt_cymbals: 'Камплект талерак',
      opt_double_pedal: 'Падвойная педаль',
      opt_solo: 'Толькі барабаны або толькі вакал',
      request_button: 'Адправіць браніраванне',
      sending: 'Адпраўляем…',
      confirm_note: 'Мы пацвердзім час па тэлефоне або e-mail, як толькі атрымаем браніраванне.',
      mixing_note: 'Пакіньце кантакты, і мы напішам або ператэлефануем, каб абмеркаваць дэталі. Смела апішыце свае трэкі.',
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
      checking: 'Правяраем вольны час…',
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
      intro: 'Репетиционную комнату можно забронировать сразу: выберите длительность и дополнения, укажите свободное время в календаре и оплатите онлайн. Для записи или сведения и мастеринга отправьте короткий запрос, и мы напишем или перезвоним, чтобы согласовать детали.',
      sections: [
        {
          h2: 'Как работает бронирование',
          body: ['Хотите сначала поговорить? Звоните +48 881 238 684 или напишите через контактную форму.'],
          list: [
            'Репетиционная комната: выберите длительность (1–4 ч) и дополнения.',
            'Выберите свободный день и время в календаре.',
            'Оставьте имя, e-mail и телефон и оплатите онлайн через Stripe.',
            'Запись, сведение и мастеринг: отправьте запрос, и мы напишем или перезвоним.',
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
      recording_note: 'Оставьте контакты, и мы напишем или перезвоним, чтобы согласовать дату и детали. Смело опишите, что хотите записать.',
      describe_recording: 'Что хотите записать (необязательно)',
      describe_recording_hint: 'Сколько треков, соло или группа, жанр, удобные дни…',
      describe_songs: 'О ваших треках (необязательно)',
      describe_songs_hint: 'Сколько треков, жанр, ссылки на демо, чего ожидаете…',
      ask_button: 'Отправить запрос',
      ask_sent_title: 'Запрос отправлен',
      ask_sent_text: 'Спасибо! Мы напишем или перезвоним, чтобы обсудить детали.',
      name: 'Имя и фамилия',
      email: 'E-mail',
      phone: 'Телефон',
      notes: 'Комментарий (необязательно)',
      total: 'К оплате',
      pay_button: 'Перейти к оплате',
      extras: 'Дополнительно',
      opt_cymbals: 'Комплект тарелок',
      opt_double_pedal: 'Двойная педаль',
      opt_solo: 'Только барабаны или только вокал',
      request_button: 'Отправить бронирование',
      sending: 'Отправляем…',
      confirm_note: 'Мы подтвердим время по телефону или e-mail, как только получим бронирование.',
      mixing_note: 'Оставьте контакты, и мы напишем или перезвоним, чтобы обсудить детали. Смело опишите свои треки.',
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
      checking: 'Проверяем свободное время…',
      no_slots: 'На этот день свободного времени нет. Выберите другой день.',
      taken: 'занято',
      back: 'Назад',
      your_details: 'Ваши данные',
      slot_taken: 'Это время только что забронировали. Выберите другое.',
    },
  },
};

export const useBookingCopy = (): BookingCopy => bookingCopy[useLanguage().language];
