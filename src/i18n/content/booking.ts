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
  hour_short: string; // unit on the duration buttons, e.g. "2 godz."
  // Mixing is a request (no date, no online payment): the studio writes or calls back. Recording is booked
  // in the calendar and paid online like the rehearsal room (recording_note is no longer shown).
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
  drums_min: string; // recording: shown under the durations when drums are ticked (min 2 h)
  what_record: string; // recording: heading above the vocals / drums / guitars ticks
  opt_vocals: string;
  opt_drums: string;
  opt_guitars: string;
  opt_bass: string;
  opt_keys: string;
  opt_other: string;
  request_button: string;
  sending: string;
  confirm_note: string;
  mixing_note: string;
  error_invalid: string;
  error_send: string;
  pay_error: string; // the Stripe payment page couldn't be opened
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
      title: 'Rezerwacja online - sala prób i studio nagrań Warszawa',
      desc: 'Rezerwacja sali prób i nagrania online w Warszawie: wolny termin w kalendarzu, płatność przez Stripe, sala prób od 50 zł/godz., nagranie 120 zł/godz., codziennie 9-24.',
      h1: 'Rezerwacja online',
      intro: 'Salę prób i nagranie rezerwujesz od razu: wybierz czas trwania, wskaż wolny termin w kalendarzu i zapłać online. Miks i mastering to krótkie zapytanie: zostaw kontakt, a odpiszemy lub oddzwonimy, żeby ustalić szczegóły.',
      sections: [
        {
          h2: 'Jak działa rezerwacja',
          body: ['Wolisz porozmawiać? Zadzwoń pod +48 881 238 684 albo napisz przez formularz kontaktowy.'],
          list: [
            'Sala prób: wybierz czas trwania (1-4 godz.) i dodatki. Nagranie: wybierz od 1 do 8 godz.',
            'Wskaż wolny dzień i godzinę w kalendarzu.',
            'Podaj imię, e-mail i telefon, a potem zapłać online przez Stripe.',
            'Miks i mastering: wyślij zapytanie, a odpiszemy lub oddzwonimy.',
          ],
        },
      ],
      faq: [
        {
          q: 'Czy za każdą usługę płacę online?',
          a: 'Nie. Online płacisz za salę prób i nagranie. Miks i mastering to zapytanie bez płatności: odpiszemy lub oddzwonimy, żeby ustalić szczegóły.',
        },
        {
          q: 'Ile kosztuje nagranie i jak je zarezerwować?',
          a: 'Nagranie z realizatorem kosztuje 120 zł za godzinę. Wybierasz od 1 do 8 godzin, wolny termin w kalendarzu i płacisz online.',
        },
        {
          q: 'W jakich godzinach można zarezerwować salę prób?',
          a: 'Codziennie od 9:00 do 24:00. Próba trwa od 1 do 4 godzin i musi zaczynać się co najmniej 4 godziny od chwili rezerwacji.',
        },
        {
          q: 'Ile kosztuje sala prób?',
          a: 'Od 50 zł za godzinę dla samej perkusji lub wokalu i 60 zł za godzinę dla pełnego składu. Zestaw talerzy to +10 zł, a podwójna stopa +5 zł za całą próbę.',
        },
        {
          q: 'Jak dostanę potwierdzenie rezerwacji?',
          a: 'Zaraz po płatności przychodzi e-mail z potwierdzeniem i zaproszeniem do kalendarza.',
        },
      ],
    },
    form: {
      service: 'Usługa',
      date: 'Data',
      time: 'Godzina rozpoczęcia',
      hours: 'Liczba godzin',
      hour_short: 'godz.',
      recording_note: 'Zostaw kontakt, a odpiszemy lub oddzwonimy, żeby ustalić termin i szczegóły. Śmiało opisz, co chcesz nagrać.',
      describe_recording: 'Co chcesz nagrać (opcjonalnie)',
      describe_recording_hint: 'Ile utworów, solo czy zespół, gatunek, własny bit lub podkład…',
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
      what_record: 'Co nagrywamy',
      drums_min: 'Nagranie perkusji trwa minimum 2 godz.',
      opt_vocals: 'Wokal',
      opt_drums: 'Perkusja',
      opt_guitars: 'Gitary',
      opt_bass: 'Bas',
      opt_keys: 'Klawisze',
      opt_other: 'Inne',
      request_button: 'Wyślij rezerwację',
      sending: 'Wysyłanie…',
      confirm_note: 'Termin potwierdzimy telefonicznie lub mailowo po otrzymaniu rezerwacji.',
      mixing_note: 'Zostaw kontakt, a odpiszemy lub oddzwonimy, żeby omówić szczegóły. Śmiało opisz swoje utwory.',
      error_invalid: 'Uzupełnij wszystkie wymagane pola.',
      error_send: 'Nie udało się wysłać rezerwacji. Spróbuj ponownie albo zadzwoń: +48 881 238 684.',
      pay_error: 'Nie udało się otworzyć płatności, nic nie zostało zarezerwowane ani pobrane. Spróbuj ponownie za chwilę albo zadzwoń: +48 881 238 684.',
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
      title: 'Book Online - Rehearsal Room & Recording Studio Warsaw',
      desc: 'Book the Sanctum Sound rehearsal room or a recording session in Warsaw online: pick a free slot, pay with Stripe, rehearsals from 50 PLN/h, recording 120 PLN/h, daily 9-24.',
      h1: 'Book online',
      intro: 'Book the rehearsal room or a recording session straight away: choose how long, pick a free time in the calendar and pay online. For mixing and mastering, send a short request and we’ll write or call you back to agree the details.',
      sections: [
        {
          h2: 'How booking works',
          body: ['Prefer to talk first? Call +48 881 238 684 or send us a message through the contact form.'],
          list: [
            'Rehearsal room: choose how long (1-4 h) and any extras. Recording: choose 1 to 8 h.',
            'Pick a free day and time in the calendar.',
            'Enter your name, email and phone number, then pay online with Stripe.',
            'Mixing and mastering: send a request and we’ll write or call you back.',
          ],
        },
      ],
      faq: [
        {
          q: 'Do I pay online for every service?',
          a: 'No. The rehearsal room and recording are paid online. Mixing and mastering is a request with no payment: we’ll write or call you back to agree the details.',
        },
        {
          q: 'How much is recording and how do I book it?',
          a: 'Recording with a sound engineer is 120 PLN per hour. Choose 1 to 8 hours, pick a free time in the calendar and pay online.',
        },
        {
          q: 'When can I book the rehearsal room?',
          a: 'Every day from 9:00 to 24:00. A session lasts 1 to 4 hours and has to start at least 4 hours after you book.',
        },
        {
          q: 'How much is the rehearsal room?',
          a: 'From 50 PLN per hour for drums or vocals only, and 60 PLN per hour for a full band. A cymbal set is +10 PLN and a double bass drum pedal +5 PLN per session.',
        },
        {
          q: 'How do I get a confirmation?',
          a: 'Right after payment you get an email with the confirmation and a calendar invite.',
        },
      ],
    },
    form: {
      service: 'Service',
      date: 'Date',
      time: 'Start time',
      hours: 'Hours',
      hour_short: 'h',
      recording_note: 'Leave your details and we’ll write or call you back to agree the date and details. Feel free to describe what you want to record.',
      describe_recording: 'What you want to record (optional)',
      describe_recording_hint: 'How many songs, solo or band, genre, your own beat or backing track…',
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
      what_record: 'What we’re recording',
      drums_min: 'Recording drums takes at least 2 h.',
      opt_vocals: 'Vocals',
      opt_drums: 'Drums',
      opt_guitars: 'Guitars',
      opt_bass: 'Bass',
      opt_keys: 'Keys',
      opt_other: 'Other',
      request_button: 'Send booking',
      sending: 'Sending…',
      confirm_note: 'We’ll confirm the time by phone or email once we receive your booking.',
      mixing_note: 'Leave your details and we’ll write or call you back to talk it through. Feel free to describe your songs.',
      error_invalid: 'Please fill in all required fields.',
      error_send: 'We couldn’t send your booking. Please try again or call +48 881 238 684.',
      pay_error: 'We couldn’t open the payment page, so nothing was booked or charged. Please try again in a moment or call +48 881 238 684.',
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
      title: 'Онлайн-бронювання - студія звукозапису Sanctum, Варшава',
      desc: 'Онлайн-бронювання репетиційної зали та запису у Варшаві: вільний час у календарі, оплата через Stripe, зала від 50 zł/год, запис 120 zł/год, щодня 9-24.',
      h1: 'Онлайн-бронювання',
      intro: 'Репетиційну залу і запис можна забронювати одразу: оберіть тривалість, виберіть вільний час у календарі та оплатіть онлайн. Для зведення і мастерингу надішліть короткий запит, і ми напишемо або зателефонуємо, щоб узгодити деталі.',
      sections: [
        {
          h2: 'Як працює бронювання',
          body: ['Хочете спершу поговорити? Телефонуйте +48 881 238 684 або напишіть через контактну форму.'],
          list: [
            'Репетиційна зала: оберіть тривалість (1-4 год) і додатки. Запис: від 1 до 8 год.',
            'Виберіть вільний день і час у календарі.',
            'Залиште ім’я, e-mail і телефон та оплатіть онлайн через Stripe.',
            'Зведення і мастеринг: надішліть запит, і ми напишемо або зателефонуємо.',
          ],
        },
      ],
      faq: [
        {
          q: 'Чи потрібно платити онлайн за кожну послугу?',
          a: 'Ні. Онлайн оплачуються репетиційна зала і запис. Зведення з мастерингом - це запит без оплати: ми напишемо або зателефонуємо, щоб узгодити деталі.',
        },
        {
          q: 'Скільки коштує запис і як його забронювати?',
          a: 'Запис зі звукорежисером коштує 120 zł за годину. Оберіть від 1 до 8 год, вільний час у календарі та оплатіть онлайн.',
        },
        {
          q: 'Коли можна забронювати репетиційну залу?',
          a: 'Щодня з 9:00 до 24:00. Репетиція триває від 1 до 4 год і має починатися щонайменше через 4 години після бронювання.',
        },
        {
          q: 'Скільки коштує репетиційна зала?',
          a: 'Від 50 zł за годину лише для барабанів або вокалу і 60 zł за годину для повного складу. Комплект тарілок +10 zł, подвійна педаль +5 zł за всю репетицію.',
        },
        {
          q: 'Як я отримаю підтвердження?',
          a: 'Одразу після оплати ви отримаєте e-mail з підтвердженням і запрошенням у календар.',
        },
      ],
    },
    form: {
      service: 'Послуга',
      date: 'Дата',
      time: 'Час початку',
      hours: 'Кількість годин',
      hour_short: 'год',
      recording_note: 'Залиште контакти, і ми напишемо або передзвонимо, щоб узгодити дату й деталі. Сміливо опишіть, що хочете записати.',
      describe_recording: 'Що хочете записати (необов’язково)',
      describe_recording_hint: 'Скільки треків, соло чи гурт, жанр, свій біт або мінус…',
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
      what_record: 'Що записуємо',
      drums_min: 'Запис барабанів триває щонайменше 2 год.',
      opt_vocals: 'Вокал',
      opt_drums: 'Барабани',
      opt_guitars: 'Гітари',
      opt_bass: 'Бас',
      opt_keys: 'Клавішні',
      opt_other: 'Інше',
      request_button: 'Надіслати бронювання',
      sending: 'Надсилаємо…',
      confirm_note: 'Ми підтвердимо час телефоном або e-mail, щойно отримаємо бронювання.',
      mixing_note: 'Залиште контакти, і ми напишемо або передзвонимо, щоб обговорити деталі. Сміливо опишіть свої треки.',
      error_invalid: 'Заповніть усі обов’язкові поля.',
      error_send: 'Не вдалося надіслати бронювання. Спробуйте ще раз або зателефонуйте: +48 881 238 684.',
      pay_error: 'Не вдалося відкрити сторінку оплати, нічого не заброньовано і не списано. Спробуйте ще раз за хвилину або зателефонуйте: +48 881 238 684.',
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
      title: 'Анлайн-браніраванне - студыя гуказапісу Sanctum, Варшава',
      desc: 'Анлайн-браніраванне рэпетыцыйнай залы і запісу ў Варшаве: вольны час у календары, аплата праз Stripe, зала ад 50 zł/гадз, запіс 120 zł/гадз, штодня 9-24.',
      h1: 'Анлайн-браніраванне',
      intro: 'Рэпетыцыйную залу і запіс можна забраніраваць адразу: выберыце працягласць, абярыце вольны час у календары і аплаціце анлайн. Для зводкі і мастэрынгу дашліце кароткі запыт, і мы напішам або патэлефануем, каб узгадніць дэталі.',
      sections: [
        {
          h2: 'Як працуе браніраванне',
          body: ['Хочаце спачатку пагаварыць? Тэлефануйце +48 881 238 684 або напішыце праз кантактную форму.'],
          list: [
            'Рэпетыцыйная зала: выберыце працягласць (1-4 гадз) і дадаткі. Запіс: ад 1 да 8 гадз.',
            'Абярыце вольны дзень і час у календары.',
            'Пакіньце імя, e-mail і тэлефон і аплаціце анлайн праз Stripe.',
            'Зводка і мастэрынг: дашліце запыт, і мы напішам або патэлефануем.',
          ],
        },
      ],
      faq: [
        {
          q: 'Ці трэба плаціць анлайн за кожную паслугу?',
          a: 'Не. Анлайн аплачваюцца рэпетыцыйная зала і запіс. Зводка з мастэрынгам - гэта запыт без аплаты: мы напішам або патэлефануем, каб узгадніць дэталі.',
        },
        {
          q: 'Колькі каштуе запіс і як яго забраніраваць?',
          a: 'Запіс з гукарэжысёрам каштуе 120 zł за гадзіну. Выберыце ад 1 да 8 гадз, вольны час у календары і аплаціце анлайн.',
        },
        {
          q: 'Калі можна забраніраваць рэпетыцыйную залу?',
          a: 'Штодня з 9:00 да 24:00. Рэпетыцыя доўжыцца ад 1 да 4 гадз і павінна пачынацца не раней чым праз 4 гадзіны пасля браніравання.',
        },
        {
          q: 'Колькі каштуе рэпетыцыйная зала?',
          a: 'Ад 50 zł за гадзіну толькі для ўдарных або вакалу і 60 zł за гадзіну для поўнага складу. Камплект талерак +10 zł, падвойная педаль +5 zł за ўсю рэпетыцыю.',
        },
        {
          q: 'Як я атрымаю пацвярджэнне?',
          a: 'Адразу пасля аплаты вы атрымаеце e-mail з пацвярджэннем і запрашэннем у каляндар.',
        },
      ],
    },
    form: {
      service: 'Паслуга',
      date: 'Дата',
      time: 'Час пачатку',
      hours: 'Колькасць гадзін',
      hour_short: 'гадз',
      recording_note: 'Пакіньце кантакты, і мы напішам або ператэлефануем, каб узгадніць дату і дэталі. Смела апішыце, што хочаце запісаць.',
      describe_recording: 'Што хочаце запісаць (неабавязкова)',
      describe_recording_hint: 'Колькі трэкаў, сола ці гурт, жанр, свой біт або мінус…',
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
      what_record: 'Што запісваем',
      drums_min: 'Запіс барабанаў доўжыцца не менш за 2 гадз.',
      opt_vocals: 'Вакал',
      opt_drums: 'Барабаны',
      opt_guitars: 'Гітары',
      opt_bass: 'Бас',
      opt_keys: 'Клавішныя',
      opt_other: 'Іншае',
      request_button: 'Адправіць браніраванне',
      sending: 'Адпраўляем…',
      confirm_note: 'Мы пацвердзім час па тэлефоне або e-mail, як толькі атрымаем браніраванне.',
      mixing_note: 'Пакіньце кантакты, і мы напішам або ператэлефануем, каб абмеркаваць дэталі. Смела апішыце свае трэкі.',
      error_invalid: 'Запоўніце ўсе абавязковыя палі.',
      error_send: 'Не атрымалася адправіць браніраванне. Паспрабуйце яшчэ раз або патэлефануйце: +48 881 238 684.',
      pay_error: 'Не атрымалася адкрыць старонку аплаты, нічога не забраніравана і не спісана. Паспрабуйце яшчэ раз праз хвіліну або патэлефануйце: +48 881 238 684.',
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
      title: 'Онлайн-бронирование - студия звукозаписи Sanctum, Варшава',
      desc: 'Онлайн-бронирование репетиционной комнаты и записи в Варшаве: свободное время, оплата через Stripe, комната от 50 zł/час, запись 120 zł/час, ежедневно 9-24.',
      h1: 'Онлайн-бронирование',
      intro: 'Репетиционную комнату и запись можно забронировать сразу: выберите длительность, укажите свободное время в календаре и оплатите онлайн. Для сведения и мастеринга отправьте короткий запрос, и мы напишем или перезвоним, чтобы согласовать детали.',
      sections: [
        {
          h2: 'Как работает бронирование',
          body: ['Хотите сначала поговорить? Звоните +48 881 238 684 или напишите через контактную форму.'],
          list: [
            'Репетиционная комната: выберите длительность (1-4 ч) и дополнения. Запись: от 1 до 8 ч.',
            'Выберите свободный день и время в календаре.',
            'Оставьте имя, e-mail и телефон и оплатите онлайн через Stripe.',
            'Сведение и мастеринг: отправьте запрос, и мы напишем или перезвоним.',
          ],
        },
      ],
      faq: [
        {
          q: 'Нужно ли платить онлайн за каждую услугу?',
          a: 'Нет. Онлайн оплачиваются репетиционная комната и запись. Сведение с мастерингом - это запрос без оплаты: мы напишем или перезвоним, чтобы согласовать детали.',
        },
        {
          q: 'Сколько стоит запись и как её забронировать?',
          a: 'Запись со звукорежиссёром стоит 120 zł в час. Выберите от 1 до 8 ч, свободное время в календаре и оплатите онлайн.',
        },
        {
          q: 'Когда можно забронировать репетиционную комнату?',
          a: 'Ежедневно с 9:00 до 24:00. Репетиция длится от 1 до 4 ч и должна начинаться не раньше чем через 4 часа после бронирования.',
        },
        {
          q: 'Сколько стоит репетиционная комната?',
          a: 'От 50 zł в час только для барабанов или вокала и 60 zł в час для полного состава. Комплект тарелок +10 zł, двойная педаль +5 zł за всю репетицию.',
        },
        {
          q: 'Как я получу подтверждение?',
          a: 'Сразу после оплаты придёт e-mail с подтверждением и приглашением в календарь.',
        },
      ],
    },
    form: {
      service: 'Услуга',
      date: 'Дата',
      time: 'Время начала',
      hours: 'Количество часов',
      hour_short: 'ч',
      recording_note: 'Оставьте контакты, и мы напишем или перезвоним, чтобы согласовать дату и детали. Смело опишите, что хотите записать.',
      describe_recording: 'Что хотите записать (необязательно)',
      describe_recording_hint: 'Сколько треков, соло или группа, жанр, свой бит или минус…',
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
      what_record: 'Что записываем',
      drums_min: 'Запись барабанов длится минимум 2 ч.',
      opt_vocals: 'Вокал',
      opt_drums: 'Барабаны',
      opt_guitars: 'Гитары',
      opt_bass: 'Бас',
      opt_keys: 'Клавишные',
      opt_other: 'Другое',
      request_button: 'Отправить бронирование',
      sending: 'Отправляем…',
      confirm_note: 'Мы подтвердим время по телефону или e-mail, как только получим бронирование.',
      mixing_note: 'Оставьте контакты, и мы напишем или перезвоним, чтобы обсудить детали. Смело опишите свои треки.',
      error_invalid: 'Заполните все обязательные поля.',
      error_send: 'Не удалось отправить бронирование. Попробуйте ещё раз или позвоните: +48 881 238 684.',
      pay_error: 'Не удалось открыть страницу оплаты, ничего не забронировано и не списано. Попробуйте ещё раз через минуту или позвоните: +48 881 238 684.',
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
