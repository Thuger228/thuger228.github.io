// Copy for the "buy a voucher" panel on /voucher/: tier names and contents, form labels, payment
// result. Prices come from src/data/vouchers.ts. No em dashes in site copy (studio's rule).

import { useLanguage } from '@/contexts/LanguageContext';
import type { Language } from '@/i18n/config';
import type { VoucherTierId } from '@/data/vouchers';

export interface VoucherShopCopy {
  heading: string;
  intro: string;
  choose: string; // legend above the tier cards
  tiers: Record<VoucherTierId, { name: string; items: string }>;
  any_amount: string; // price line on the gift card tile (the minimum, GIFT_MIN)
  amount: string;
  amount_hint: string; // {min} and {max} are filled in
  your_details: string;
  name: string;
  email: string;
  phone: string;
  recipient: string;
  recipient_hint: string;
  message: string;
  message_hint: string;
  hide_price: string; // checkbox: leave the amount off the PDF voucher
  hide_price_hint: string;
  optional: string;
  total: string;
  pay_button: string;
  sending: string;
  note: string;
  error_invalid: string;
  amount_invalid: string;
  pay_error: string;
  paid_title: string;
  paid_text: string;
  buy_another: string;
  pay_steps: [string, string, string];
}

const pl: VoucherShopCopy = {
  heading: 'Kup voucher online',
  intro: 'Wybierz pakiet i zapłać online. Voucher w PDF przyjdzie na Twój e-mail od razu po płatności, gotowy do wydruku lub przesłania dalej.',
  choose: 'Wybierz pakiet',
  tiers: {
    start: { name: 'Start', items: '2 godz. nagrania z realizatorem' },
    song: { name: 'Jedna piosenka', items: '2 godz. nagrania, miks i mastering 1 utworu' },
    single: { name: 'Singiel zespołu', items: '5 godz. nagrania, miks i mastering 1 utworu' },
    day: { name: 'Dzień w studiu', items: '8 godz. nagrania, miks i mastering 2 utworów' },
    rehearsal: { name: 'Pakiet prób', items: '10 godz. na sali prób' },
    gift: { name: 'Karta podarunkowa', items: 'Dowolna kwota na wszystkie usługi studia' },
  },
  any_amount: 'od 100 zł',
  amount: 'Kwota vouchera (zł)',
  amount_hint: 'Od {min} do {max} zł.',
  your_details: 'Twoje dane',
  name: 'Imię i nazwisko',
  email: 'E-mail (tu wyślemy voucher)',
  phone: 'Telefon',
  recipient: 'Dla kogo',
  recipient_hint: 'Imię, które wpiszemy na voucher',
  message: 'Dedykacja',
  message_hint: 'Kilka słów od Ciebie, wydrukujemy je na voucherze',
  hide_price: 'Ukryj cenę na voucherze',
  hide_price_hint: 'Dobre na prezent: obdarowany nie zobaczy kwoty.',
  optional: 'opcjonalnie',
  total: 'Do zapłaty',
  pay_button: 'Zapłać',
  sending: 'Chwileczkę...',
  note: 'Bezpieczna płatność Stripe. Voucher jest ważny 3 miesiące, a obdarowany sam ustala z nami termin sesji.',
  error_invalid: 'Uzupełnij imię, e-mail i telefon.',
  amount_invalid: 'Wpisz kwotę od {min} do {max} zł.',
  pay_error: 'Nie udało się otworzyć płatności. Nic nie zostało pobrane, spróbuj ponownie za chwilę.',
  paid_title: 'Dziękujemy! Voucher jest w drodze',
  paid_text: 'Wysłaliśmy voucher w PDF na Twój e-mail. Jeśli nie widzisz go w ciągu kilku minut, zajrzyj do spamu albo zadzwoń: +48 881 238 684.',
  buy_another: 'Kup kolejny voucher',
  pay_steps: ['Tworzymy Twój voucher', 'Przygotowujemy płatność', 'Otwieramy stronę płatności Stripe'],
};

const en: VoucherShopCopy = {
  heading: 'Buy a voucher online',
  intro: 'Pick a package and pay online. The voucher arrives in your inbox as a PDF right after payment, ready to print or forward.',
  choose: 'Choose a package',
  tiers: {
    start: { name: 'Start', items: '2 h of recording with a sound engineer' },
    song: { name: 'One song', items: '2 h of recording, mixing and mastering of 1 song' },
    single: { name: 'Band single', items: '5 h of recording, mixing and mastering of 1 song' },
    day: { name: 'Day in the studio', items: '8 h of recording, mixing and mastering of 2 songs' },
    rehearsal: { name: 'Rehearsal pack', items: '10 h in the rehearsal room' },
    gift: { name: 'Gift card', items: 'Any amount, for any studio service' },
  },
  any_amount: 'from 100 zł',
  amount: 'Voucher amount (zł)',
  amount_hint: 'From {min} to {max} zł.',
  your_details: 'Your details',
  name: 'Full name',
  email: 'Email (we send the voucher here)',
  phone: 'Phone',
  recipient: 'Who is it for',
  recipient_hint: 'The name we print on the voucher',
  message: 'Personal message',
  message_hint: 'A few words from you, printed on the voucher',
  hide_price: 'Hide the price on the voucher',
  hide_price_hint: 'Good for gifts: the recipient won’t see the amount.',
  optional: 'optional',
  total: 'Total',
  pay_button: 'Pay',
  sending: 'One moment...',
  note: 'Secure payment with Stripe. The voucher is valid for 3 months, and the recipient books their session with us.',
  error_invalid: 'Please fill in your name, email and phone.',
  amount_invalid: 'Enter an amount from {min} to {max} zł.',
  pay_error: 'We couldn’t open the payment page. Nothing was charged, please try again in a moment.',
  paid_title: 'Thank you! Your voucher is on its way',
  paid_text: 'We’ve emailed you the voucher as a PDF. If it isn’t there in a few minutes, check your spam folder or call +48 881 238 684.',
  buy_another: 'Buy another voucher',
  pay_steps: ['Creating your voucher', 'Preparing the payment', 'Opening the Stripe payment page'],
};

const uk: VoucherShopCopy = {
  heading: 'Купити сертифікат онлайн',
  intro: 'Оберіть пакет і оплатіть онлайн. Сертифікат у PDF прийде на ваш e-mail одразу після оплати, його можна роздрукувати або переслати.',
  choose: 'Оберіть пакет',
  tiers: {
    start: { name: 'Старт', items: '2 год запису зі звукорежисером' },
    song: { name: 'Одна пісня', items: '2 год запису, зведення і мастеринг 1 пісні' },
    single: { name: 'Сингл гурту', items: '5 год запису, зведення і мастеринг 1 пісні' },
    day: { name: 'День у студії', items: '8 год запису, зведення і мастеринг 2 пісень' },
    rehearsal: { name: 'Пакет репетицій', items: '10 год у репетиційній залі' },
    gift: { name: 'Подарункова картка', items: 'Будь-яка сума на всі послуги студії' },
  },
  any_amount: 'від 100 zł',
  amount: 'Сума сертифіката (zł)',
  amount_hint: 'Від {min} до {max} zł.',
  your_details: 'Ваші дані',
  name: 'Ім’я та прізвище',
  email: 'E-mail (сюди надішлемо сертифікат)',
  phone: 'Телефон',
  recipient: 'Для кого',
  recipient_hint: 'Ім’я, яке впишемо в сертифікат',
  message: 'Побажання',
  message_hint: 'Кілька слів від вас, надрукуємо їх на сертифікаті',
  hide_price: 'Приховати ціну на сертифікаті',
  hide_price_hint: 'Зручно для подарунка: отримувач не побачить суму.',
  optional: 'необов’язково',
  total: 'До сплати',
  pay_button: 'Оплатити',
  sending: 'Хвилинку...',
  note: 'Безпечна оплата через Stripe. Сертифікат дійсний 3 місяці, дату сесії власник узгоджує з нами сам.',
  error_invalid: 'Заповніть ім’я, e-mail і телефон.',
  amount_invalid: 'Вкажіть суму від {min} до {max} zł.',
  pay_error: 'Не вдалося відкрити сторінку оплати. Гроші не списано, спробуйте ще раз за хвилину.',
  paid_title: 'Дякуємо! Сертифікат уже в дорозі',
  paid_text: 'Ми надіслали сертифікат у PDF на ваш e-mail. Якщо за кілька хвилин його немає, перевірте спам або зателефонуйте: +48 881 238 684.',
  buy_another: 'Купити ще один сертифікат',
  pay_steps: ['Створюємо ваш сертифікат', 'Готуємо оплату', 'Відкриваємо сторінку оплати Stripe'],
};

const be: VoucherShopCopy = {
  heading: 'Купіць сертыфікат анлайн',
  intro: 'Выберыце пакет і аплаціце анлайн. Сертыфікат у PDF прыйдзе на ваш e-mail адразу пасля аплаты, яго можна раздрукаваць або пераслаць.',
  choose: 'Выберыце пакет',
  tiers: {
    start: { name: 'Старт', items: '2 гадз запісу з гукарэжысёрам' },
    song: { name: 'Адна песня', items: '2 гадз запісу, зводка і мастэрынг 1 песні' },
    single: { name: 'Сінгл гурта', items: '5 гадз запісу, зводка і мастэрынг 1 песні' },
    day: { name: 'Дзень у студыі', items: '8 гадз запісу, зводка і мастэрынг 2 песень' },
    rehearsal: { name: 'Пакет рэпетыцый', items: '10 гадз у рэпетыцыйнай зале' },
    gift: { name: 'Падарункавая картка', items: 'Любая сума на ўсе паслугі студыі' },
  },
  any_amount: 'ад 100 zł',
  amount: 'Сума сертыфіката (zł)',
  amount_hint: 'Ад {min} да {max} zł.',
  your_details: 'Вашы даныя',
  name: 'Імя і прозвішча',
  email: 'E-mail (сюды дашлём сертыфікат)',
  phone: 'Тэлефон',
  recipient: 'Для каго',
  recipient_hint: 'Імя, якое ўпішам у сертыфікат',
  message: 'Пажаданне',
  message_hint: 'Некалькі слоў ад вас, надрукуем іх на сертыфікаце',
  hide_price: 'Схаваць цану на сертыфікаце',
  hide_price_hint: 'Зручна для падарунка: атрымальнік не ўбачыць суму.',
  optional: 'неабавязкова',
  total: 'Да аплаты',
  pay_button: 'Аплаціць',
  sending: 'Хвілінку...',
  note: 'Бяспечная аплата праз Stripe. Сертыфікат дзейнічае 3 месяцы, дату сесіі ўладальнік узгадняе з намі сам.',
  error_invalid: 'Запоўніце імя, e-mail і тэлефон.',
  amount_invalid: 'Пазначце суму ад {min} да {max} zł.',
  pay_error: 'Не ўдалося адкрыць старонку аплаты. Грошы не спісаны, паспрабуйце яшчэ раз праз хвіліну.',
  paid_title: 'Дзякуй! Сертыфікат ужо ў дарозе',
  paid_text: 'Мы даслалі сертыфікат у PDF на ваш e-mail. Калі праз некалькі хвілін яго няма, праверце спам або патэлефануйце: +48 881 238 684.',
  buy_another: 'Купіць яшчэ адзін сертыфікат',
  pay_steps: ['Ствараем ваш сертыфікат', 'Рыхтуем аплату', 'Адкрываем старонку аплаты Stripe'],
};

const ru: VoucherShopCopy = {
  heading: 'Купить сертификат онлайн',
  intro: 'Выберите пакет и оплатите онлайн. Сертификат в PDF придёт на ваш e-mail сразу после оплаты, его можно распечатать или переслать.',
  choose: 'Выберите пакет',
  tiers: {
    start: { name: 'Старт', items: '2 ч записи со звукорежиссёром' },
    song: { name: 'Одна песня', items: '2 ч записи, сведение и мастеринг 1 песни' },
    single: { name: 'Сингл группы', items: '5 ч записи, сведение и мастеринг 1 песни' },
    day: { name: 'День в студии', items: '8 ч записи, сведение и мастеринг 2 песен' },
    rehearsal: { name: 'Пакет репетиций', items: '10 ч в репетиционной комнате' },
    gift: { name: 'Подарочная карта', items: 'Любая сумма на все услуги студии' },
  },
  any_amount: 'от 100 zł',
  amount: 'Сумма сертификата (zł)',
  amount_hint: 'От {min} до {max} zł.',
  your_details: 'Ваши данные',
  name: 'Имя и фамилия',
  email: 'E-mail (сюда пришлём сертификат)',
  phone: 'Телефон',
  recipient: 'Для кого',
  recipient_hint: 'Имя, которое впишем в сертификат',
  message: 'Пожелание',
  message_hint: 'Несколько слов от вас, напечатаем их на сертификате',
  hide_price: 'Скрыть цену на сертификате',
  hide_price_hint: 'Удобно для подарка: получатель не увидит сумму.',
  optional: 'необязательно',
  total: 'К оплате',
  pay_button: 'Оплатить',
  sending: 'Минутку...',
  note: 'Безопасная оплата через Stripe. Сертификат действует 3 месяца, дату сессии владелец согласует с нами сам.',
  error_invalid: 'Заполните имя, e-mail и телефон.',
  amount_invalid: 'Укажите сумму от {min} до {max} zł.',
  pay_error: 'Не удалось открыть страницу оплаты. Деньги не списаны, попробуйте ещё раз через минуту.',
  paid_title: 'Спасибо! Сертификат уже в пути',
  paid_text: 'Мы отправили сертификат в PDF на ваш e-mail. Если через несколько минут его нет, проверьте спам или позвоните: +48 881 238 684.',
  buy_another: 'Купить ещё один сертификат',
  pay_steps: ['Создаём ваш сертификат', 'Готовим оплату', 'Открываем страницу оплаты Stripe'],
};

export const voucherShopCopy: Record<Language, VoucherShopCopy> = { pl, en, uk, be, ru };

export const useVoucherShopCopy = (): VoucherShopCopy => voucherShopCopy[useLanguage().language];
