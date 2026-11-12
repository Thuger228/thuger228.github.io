/**
 * Sanctum Sound booking backend: Google Apps Script running in the studio's Google account.
 *
 * The studio's Google Calendar is the booking database:
 *   - the booking page reads busy times from it (event titles never leave this script),
 *   - every booking made on the site becomes a calendar event,
 *   - rehearsal room and recording bookings get a Stripe Checkout for the exact amount, created here,
 *   - Stripe payments are confirmed by asking Stripe directly, then the event is marked paid and the
 *     customer gets a confirmation email with a calendar invite (in the language they booked in).
 *   - gift vouchers from /voucher/ are paid the same way; they're listed in a Google Sheet in this
 *     account ("Sanctum Sound - vouchery") and the buyer gets the voucher as a PDF by email.
 * Anything you put in the calendar yourself (a session booked by phone, a day off) blocks those times.
 *
 * Script properties (Project Settings → Script properties):
 *   STRIPE_SECRET_KEY  a Stripe *restricted* key with "Checkout Sessions: Write" only (rk_live_...)
 *   CALENDAR_ID        optional; the calendar to use. Default: this account's main calendar.
 *   TELEGRAM_BOT_TOKEN optional; a Telegram bot (from @BotFather) that posts every booking, payment
 *                      and request to the studio's chat. See TELEGRAM-SETUP.md.
 *   TELEGRAM_CHAT_ID   the chat it posts to (several chats: separate them with commas).
 *   VOUCHER_SHEET_ID   set by the script itself when it makes the voucher list (setup() or the first sale).
 *
 * Setup: paste this file, set the properties, run setup() once, then Deploy → New deployment →
 * Web app (Execute as: Me, Who has access: Anyone). See STRIPE-SETUP.md for the full steps.
 */

const TZ = 'Europe/Warsaw';
const MIN_NOTICE_MINUTES = 240; // a booking must start at least 4 hours from now (same as the site)
const MAX_HOURS = { rehearsal: 4, recording: 8 }; // longest booking per service (maxQuantity in src/data/booking.ts)
const MIN_HOURS_DRUMS = 2; // recording drums takes at least 2 hours (MIN_RECORDING_HOURS_DRUMS on the site)
const CHECKOUT_MINUTES = 31; // the Stripe Checkout expires after this (Stripe's minimum is 30)
const HOLD_MINUTES = 35; // an unpaid booking holds its slot this long while the customer pays
const KEEP_UNPAID_HOURS = 25; // unpaid bookings stay in the calendar (as expired) this long, then are deleted
const SERVICE_LABELS = { recording: 'Nagrywanie', rehearsal: 'Sala prób' };
const SITE = 'https://sanctum-sa.com';
const STUDIO_EMAIL = 'support@sanctum-sa.com'; // sender and organizer of the customer's calendar invite
const STUDIO_PHONE = '+48 881 238 684';
const STUDIO_ADDRESS = 'Aleja Stanów Zjednoczonych 67, 03-770 Warszawa';
const STUDIO_INSTAGRAM = '@sanctum_sound_studio';

// Prices in PLN, charged on Stripe. Keep in line with src/data/booking.ts.
// perHour extras change the hourly price; the others are a fixed charge per booking. An extra with
// price 0 (recording: what we record) is only noted on the booking.
const PLANS = {
  rehearsal: {
    perHour: 60,
    product: 'Sala prób',
    options: {
      cymbals: { price: 10, perHour: false, label: 'zestaw talerzy' },
      double_pedal: { price: 5, perHour: false, label: 'podwójna stopa' },
      solo: { price: -10, perHour: true, label: 'tylko perkusja lub wokal' },
    },
  },
  recording: {
    perHour: 120,
    product: 'Nagrywanie',
    options: {
      vocals: { price: 0, perHour: false, label: 'nagrywamy: wokal' },
      drums: { price: 0, perHour: false, label: 'nagrywamy: perkusja' },
      guitars: { price: 0, perHour: false, label: 'nagrywamy: gitary' },
      bass: { price: 0, perHour: false, label: 'nagrywamy: bas' },
      keys: { price: 0, perHour: false, label: 'nagrywamy: klawisze' },
      other: { price: 0, perHour: false, label: 'nagrywamy: inne (w uwagach)' },
    },
  },
};
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

// ---------------------------------------------------------------- web app entry points

// (Running doGet/doPost from the editor has no request, so they just report that the script is alive.)
function doGet(e) {
  const p = (e && e.parameter) || {};
  if (p.action === 'busy') return json_(busy_(p.service, p.from, p.to));
  return json_({ ok: true, service: 'sanctum-booking' });
}

// The booking page posts JSON as text/plain (no CORS preflight).
function doPost(e) {
  let body;
  try {
    body = JSON.parse(e && e.postData ? e.postData.contents : '');
  } catch (err) {
    return json_({ error: 'bad_request' });
  }
  if (body.action === 'book') return json_(book_(body));
  if (body.action === 'confirm') return json_(confirm_(body.session_id));
  if (body.action === 'cancel') return json_(cancel_(body.reference));
  if (body.action === 'notify') return json_(notify_(body));
  if (body.action === 'voucher') return json_(voucher_(body));
  return json_({ error: 'unknown_action' });
}

// ---------------------------------------------------------------- availability

// Busy times for one service, as [{ booking_date, start_minute, duration_minutes }] in Warsaw time.
// Site bookings only block their own service (recording and the rehearsal room are separate rooms);
// every other timed event in the calendar blocks all services. All-day events are ignored.
function busy_(service, from, to) {
  if (!SERVICE_LABELS[service] || !ISO_DATE.test(from) || !ISO_DATE.test(to) || to < from) return { error: 'invalid_range' };
  const start = at_(from, 0);
  const end = new Date(at_(to, 0).getTime() + 36 * 3600 * 1000);
  const slots = [];
  calendar_()
    .getEvents(start, end)
    .filter((ev) => blocks_(ev, service))
    .forEach((ev) => {
      let s = local_(ev.getStartTime());
      const en = local_(ev.getEndTime());
      while (s.date < en.date) {
        slots.push({ booking_date: s.date, start_minute: s.minutes, duration_minutes: 1440 - s.minutes });
        s = { date: nextDay_(s.date), minutes: 0 };
      }
      if (en.minutes > s.minutes) {
        slots.push({ booking_date: s.date, start_minute: s.minutes, duration_minutes: en.minutes - s.minutes });
      }
    });
  return slots;
}

function blocks_(ev, service) {
  if (ev.isAllDayEvent()) return false;
  const status = ev.getTag('sanctumStatus');
  if (status === 'pending' && ageMinutes_(ev) > HOLD_MINUTES) return false;
  if (status === 'expired') return false;
  const evService = ev.getTag('sanctumService');
  return !evService || evService === service;
}

// ---------------------------------------------------------------- booking

function book_(b) {
  const label = SERVICE_LABELS[b.service];
  const start_minute = Number(b.start_minute);
  const duration = Number(b.duration_minutes);
  if (
    !label ||
    !ISO_DATE.test(b.date) ||
    !/^[A-Za-z0-9_-]{6,200}$/.test(b.reference || '') ||
    !(start_minute >= 0 && start_minute < 1440) ||
    !(duration >= 30 && duration <= 720) ||
    duration > (MAX_HOURS[b.service] || 0) * 60 ||
    (b.service === 'recording' && (b.options || []).indexOf('drums') >= 0 && duration < MIN_HOURS_DRUMS * 60)
  ) {
    return { error: 'invalid_booking' };
  }
  const start = at_(b.date, start_minute);
  const end = new Date(start.getTime() + duration * 60000);
  if (start.getTime() < Date.now() + MIN_NOTICE_MINUTES * 60000) return { error: 'too_soon' };

  // The price is worked out here from PLANS, never taken from the page.
  const plan = PLANS[b.service];
  const hours = duration / 60;
  const options = Object.keys(plan.options).filter((k) => (b.options || []).indexOf(k) >= 0);
  const priced = hours === Math.floor(hours);
  const opt = (k) => plan.options[k];
  const hourly = options.filter((k) => opt(k).perHour);
  const fixed = options.filter((k) => !opt(k).perHour && opt(k).price);
  const perHour = priced ? hourly.reduce((sum, k) => sum + opt(k).price, plan.perHour) : 0;
  const fixedTotal = priced ? fixed.reduce((sum, k) => sum + opt(k).price, 0) : 0;
  const amount = perHour * hours + fixedTotal;
  const checkout = Boolean(b.checkout) && priced && amount > 0;

  const name = clip_(b.name, 100);
  let ev;
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    if (tooMany_(b)) return { error: 'rate_limited' };
    const cal = calendar_();
    if (cal.getEvents(start, end).some((ev) => blocks_(ev, b.service))) return { error: 'slot_taken' };

    ev = cal.createEvent((checkout ? '⏳ Nieopłacone: ' : '📝 Do potwierdzenia: ') + label + ' - ' + name, start, end, {
      description: [
        'Rezerwacja: ' + b.reference,
        'Imię: ' + name,
        'Telefon: ' + clip_(b.phone, 50),
        'E-mail: ' + clip_(b.email, 255),
        priced
          ? 'Kwota: ' + amount + ' zł (' + hours + ' × ' + perHour + ' zł/h' + (fixedTotal ? ' + ' + fixedTotal + ' zł' : '') + ')' +
            (checkout ? ', płatność Stripe' : ', płatność do ustalenia')
          : 'Kwota: do ustalenia',
        'Dodatki: ' + (options.map((k) => opt(k).label).join(', ') || '-'),
        'Uwagi: ' + (clip_(b.notes, 2000) || '-'),
      ].join('\n'),
    });
    ev.setTag('sanctumRef', b.reference);
    ev.setTag('sanctumService', b.service);
    ev.setTag('sanctumStatus', checkout ? 'pending' : 'request');
    ev.setTag('sanctumCreated', String(Date.now()));
    ev.setTag('sanctumLabel', label + ' - ' + name);
    ev.setTag('sanctumEmail', clip_(b.email, 255));
    ev.setTag('sanctumName', name);
    ev.setTag('sanctumOptions', options.join(','));
    ev.setTag('sanctumLang', (/^\/(en|uk|be|ru)\//.exec(b.return_path || '') || [null, 'pl'])[1]);
    countBooking_(b);
  } finally {
    lock.releaseLock();
  }
  if (!checkout) {
    telegramBooking_(ev, '📝 <b>Nowa rezerwacja do potwierdzenia</b>');
    return { ok: true };
  }

  // Stripe Checkout for the exact amount. If Stripe isn't set up or refuses, the booking stays as a
  // request the studio confirms by hand.
  const page = /^\/(?:(?:en|uk|be|ru)\/)?booking\/$/.test(b.return_path || '') ? b.return_path : '/booking/';
  const params = {
    mode: 'payment',
    client_reference_id: b.reference,
    customer_email: clip_(b.email, 255),
    locale: ['pl', 'en', 'ru'].indexOf(b.locale) >= 0 ? b.locale : 'auto',
    expires_at: String(Math.floor(Date.now() / 1000) + CHECKOUT_MINUTES * 60),
    success_url: SITE + page + '?paid=1&session_id={CHECKOUT_SESSION_ID}',
    cancel_url: SITE + page + '?cancel=' + b.reference,
    'line_items[0][quantity]': String(hours),
    'line_items[0][price_data][currency]': 'pln',
    'line_items[0][price_data][unit_amount]': String(perHour * 100),
    'line_items[0][price_data][product_data][name]':
      plan.product + ' - 1 godz.' + (hourly.length ? ' (' + hourly.map((k) => opt(k).label).join(', ') + ')' : ''),
    'line_items[0][price_data][product_data][description]': b.date + ', ' + pad_(Math.floor(start_minute / 60)) + ':' + pad_(start_minute % 60),
  };
  // Fixed extras: one line each, charged once per booking.
  fixed.forEach((k, i) => {
    const line = 'line_items[' + (i + 1) + ']';
    params[line + '[quantity]'] = '1';
    params[line + '[price_data][currency]'] = 'pln';
    params[line + '[price_data][unit_amount]'] = String(opt(k).price * 100);
    params[line + '[price_data][product_data][name]'] = plan.product + ': ' + opt(k).label;
  });
  const session = stripePost_('checkout/sessions', params);
  if (!session || !session.url) {
    // No payment page: free the slot, and the site tells the customer nothing was booked.
    // The reason is in Executions (the "Stripe ..." error line).
    ev.setTag('sanctumStatus', 'expired');
    ev.setTitle('⌛ Błąd płatności Stripe: ' + label + ' - ' + name);
    telegramBooking_(ev, '⌛ <b>Błąd płatności Stripe, termin zwolniony</b>', true);
    return { error: 'checkout_failed' };
  }
  telegramBooking_(ev, '⏳ <b>Nowa rezerwacja, czeka na płatność</b>', true);
  return { ok: true, checkout_url: session.url };
}

// The customer came back from Stripe without paying: free the slot straight away.
function cancel_(reference) {
  const m = /^SS-(recording|rehearsal)-(\d{4})(\d{2})(\d{2})-/.exec(reference || '');
  if (!m) return { error: 'invalid_reference' };
  const ev = findBooking_(reference, m[2] + '-' + m[3] + '-' + m[4]);
  if (ev && ev.getTag('sanctumStatus') === 'pending') {
    ev.setTag('sanctumStatus', 'expired');
    ev.setTitle('⌛ Anulowana (nieopłacona): ' + (ev.getTag('sanctumLabel') || ''));
    telegramBooking_(ev, '⌛ <b>Klient wrócił ze Stripe bez płatności, termin zwolniony</b>', true);
  }
  return { ok: true };
}

function findBooking_(reference, date) {
  return calendar_()
    .getEvents(at_(date, 0), new Date(at_(date, 0).getTime() + 36 * 3600 * 1000))
    .find((e) => e.getTag('sanctumRef') === reference);
}

// The web app is public, so cap how many bookings can be made: someone spamming fake bookings
// could otherwise fill the calendar. Limits: 20 per hour overall, 30 per day per email or phone
// (every attempt counts, including ones left unpaid).
function limitKeys_(b) {
  return [
    ['all-' + Utilities.formatDate(new Date(), TZ, 'yyyyMMddHH'), 20, 3600],
    ['email-' + clip_(b.email, 255).toLowerCase(), 30, 86400],
    ['phone-' + clip_(b.phone, 50).replace(/\D/g, ''), 30, 86400],
  ].map(([k, max, ttl]) => [Utilities.base64EncodeWebSafe(k).slice(0, 240), max, ttl]);
}

function tooMany_(b) {
  const cache = CacheService.getScriptCache();
  return limitKeys_(b).some(([k, max]) => Number(cache.get(k) || 0) >= max);
}

function countBooking_(b) {
  const cache = CacheService.getScriptCache();
  limitKeys_(b).forEach(([k, , ttl]) => cache.put(k, String(Number(cache.get(k) || 0) + 1), ttl));
}

// ---------------------------------------------------------------- Stripe

// Called by the booking page when the customer comes back from Stripe with ?session_id=cs_...
function confirm_(sessionId) {
  if (!/^cs_[A-Za-z0-9_]+$/.test(sessionId || '')) return { error: 'invalid_session' };
  const session = stripe_('checkout/sessions/' + sessionId);
  if (!session || session.payment_status !== 'paid' || !session.client_reference_id) return { ok: true, paid: false };
  markPaid_(session.client_reference_id, session);
  return { ok: true, paid: true };
}

// Runs every 5 minutes (see setup): catches payments where the customer closed the page before
// returning from Stripe, and tidies up unpaid holds.
function syncStripe() {
  const since = Math.floor(Date.now() / 1000) - KEEP_UNPAID_HOURS * 3600;
  const list = stripe_('checkout/sessions?limit=100&status=complete&created[gte]=' + since);
  ((list && list.data) || []).forEach((s) => {
    if (s.payment_status === 'paid' && /^S[SV]-/.test(s.client_reference_id || '')) markPaid_(s.client_reference_id, s);
  });
  try {
    expireVouchers_();
  } catch (err) {
    console.error('Voucher list check failed: ' + err);
  }

  const now = new Date();
  calendar_()
    .getEvents(new Date(now.getTime() - 2 * 86400000), new Date(now.getTime() + 180 * 86400000))
    .forEach((ev) => {
      const status = ev.getTag('sanctumStatus');
      if (status !== 'pending' && status !== 'expired') return;
      const age = ageMinutes_(ev);
      if (age > KEEP_UNPAID_HOURS * 60) {
        ev.deleteEvent();
      } else if (status === 'pending' && age > HOLD_MINUTES) {
        ev.setTag('sanctumStatus', 'expired');
        ev.setTitle('⌛ Wygasła (nieopłacona): ' + (ev.getTag('sanctumLabel') || ''));
        telegramBooking_(ev, '⌛ <b>Rezerwacja wygasła (nieopłacona), termin zwolniony</b>', true);
      }
    });
}

function markPaid_(reference, session) {
  if (/^SV-/.test(reference)) return voucherPaid_(reference, session); // a gift voucher
  const m = /^SS-(recording|rehearsal)-(\d{4})(\d{2})(\d{2})-/.exec(reference);
  if (!m) return; // mixing bookings have no calendar slot
  // The page's confirm and the 5-minute sync can arrive together: only one may mark it paid and email.
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) return; // the next sync tries again
  try {
    markPaidLocked_(reference, session, m);
  } finally {
    lock.releaseLock();
  }
}

function markPaidLocked_(reference, session, m) {
  const cal = calendar_();
  const ev = findBooking_(reference, m[2] + '-' + m[3] + '-' + m[4]);
  if (!ev || ev.getTag('sanctumStatus') === 'paid') return;

  // Paid after the hold ran out: someone else may have taken the slot meanwhile.
  const wasExpired = ev.getTag('sanctumStatus') === 'expired' || ageMinutes_(ev) > HOLD_MINUTES;
  const clash =
    wasExpired &&
    cal
      .getEvents(ev.getStartTime(), ev.getEndTime())
      .some((other) => other.getId() !== ev.getId() && blocks_(other, m[1]));

  ev.setTag('sanctumStatus', 'paid');
  ev.setTitle((clash ? '⚠️ KONFLIKT, opłacone: ' : '✅ Opłacone: ') + (ev.getTag('sanctumLabel') || ''));
  ev.setDescription(
    ev.getDescription() +
      '\nStripe: ' + session.id + ', ' + (session.amount_total / 100) + ' ' + String(session.currency || '').toUpperCase()
  );
  telegramBooking_(
    ev,
    clash
      ? '⚠️ <b>KONFLIKT: opłacone, ale termin jest już zajęty.</b> Klient nie dostał potwierdzenia, skontaktuj się z nim.'
      : '✅ <b>Opłacona rezerwacja</b>'
  );
  // A clash needs the studio to sort it out first, so no confirmation goes out for it.
  if (!clash) sendConfirmation_(ev, session);
}

// ---------------------------------------------------------------- customer confirmation

// Email texts per site language. {name}, {date}, {time}, {link} are filled in.
const MAIL = {
  pl: {
    subject: 'Potwierdzenie rezerwacji: sala prób, {date} {time}',
    hi: 'Cześć {name},',
    intro: 'dziękujemy za płatność. Twoja rezerwacja sali prób jest potwierdzona.',
    when: 'Termin', hours: 'Czas', extras: 'Dodatki', paid: 'Zapłacono', address: 'Adres', ref: 'Numer rezerwacji',
    unit: 'godz.',
    invite: 'W załączniku jest zaproszenie do kalendarza. Możesz też dodać termin do Kalendarza Google: {link}',
    change: 'Chcesz zmienić termin? Zadzwoń pod {phone} albo odpowiedz na tego maila.',
    title: 'Próba w Sanctum Sound',
    heading: 'Rezerwacja potwierdzona', room: 'Sala prób', button: 'Dodaj do Kalendarza Google', icsNote: 'Zaproszenie do kalendarza jest też w załączniku (invite.ics).', directions: 'Jak dojechać',
    days: ['poniedziałek', 'wtorek', 'środa', 'czwartek', 'piątek', 'sobota', 'niedziela'],
    options: { cymbals: 'Zestaw talerzy', double_pedal: 'Podwójna stopa', solo: 'Tylko perkusja lub tylko wokal', vocals: 'Wokal', drums: 'Perkusja', guitars: 'Gitary', bass: 'Bas', keys: 'Klawisze', other: 'Inne' },
    recording: {
      subject: 'Potwierdzenie rezerwacji: nagranie, {date} {time}',
      intro: 'dziękujemy za płatność. Twoja sesja nagraniowa jest potwierdzona.',
      title: 'Nagranie w Sanctum Sound',
      room: 'Nagrywanie',
    },
  },
  en: {
    subject: 'Booking confirmed: rehearsal room, {date} {time}',
    hi: 'Hi {name},',
    intro: 'thanks for your payment. Your rehearsal room booking is confirmed.',
    when: 'When', hours: 'Duration', extras: 'Extras', paid: 'Paid', address: 'Address', ref: 'Booking reference',
    unit: 'h',
    invite: 'The calendar invite is attached. You can also add it to Google Calendar: {link}',
    change: 'Need to change the time? Call {phone} or reply to this email.',
    title: 'Rehearsal at Sanctum Sound',
    heading: 'Booking confirmed', room: 'Rehearsal room', button: 'Add to Google Calendar', icsNote: 'The calendar invite is also attached (invite.ics).', directions: 'Get directions',
    days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    options: { cymbals: 'Cymbal set', double_pedal: 'Double bass drum pedal', solo: 'Drums or vocals only', vocals: 'Vocals', drums: 'Drums', guitars: 'Guitars', bass: 'Bass', keys: 'Keys', other: 'Other' },
    recording: {
      subject: 'Booking confirmed: recording, {date} {time}',
      intro: 'thanks for your payment. Your recording session is confirmed.',
      title: 'Recording at Sanctum Sound',
      room: 'Recording',
    },
  },
  uk: {
    subject: 'Бронювання підтверджено: репетиційна зала, {date} {time}',
    hi: 'Вітаємо, {name}!',
    intro: 'Дякуємо за оплату. Ваше бронювання репетиційної зали підтверджено.',
    when: 'Коли', hours: 'Тривалість', extras: 'Додатки', paid: 'Сплачено', address: 'Адреса', ref: 'Номер бронювання',
    unit: 'год',
    invite: 'Запрошення в календар у вкладенні. Також можна додати подію в Google Календар: {link}',
    change: 'Потрібно змінити час? Телефонуйте {phone} або дайте відповідь на цей лист.',
    title: 'Репетиція в Sanctum Sound',
    heading: 'Бронювання підтверджено', room: 'Репетиційна зала', button: 'Додати в Google Календар', icsNote: 'Запрошення в календар також у вкладенні (invite.ics).', directions: 'Як дістатися',
    days: ['понеділок', 'вівторок', 'середа', 'четвер', 'пʼятниця', 'субота', 'неділя'],
    options: { cymbals: 'Комплект тарілок', double_pedal: 'Подвійна педаль', solo: 'Тільки барабани або тільки вокал', vocals: 'Вокал', drums: 'Барабани', guitars: 'Гітари', bass: 'Бас', keys: 'Клавішні', other: 'Інше' },
    recording: {
      subject: 'Бронювання підтверджено: запис, {date} {time}',
      intro: 'Дякуємо за оплату. Ваш запис підтверджено.',
      title: 'Запис у Sanctum Sound',
      room: 'Запис',
    },
  },
  be: {
    subject: 'Браніраванне пацверджана: рэпетыцыйная зала, {date} {time}',
    hi: 'Вітаем, {name}!',
    intro: 'Дзякуй за аплату. Ваша браніраванне рэпетыцыйнай залы пацверджана.',
    when: 'Калі', hours: 'Працягласць', extras: 'Дадаткі', paid: 'Аплачана', address: 'Адрас', ref: 'Нумар браніравання',
    unit: 'гадз',
    invite: 'Запрашэнне ў каляндар ва ўкладанні. Таксама можна дадаць падзею ў Google Каляндар: {link}',
    change: 'Трэба змяніць час? Тэлефануйце {phone} або адкажыце на гэты ліст.',
    title: 'Рэпетыцыя ў Sanctum Sound',
    heading: 'Браніраванне пацверджана', room: 'Рэпетыцыйная зала', button: 'Дадаць у Google Каляндар', icsNote: 'Запрашэнне ў каляндар таксама ва ўкладанні (invite.ics).', directions: 'Як дабрацца',
    days: ['панядзелак', 'аўторак', 'серада', 'чацвер', 'пятніца', 'субота', 'нядзеля'],
    options: { cymbals: 'Камплект талерак', double_pedal: 'Падвойная педаль', solo: 'Толькі барабаны або толькі вакал', vocals: 'Вакал', drums: 'Барабаны', guitars: 'Гітары', bass: 'Бас', keys: 'Клавішныя', other: 'Іншае' },
    recording: {
      subject: 'Браніраванне пацверджана: запіс, {date} {time}',
      intro: 'Дзякуй за аплату. Ваш запіс пацверджаны.',
      title: 'Запіс у Sanctum Sound',
      room: 'Запіс',
    },
  },
  ru: {
    subject: 'Бронирование подтверждено: репетиционная комната, {date} {time}',
    hi: 'Здравствуйте, {name}!',
    intro: 'Спасибо за оплату. Ваше бронирование репетиционной комнаты подтверждено.',
    when: 'Когда', hours: 'Длительность', extras: 'Дополнения', paid: 'Оплачено', address: 'Адрес', ref: 'Номер бронирования',
    unit: 'ч',
    invite: 'Приглашение в календарь во вложении. Также можно добавить событие в Google Календарь: {link}',
    change: 'Нужно изменить время? Звоните {phone} или ответьте на это письмо.',
    title: 'Репетиция в Sanctum Sound',
    heading: 'Бронирование подтверждено', room: 'Репетиционная комната', button: 'Добавить в Google Календарь', icsNote: 'Приглашение в календарь также во вложении (invite.ics).', directions: 'Как добраться',
    days: ['понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота', 'воскресенье'],
    options: { cymbals: 'Комплект тарелок', double_pedal: 'Двойная педаль', solo: 'Только барабаны или только вокал', vocals: 'Вокал', drums: 'Барабаны', guitars: 'Гитары', bass: 'Бас', keys: 'Клавишные', other: 'Другое' },
    recording: {
      subject: 'Бронирование подтверждено: запись, {date} {time}',
      intro: 'Спасибо за оплату. Ваша запись подтверждена.',
      title: 'Запись в Sanctum Sound',
      room: 'Запись',
    },
  },
};

// Payment confirmation to the customer, with the booking as a calendar invite (.ics, which Gmail,
// Outlook and Apple Mail show as an invite) and an "add to Google Calendar" link. Sent once per booking.
function sendConfirmation_(ev, session) {
  if (ev.getTag('sanctumMailed')) return;
  const details = session.customer_details || {};
  const to = String(details.email || session.customer_email || ev.getTag('sanctumEmail') || '').trim();
  if (!/^[^\s@<>,;]+@[^\s@<>,;]+\.[^\s@<>,;]+$/.test(to)) return;
  const lang = MAIL[ev.getTag('sanctumLang')] || MAIL.pl;
  // Recording bookings use the same email with their own subject, intro, title and room name.
  const t = ev.getTag('sanctumService') === 'recording' ? Object.assign({}, lang, lang.recording) : lang;
  const start = ev.getStartTime();
  const end = ev.getEndTime();
  const hours = Math.round((end.getTime() - start.getTime()) / 360000) / 10;
  const date = Utilities.formatDate(start, TZ, 'dd.MM.yyyy');
  const time = Utilities.formatDate(start, TZ, 'HH:mm') + '–' + Utilities.formatDate(end, TZ, 'HH:mm');
  const name = ev.getTag('sanctumName') || details.name || '';
  const extras = (ev.getTag('sanctumOptions') || '')
    .split(',')
    .filter((k) => t.options[k])
    .map((k) => t.options[k])
    .join(', ');
  const paid = session.amount_total / 100 + ' ' + String(session.currency || 'pln').toUpperCase();
  const ref = ev.getTag('sanctumRef');
  const utc = (d) => Utilities.formatDate(d, 'UTC', "yyyyMMdd'T'HHmmss'Z'");
  const link =
    'https://calendar.google.com/calendar/render?action=TEMPLATE' +
    '&text=' + encodeURIComponent(t.title) +
    '&dates=' + utc(start) + '/' + utc(end) +
    '&location=' + encodeURIComponent(STUDIO_ADDRESS) +
    '&details=' + encodeURIComponent(t.ref + ': ' + ref);
  const fill = (s) =>
    s.replace('{name}', name).replace('{date}', date).replace('{time}', time).replace('{phone}', STUDIO_PHONE).replace('{link}', link);

  const rows = [
    [t.when, date + ', ' + time],
    [t.hours, hours + ' ' + t.unit],
    extras ? [t.extras, extras] : null,
    [t.paid, paid],
    [t.address, STUDIO_ADDRESS],
    [t.ref, ref],
  ].filter(Boolean);
  const body = [fill(t.hi), '', fill(t.intro), '']
    .concat(rows.map((r) => r[0] + ': ' + r[1]))
    .concat(['', fill(t.invite), '', fill(t.change), '', 'Sanctum Sound', SITE])
    .join('\n');
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  // Dark card in the site's black-and-white style, built from tables so it holds up in Gmail and Outlook.
  const weekday = t.days[Number(Utilities.formatDate(start, TZ, 'u')) - 1] || '';
  const maps = 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(STUDIO_ADDRESS);
  const cell = 'font-family:Helvetica,Arial,sans-serif;';
  const button = (href, label, light) =>
    '<a href="' + esc(href) + '" style="' + cell + 'display:inline-block;padding:13px 22px;border-radius:8px;font-size:15px;font-weight:bold;text-decoration:none;' +
    (light ? 'background:#ffffff;color:#000000;' : 'background:#000000;color:#ffffff;border:1px solid #444444;') + '">' + esc(label) + '</a>';
  const detailRows = rows
    .filter((r) => r[0] !== t.when && r[0] !== t.address)
    .map(
      (r) =>
        '<tr><td style="' + cell + 'padding:12px 16px 12px 0;border-top:1px solid #262626;color:#9a9a9a;font-size:14px;white-space:nowrap;">' + esc(r[0]) + '</td>' +
        '<td align="right" style="' + cell + 'padding:12px 0;border-top:1px solid #262626;color:#ffffff;font-size:14px;font-weight:bold;">' + esc(r[1]) + '</td></tr>'
    )
    .join('');
  const html =
    '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width">' +
    '<meta name="color-scheme" content="dark"><meta name="supported-color-schemes" content="dark"></head>' +
    '<body style="margin:0;padding:0;background:#000000;">' +
    '<div style="display:none;max-height:0;overflow:hidden;">' + esc(fill(t.intro)) + '</div>' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#000000;"><tr><td align="center" style="padding:28px 12px;">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">' +
    // logo
    '<tr><td align="center" style="padding:0 0 20px;"><a href="' + SITE + '"><img src="' + SITE + '/icon-192.png" width="112" height="112" alt="Sanctum Sound" style="display:block;border:0;"></a></td></tr>' +
    // card
    '<tr><td style="background:#0d0d0d;border:1px solid #262626;border-radius:14px;padding:32px 28px;">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0">' +
    '<tr><td style="' + cell + 'color:#ffffff;font-size:13px;letter-spacing:2px;text-transform:uppercase;padding-bottom:10px;">✓&nbsp; ' + esc(t.heading) + '</td></tr>' +
    '<tr><td style="' + cell + 'color:#ffffff;font-size:15px;line-height:1.5;padding-bottom:22px;">' + esc(fill(t.hi)) + ' ' + esc(fill(t.intro)) + '</td></tr>' +
    // date block
    '<tr><td style="background:#ffffff;border-radius:10px;padding:20px 22px;">' +
    '<div style="' + cell + 'color:#555555;font-size:13px;text-transform:uppercase;letter-spacing:1px;">' + esc(t.room) + '</div>' +
    '<div style="' + cell + 'color:#000000;font-size:24px;font-weight:bold;line-height:1.3;padding-top:4px;">' + esc(weekday) + ', ' + esc(date) + '</div>' +
    '<div style="' + cell + 'color:#000000;font-size:34px;font-weight:bold;line-height:1.2;">' + esc(time) + '</div>' +
    '</td></tr>' +
    // details
    '<tr><td style="padding-top:18px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">' + detailRows + '</table></td></tr>' +
    // calendar
    '<tr><td align="center" style="padding-top:24px;">' + button(link, t.button, true) + '</td></tr>' +
    '<tr><td align="center" style="' + cell + 'color:#9a9a9a;font-size:12px;padding-top:10px;">' + esc(t.icsNote) + '</td></tr>' +
    // address
    '<tr><td style="padding-top:26px;border-bottom:1px solid #262626;"></td></tr>' +
    '<tr><td style="' + cell + 'padding-top:20px;color:#9a9a9a;font-size:13px;">' + esc(t.address) + '</td></tr>' +
    '<tr><td style="' + cell + 'padding-top:4px;color:#ffffff;font-size:15px;font-weight:bold;">' + esc(STUDIO_ADDRESS) + '</td></tr>' +
    '<tr><td style="padding-top:14px;">' + button(maps, t.directions, false) + '</td></tr>' +
    '<tr><td style="' + cell + 'padding-top:22px;color:#cfcfcf;font-size:14px;line-height:1.5;">' +
    esc(t.change.split('{phone}')[0]) + '<a href="tel:' + STUDIO_PHONE.replace(/\s/g, '') + '" style="color:#ffffff;font-weight:bold;">' + esc(STUDIO_PHONE) + '</a>' + esc(t.change.split('{phone}')[1] || '') +
    '</td></tr>' +
    '</table></td></tr>' +
    // footer
    '<tr><td align="center" style="' + cell + 'padding:22px 0 0;color:#6b6b6b;font-size:12px;line-height:1.6;">Sanctum Sound · ' + esc(STUDIO_ADDRESS) + '<br>' +
    '<a href="' + SITE + '" style="color:#9a9a9a;">sanctum-sa.com</a></td></tr>' +
    '</table></td></tr></table></body></html>';

  const icsText = (s) => String(s).replace(/\\/g, '\\\\').replace(/([,;])/g, '\\$1').replace(/\n/g, '\\n');
  const ics = [
    'BEGIN:VCALENDAR',
    'PRODID:-//Sanctum Sound//Booking//EN',
    'VERSION:2.0',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    'UID:' + ref + '@sanctum-sa.com',
    'DTSTAMP:' + utc(new Date()),
    'DTSTART:' + utc(start),
    'DTEND:' + utc(end),
    'SUMMARY:' + icsText(t.title),
    'LOCATION:' + icsText(STUDIO_ADDRESS),
    'DESCRIPTION:' + icsText(t.ref + ': ' + ref + '\n' + t.change.replace('{phone}', STUDIO_PHONE)),
    'ORGANIZER;CN=Sanctum Sound:mailto:' + STUDIO_EMAIL,
    'ATTENDEE;CN=' + icsText(name || to) + ';ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=FALSE:mailto:' + to,
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'END:VEVENT',
    'END:VCALENDAR',
  ]
    .map((line) => line.match(/.{1,70}/g).join('\r\n ')) // calendar files fold long lines
    .join('\r\n');

  try {
    MailApp.sendEmail({
      to: to,
      subject: fill(t.subject),
      body: body,
      htmlBody: html,
      name: 'Sanctum Sound',
      replyTo: STUDIO_EMAIL,
      attachments: [Utilities.newBlob(ics, 'text/calendar', 'invite.ics')],
    });
    ev.setTag('sanctumMailed', String(Date.now()));
  } catch (err) {
    console.error('Confirmation email to ' + to + ' failed: ' + err);
  }
}

// ---------------------------------------------------------------- gift vouchers

// Gift vouchers sold on /voucher/. These are the prices charged: keep them in line with
// src/data/vouchers.ts (the prices the site shows). price null = gift card, the buyer picks the amount.
// Labels are Polish, for the voucher list and Telegram; the customer's language is in VOUCHER_MAIL.
const VOUCHERS = {
  start: { price: 240, label: 'Start', items: '2 godz. nagrania z realizatorem' },
  song: { price: 599, label: 'Jedna piosenka', items: '2 godz. nagrania, miks i mastering 1 utworu' },
  single: { price: 990, label: 'Singiel zespołu', items: '5 godz. nagrania, miks i mastering 1 utworu' },
  day: { price: 1690, label: 'Dzień w studiu', items: '8 godz. nagrania, miks i mastering 2 utworów' },
  rehearsal: { price: 550, label: 'Pakiet prób', items: '10 godz. na sali prób' },
  gift: { price: null, label: 'Karta podarunkowa', items: 'Dowolna kwota na usługi studia' },
};
const GIFT_MIN = 100;
const GIFT_MAX = 5000;
const VOUCHER_VALID_MONTHS = 3; // set by the studio on 2026-10-20

// The voucher list is a Google Sheet in this account ("Sanctum Sound - vouchery"), made on the first
// sale or by setup(). One row per voucher. Mark a used voucher by writing the date in the last column.
const VOUCHER_COLUMNS = [
  'Kod', 'Status', 'Pakiet', 'Kwota (zł)', 'Zawartość', 'Kupujący', 'E-mail', 'Telefon', 'Dla kogo',
  'Dedykacja', 'Ukryta kwota', 'Język', 'Utworzono', 'Opłacono', 'Ważny do', 'Stripe', 'Wykorzystano (data, uwagi)',
];
const VC = {}; // column numbers by name, from 1
VOUCHER_COLUMNS.forEach((name, i) => (VC[name] = i + 1));
const VOUCHER_STATUS = {
  pending: '⏳ nieopłacony',
  paid: '✅ opłacony',
  expired: '⌛ wygasł (nieopłacony)',
  failed: '⌛ błąd płatności Stripe',
};

// Email and PDF texts per site language. Tier names and contents match src/i18n/content/voucherShop.ts.
const VOUCHER_MAIL = {
  pl: {
    subject: 'Twój voucher Sanctum Sound: {tier}',
    hi: 'Cześć {name},',
    intro: 'dziękujemy za zakup! Voucher jest w załączniku (PDF), gotowy do wydruku lub przesłania dalej.',
    heading: 'Twój voucher', voucher: 'Voucher', package: 'Pakiet', value: 'Wartość', for: 'Dla', code: 'Kod vouchera',
    valid: 'Ważny do', paid: 'Zapłacono',
    how: 'Jak skorzystać: skontaktuj się z nami w dowolny sposób (telefon {phone}, e-mail {email}, Instagram lub formularz na sanctum-sa.com), podaj kod i umów termin sesji.',
    questions: 'Pytania? Zadzwoń pod {phone} albo odpowiedz na tego maila.',
    hours: 'Codziennie 9:00-24:00', // opening hours, in the voucher footer
    tiers: {
      start: ['Start', '2 godz. nagrania z realizatorem'],
      song: ['Jedna piosenka', '2 godz. nagrania, miks i mastering 1 utworu'],
      single: ['Singiel zespołu', '5 godz. nagrania, miks i mastering 1 utworu'],
      day: ['Dzień w studiu', '8 godz. nagrania, miks i mastering 2 utworów'],
      rehearsal: ['Pakiet prób', '10 godz. na sali prób'],
      gift: ['Karta podarunkowa', 'Do wykorzystania na wszystkie usługi studia'],
    },
  },
  en: {
    subject: 'Your Sanctum Sound voucher: {tier}',
    hi: 'Hi {name},',
    intro: 'thank you for your purchase! The voucher is attached as a PDF, ready to print or forward.',
    heading: 'Your voucher', voucher: 'Gift voucher', package: 'Package', value: 'Value', for: 'For', code: 'Voucher code',
    valid: 'Valid until', paid: 'Paid',
    how: 'How to use it: contact us any way you like (phone {phone}, email {email}, Instagram or the form on sanctum-sa.com), give the code and book a session.',
    questions: 'Questions? Call {phone} or reply to this email.',
    hours: 'Every day 9:00-24:00', // opening hours, in the voucher footer
    tiers: {
      start: ['Start', '2 h of recording with a sound engineer'],
      song: ['One song', '2 h of recording, mixing and mastering of 1 song'],
      single: ['Band single', '5 h of recording, mixing and mastering of 1 song'],
      day: ['Day in the studio', '8 h of recording, mixing and mastering of 2 songs'],
      rehearsal: ['Rehearsal pack', '10 h in the rehearsal room'],
      gift: ['Gift card', 'For any studio service'],
    },
  },
  uk: {
    subject: 'Ваш сертифікат Sanctum Sound: {tier}',
    hi: 'Вітаємо, {name}!',
    intro: 'Дякуємо за покупку! Сертифікат у вкладенні (PDF), його можна роздрукувати або переслати.',
    heading: 'Ваш сертифікат', voucher: 'Подарунковий сертифікат', package: 'Пакет', value: 'Вартість', for: 'Для', code: 'Код сертифіката',
    valid: 'Дійсний до', paid: 'Сплачено',
    how: 'Як скористатися: зв’яжіться з нами будь-яким способом (телефон {phone}, e-mail {email}, Instagram або форма на sanctum-sa.com), назвіть код і домовтеся про дату сесії.',
    questions: 'Питання? Телефонуйте {phone} або дайте відповідь на цей лист.',
    hours: 'Щодня 9:00-24:00', // opening hours, in the voucher footer
    tiers: {
      start: ['Старт', '2 год запису зі звукорежисером'],
      song: ['Одна пісня', '2 год запису, зведення і мастеринг 1 пісні'],
      single: ['Сингл гурту', '5 год запису, зведення і мастеринг 1 пісні'],
      day: ['День у студії', '8 год запису, зведення і мастеринг 2 пісень'],
      rehearsal: ['Пакет репетицій', '10 год у репетиційній залі'],
      gift: ['Подарункова картка', 'На всі послуги студії'],
    },
  },
  be: {
    subject: 'Ваш сертыфікат Sanctum Sound: {tier}',
    hi: 'Вітаем, {name}!',
    intro: 'Дзякуй за пакупку! Сертыфікат ва ўкладанні (PDF), яго можна раздрукаваць або пераслаць.',
    heading: 'Ваш сертыфікат', voucher: 'Падарункавы сертыфікат', package: 'Пакет', value: 'Кошт', for: 'Для', code: 'Код сертыфіката',
    valid: 'Дзейнічае да', paid: 'Аплачана',
    how: 'Як скарыстацца: звяжыцеся з намі любым спосабам (тэлефон {phone}, e-mail {email}, Instagram або форма на sanctum-sa.com), назавіце код і дамоўцеся пра дату сесіі.',
    questions: 'Пытанні? Тэлефануйце {phone} або адкажыце на гэты ліст.',
    hours: 'Штодня 9:00-24:00', // opening hours, in the voucher footer
    tiers: {
      start: ['Старт', '2 гадз запісу з гукарэжысёрам'],
      song: ['Адна песня', '2 гадз запісу, зводка і мастэрынг 1 песні'],
      single: ['Сінгл гурта', '5 гадз запісу, зводка і мастэрынг 1 песні'],
      day: ['Дзень у студыі', '8 гадз запісу, зводка і мастэрынг 2 песень'],
      rehearsal: ['Пакет рэпетыцый', '10 гадз у рэпетыцыйнай зале'],
      gift: ['Падарункавая картка', 'На ўсе паслугі студыі'],
    },
  },
  ru: {
    subject: 'Ваш сертификат Sanctum Sound: {tier}',
    hi: 'Здравствуйте, {name}!',
    intro: 'Спасибо за покупку! Сертификат во вложении (PDF), его можно распечатать или переслать.',
    heading: 'Ваш сертификат', voucher: 'Подарочный сертификат', package: 'Пакет', value: 'Стоимость', for: 'Для', code: 'Код сертификата',
    valid: 'Действует до', paid: 'Оплачено',
    how: 'Как воспользоваться: свяжитесь с нами любым способом (телефон {phone}, e-mail {email}, Instagram или форма на sanctum-sa.com), назовите код и договоритесь о дате сессии.',
    questions: 'Вопросы? Звоните {phone} или ответьте на это письмо.',
    hours: 'Ежедневно 9:00-24:00', // opening hours, in the voucher footer
    tiers: {
      start: ['Старт', '2 ч записи со звукорежиссёром'],
      song: ['Одна песня', '2 ч записи, сведение и мастеринг 1 песни'],
      single: ['Сингл группы', '5 ч записи, сведение и мастеринг 1 песни'],
      day: ['День в студии', '8 ч записи, сведение и мастеринг 2 песен'],
      rehearsal: ['Пакет репетиций', '10 ч в репетиционной комнате'],
      gift: ['Подарочная карта', 'На все услуги студии'],
    },
  },
};

// White line icons (PNG, 48 px) for the voucher footer. The PDF converter doesn't draw SVG or emoji reliably.
const VOUCHER_ICONS = {
  phone: 'iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAEt0lEQVR4nNRaWagURxQ982I+kmgWsxiTiHkJSeTlI4FINjRxwwU33FBx/3EBlx9FEXHFDxXFDRRxx13cRZ/ivoO7oqKiPFRcEBR3UXE81+4Zqu9Ujz393pS+A4eaunWr6p7uruqq6qmAco4KKOcosBmTyWRjcgV5MZkdJeRW8j+8JSS0gcFMYDIQuWNYIpEYC8cICGDwYyQQxMNL8i+KOAKHSAtg8IVMzpPvIz42UEALOIQ5BjoiGPwNskEiBCz7lpyq2qsLxzAF/KjKBjHO7WEVWXadHMCfVwxzRd7J2nAIU0BVVXYL0aBF/gaHMAWUqLIiRMMJlf8dDmG+yM6psqgCjqt8QziEeQfOqrKoAg6RT4x8NY6Df+AIpoAzquxXRAAH8nMm65S5NRyhwAjkJoIzSmVeyZ8RDWtU3tnSQq+Ftqh81JfSBZX/Bo6gBRSrfFNEQzuVvwNHsAl4YeRr8zH6OFsDLO/GZKgyb4QjBARwHDyGN6uk8B7ZKawyg2/FZL4y3yOnwxFs+4ElKt/f4iPB12Sy2lLUlRfiBhzBJmAhvKuYQg0GW9/iN8pi68Hg18MhMgQwgEdM5irzAEtdvVa6S26DYyRsRl7xH5hcUuaaFHfU8KkGb/nxkeFTTJ8mcAjrnphBXEbmWJiufK4yGaR8ZC89FA6RCCtgIPIyKkFwk9OBgS9XfruR+eZtQ7/VcICCsALZsCBzxzWBAX+gbD0QXMwJVtHvXzhAwRvKZaa5b+TluZ9sOviPW3syqeoWuzhuySqAwT1gMlKZezKwlspvA5N+yq8SuZu+HWxt016FnEQeI++Tu8ixuYpORHFio3uZ1DJMMmUW+StY00/OhWyDeDB9xxt+ImoG+SnskLu+kzxJyjHNDn96jy2gOpPT8K5qCofJOv7yw/SVx264pZlNZE+yETkHueEpuQLe4dlVsyCSAD8wuWpLlXkjG2xu8ZUF3nxLM/JIVkJ8yJ3vyD7Ty/43DeI0WGkZk4nK3IzBzrL4LmBSD8EJQGALfgj5BbxzqTXIjs/IRewz3U7kO5ACK69k0laZZzLoPhZfOe2bDU+MDd19sWadD+EdkBX5/J8sVPVGs94IxBHgd3KAid64r2WjrUL8RZwM4oqGuTP9FyNaf9OY9DVM+1j39QFaXAGV4e0bflJF+8mmbPyepY4cRcos9T050Z96o/b3FYKLx9usL7Z4AvxGq8A7ldOnF9fILuxgF8oQ8jHCzPvns9EHsQbryxX5G5lL6O/InexvHvkJ8ozYAgQU8RDevG57lruT8oWnF1mqfrKh1A1TxEuyM7xB9kwVf0nOJE/la10UewzYwCDlYFeW0YUhLrL0HkfBm5F722U7Bmxgm3JSLcfrc0NcZE7fxFjOk11QFn0iT2CAIkR2cbWyuMmbWqbePfDm9n0hbclkcdAwXaDvL/IjbwKMzuXUTr58Vo9YRVagclJ+xv8t42oKWcPwWeyPu/wLEFCEbEvlLd0bpf+OJmPhz9TXUCcCAr0nk3LrZWkhV/Bz5A55i6e/YzsXYMKfWuXOyJa0aoQqso/oSwFPU4a3KsAExfwBb20lpyFfw9t/y3JFdmLy3UK+QevT83dHQFyU+3+rvAIAAP//M/OKGAAAAAZJREFUAwDANaiYeoWPhAAAAABJRU5ErkJggg==',
  mail: 'iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAADBklEQVR4nOyZSWgUQRSG3wxR8eQCiphDUJS4xIOgGJCIGNGDCFEPgjgQo3jwIIIXES8RFA/iRfCkBlc8iAt6UeMC5iCuoKhxAU9GRSReNeD4Pbs7FEV1T884me6G/uHnVVfVq/de1/amp0kyjibJOPIAkkYeQNJwBlAul0uILtgOZ0qyGIKP4NVCoXDebiyYDzg+A3EBrpJ04g4sEci3oMIOYACxXNKNuwSwOngoBgWc3yHpd17Ria/dwUPRaNhkdbwM5xcShvrg+2JiY1AYXUJE9RMxyei0EP03kgLg2wLEa6NqCN+atWAGUDaV/OhTgzD/ihEKL+ESSRj4sBS+CmsvRugugk9QPgonSoOhNtU2xcewLaxf6BKy8AluZ9buSwOAK3pMnoQtYX0qLiELs+A9Bu6DU2SMoGPDs+JdWC1xdKIC+O6o64aDGNksdQZjbkG8gyWJ58s/RAXQCvsc9dPhJQze9FOP/wJjNMNb4qUw0+xmeNr3xYnQAFhiw7CHYgf84OiyDr7H+C5Y9ZGrOnA3xUG4xtFFba7AB917w2HjxLoHaBqP2A/3wQmOcTRb1CTro8Rzfh7iHHQd07/gYXiE8X5X8q+qi4wuc8Sb0g5xGz7kGx4Rt+P6Ig6I9yLGObo8hD2uF1GXAIy+2xB6Rk91NL8VbzaeWTrLxHvrcx06P+BedM5IuM3qbuIooKubWzfWRUezJl9PsXcMTvaPxhPiLTOX83pstkY5H+lLUKg1F0JtJeIUnC3VQTepLpeBOJ3rOgPWQA8Qmi3q+h+JoaIb8yBsi+t8pP2gUOsMmPBPF11e7SFdQjdpjLHrt4ljGFuP2AMXwz/wOTzOkDekRjQ0gLFAmH/5h62kkQeQNPIAkkbmAzBTia9mg/8xKRVw+PIlKJgBvLA69aLoyh4bCj896bWqR1N18ybegLgi2cBaLuLbWrA/r/cjOiXduI7zXcGDnU5vhf2SXuj3op1mhTNhYyY0EP2ErT8Dk/6L6bN4v+auFSr9xZRF5BdZ0sgDSBqZD+AvAAAA//9MNjloAAAABklEQVQDAGrXQTM8jUDuAAAAAElFTkSuQmCC',
  pin: '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',
  globe: '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',
  instagram: 'iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAEVElEQVR4nNRaV2hUURCdDSr2AnY/FLGL2DsoKih2LInEWCAKIT8GsX5IjAoSYkFFxA/9sCZGJGKJRhSNfhgbRmM0UUQQRLEGiSVY1jO+t8vN7Gv73rYcOMzeMndm3n1l7r3biBo4GlEDh6MA/H5/a4gUcC7YB+wKtqTIohZ8A74Ai8BCn89Xa6fks2qE450gNoIZYDOKLb6DB8FcBPLBrJNpAHB+JsQpsAXFF1/BZARxxagxyagSzq+BuEDxd57Bt28JfFpl1BgyA+iYBnHcoO9t8Cj4DKzEFflIEQTstocYCA4Al4OjDbqlwe5JtcInBuEBnhgorofiDooh4MsGiFyDpn7wpTpQkAGcgZgvFEZC4T7FAfBnJMRdUV0Af1IDhSSlc0eIeaLzpng5z4DtexCbRfUi+NouUFAfYo5KnZEH4HaKP7aBj5Qy+xg6A0CyUNyPK+CnGABXNAWs0pmituk+HBAqQV99yiD81VNfm2OhXEYxADsO0VcvVsNuP9E+AaJUqapBn/+3kZpKyHd+BSUOqkS5eeBHkpkGIvxGYQJXygemg0fAMvCLX0MdWAxm6umJRDZYrTPbwJf3oqpJsE0x7hdKlnmSgfPDIQ6Dg226/iHt/Z4DE7/J+fiG/kUkAKjmUOjrzg7l4HyYeeWkc9QCgNoWMph2h6gER8DUT7uOZv4lkQdgzEkU6jzfFntAvqXa6oZ6k5aSvxR9OXXJIw9wPQP8wEI8B3sp1Zz68uv3qYlOU9Kek8WiqaNVzm/ln5cZmEj1nWcDC8yc143yrbKCQmdiJrmElwAWiHI+HLxqp6QHsVNUzyCX8LKol6/LYnKOy6I8lVzCywz0EOU75ByvRbkNbnFXF9NLAHWi3IWco7VBnatdDi8ByFSjDznHRFH+RdobLGx4CaBclNPJOeQC/SEe7r/kAl4COCHK43AfL7NTQp+hEJNF9WlyCU+pBFQeQwxSqmrAdKgWmfSfRdqORxulmj9gPe124aKSC+kOnTdo4gDySVuQfwLngAspdM3NmAtT58jeVtSSuSzSch832AUza510jEoypw+0l7Sv8mcKD3lOnbe0H/gRgQUNb8scAmfbdOV7fSmGP0vhjR+9BY0wxAkev+engOPBbqQ9C7dIW5iXulyu2gYgdyW6oM87SgDAt84Qb5WqWvjWin+oz4B0dgglDoaJcjAYNQC5jZLIAQR36tQAZC6fgalrTHGGvopbKaqvBX5YBdAD3ErxB++Ndhd1QV/l9jovNKaJzqPxwMgt7pgA/owh7WBFxUX4MytQkB+yTArN829ioHWg54+eU7AtkA8Xb4imH6TtbgRhdMS0BOJY6LD1jpgqcBXC/fJaAnY7kHa8ZHXElAq7BWqFz2Sw1RC7KbGQBef3yUqrY9bpEIUU+QPtcBH+MSsDCpcg+oMlFD+w7YFmzjOcpsyc2/AqahTYk6L7VwPe7OUdjutwvNROyVXClkho8P9W+QcAAP//94x7ZQAAAAZJREFUAwAIoaiILtFJJQAAAABJRU5ErkJggg==',
  clock: 'iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAE10lEQVR4nNSaZ4wVVRTHz1uIRj/YsCaiGEtQhKiRVSyoWQs2sBD9oJGVGE0wMSh8wBKNRk0ssSWoIZANBD5SwhJKKKF3QgkQCL2F3r5AqMvv8GYed87OvJl5M8vb/Sf/nL137j3nf2buu3PvnW0vbRztpY0jtwSampqexCjvgXfAjh4Vu+BOz26CCwqFwkLJAQXJAER/jnkN9oBXSTqcgItgI8n8LRWiogQQ3hfzK7xL8sFWOIhEJkhKpEoA4d0w/0pxqLQE5sABJLI+aYfECSC+P2ZEmSZrYSOcAQ/CI/Cwd60DvAHeDOtgb9iljK9+JDFKEiBRAoj/EvNzxOWh8DcC7pAUwGcnzBD4SUQTHVJ/SAxiEyDQT5ivQi5Nh58RZINkAP71SeiPuC7k8g/4/65c/0KM83pMg6k+CwdnmTkiYg3E/A7bmUvvE2tMVL+aMg4fxww31cfgc0nE60wFN3jsG9cen39hXoJHzaUG+j8R2S8iuL6MlsLrJSi+O4E2SwLgYx3mAa+4nn5dEva714t9nVOtE8Kj+Nhm20clMA/zlFN1BvbEwWJJCHw0BQKBhF3Fu+NzJTicZuLiedu2JqRzLwmKV/RLIz4rvGWGnZ3q0PZ0s7a2gkZrMF2dqkk4fF1SIssTcHxMleLvwsdS3DzmtqkxHd6VoPjz8AupHgabci0a33Qr7BD62JRHkvEmqRKIrW/30aY6MLRKj5XMrpDiCtH94TyCk5VSAfIYQp6fWswSp+oUvAZ3p7XgPgF9E7ri91YqPk+gQafUQ07VlbCnX3ATeNH0HS+tB1ZLSaubQFfTaJm0HlgtJa3ulvJG02i3tB5YLSWtbT4BdwjdZBqlWt/Hgdlkn+6hYdq9syJRAhZnJRvswusWqBuUbRUkcsaUS1Oym8Ae06ijZMMH8EBIvZ/I9hSJ3GrK+/w/3AT2hwSqGMzf8zGd4CAp7pEtdH/sJxJ3SHCbKYcmYO+WzTo1SOKkt6+9U8on0hjjKlECq0yj7pITQhKxT/tAjAurpaTVTWCqafSW5AwnET0Q01WufyeHxnR9x5RLWgMLLMaibhuvdaoeJOA6qSLQ9BDGXZMdR1Npu2mn0WmmPFCqD6thkluwT0BXpDOcKt3QdK7WngA992N0BLg6dW8+zy8EngAXZmJmO1V6/U+pHv6ToPjprnhF2Jt4iCm/yp14Ty4ziDkA84yp/tq2izpWmYLp5VTpq/zZvD5KxIH4umGZJcENln5H6G3bRiWg8/UKKZ4q+9DDpVqcbJEWBLHvw+gRjnuopjuyh4ndbIUcupjzTpr7SHARpcfjywjQQ1oI3p234lXDy2HiFZGrUToswHxkqtXxXO/QN1d4PmdJULziQ7Qsj+pXbjkt3keG7021boIaCDgRdpaM0CEDdW7XU3B7Mv1tuZPpixolWZB6aX7M7uN/+AuBtksK4FOXE9/A/hFN6vE5UmKQ5sBVx76uGjtENFkNJ4vziQkBe+h3tRSHhf+J6QX4ijQ/RPChffvQd5EkQNqPfLqV+1GKv412ki/OwWFSHDaHknaq9LRMz/3/kfDPQpVAVwCfInyjpETWD9360eJtj93S9b445MbCcVlWvJkScEEyd2PegDoz3S6X/t1A4f6rgd7lsWl/9FHILYFqoc3/t8oFAAAA//9EYQFzAAAABklEQVQDAGull6aEQ57nAAAAAElFTkSuQmCC',
};

// A voucher from the site: saved as unpaid in the voucher list, then a Stripe Checkout for its price.
// The price comes from VOUCHERS (the gift card amount is checked against GIFT_MIN and GIFT_MAX).
function voucher_(b) {
  const tier = VOUCHERS[b.tier] ? b.tier : null;
  const amount = tier && VOUCHERS[tier].price !== null ? VOUCHERS[tier].price : Number(b.amount);
  const name = clip_(b.name, 100);
  const email = clip_(b.email, 255);
  if (
    !tier ||
    !(Number.isInteger(amount) && amount >= GIFT_MIN && amount <= GIFT_MAX) ||
    !name ||
    !/^[^\s@<>,;]+@[^\s@<>,;]+\.[^\s@<>,;]+$/.test(email) ||
    !clip_(b.phone, 50)
  ) {
    return { error: 'invalid_voucher' };
  }
  const lang = (/^\/(en|uk|be|ru)\//.exec(b.return_path || '') || [null, 'pl'])[1];
  const code = newVoucherCode_();
  let sh, row;
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    if (tooMany_(b)) return { error: 'rate_limited' };
    sh = voucherSheet_(true);
    sh.appendRow([
      code, VOUCHER_STATUS.pending, VOUCHERS[tier].label, amount, VOUCHERS[tier].items, name, email,
      clip_(b.phone, 50), clip_(b.recipient, 60), clip_(b.message, 200), b.hide_price ? 'tak' : '', lang, new Date(), '', '', '', '',
    ]);
    row = sh.getLastRow();
    countBooking_(b);
  } finally {
    lock.releaseLock();
  }

  const t = VOUCHER_MAIL[lang];
  const page = /^\/(?:(?:en|uk|be|ru)\/)?voucher\/$/.test(b.return_path || '') ? b.return_path : '/voucher/';
  const session = stripePost_('checkout/sessions', {
    mode: 'payment',
    client_reference_id: code,
    customer_email: email,
    locale: ['pl', 'en', 'ru'].indexOf(b.locale) >= 0 ? b.locale : 'auto',
    expires_at: String(Math.floor(Date.now() / 1000) + CHECKOUT_MINUTES * 60),
    success_url: SITE + page + '?paid=1&session_id={CHECKOUT_SESSION_ID}',
    cancel_url: SITE + page,
    'line_items[0][quantity]': '1',
    'line_items[0][price_data][currency]': 'pln',
    'line_items[0][price_data][unit_amount]': String(amount * 100),
    'line_items[0][price_data][product_data][name]': 'Sanctum Sound: ' + t.voucher + ' "' + t.tiers[tier][0] + '"',
    'line_items[0][price_data][product_data][description]': t.tiers[tier][1],
  });
  if (!session || !session.url) {
    sh.getRange(row, VC['Status']).setValue(VOUCHER_STATUS.failed);
    return { error: 'checkout_failed' };
  }
  sh.getRange(row, VC['Stripe']).setValue(session.id);
  return { ok: true, checkout_url: session.url };
}

// SV-XXXX-XXXX from letters and digits that can't be mixed up (no 0/O, 1/I/L).
function newVoucherCode_() {
  const abc = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, Utilities.getUuid() + Date.now());
  let s = '';
  for (let i = 0; i < 8; i++) s += abc[(bytes[i] + 256) % abc.length];
  return 'SV-' + s.slice(0, 4) + '-' + s.slice(4);
}

function voucherSheet_(create) {
  const props = PropertiesService.getScriptProperties();
  const id = props.getProperty('VOUCHER_SHEET_ID');
  if (id) return SpreadsheetApp.openById(id).getSheets()[0];
  if (!create) return null;
  const ss = SpreadsheetApp.create('Sanctum Sound - vouchery');
  ss.setSpreadsheetTimeZone(TZ);
  const sh = ss.getSheets()[0];
  sh.setName('Vouchery');
  sh.appendRow(VOUCHER_COLUMNS);
  sh.getRange(1, 1, 1, VOUCHER_COLUMNS.length).setFontWeight('bold');
  sh.setFrozenRows(1);
  sh.getRange('M:N').setNumberFormat('dd.MM.yyyy HH:mm');
  sh.getRange('O:O').setNumberFormat('dd.MM.yyyy');
  props.setProperty('VOUCHER_SHEET_ID', ss.getId());
  return sh;
}

function findVoucherRow_(sh, code) {
  if (sh.getLastRow() < 2) return 0;
  const cell = sh.getRange(2, VC['Kod'], sh.getLastRow() - 1, 1).createTextFinder(code).matchEntireCell(true).findNext();
  return cell ? cell.getRow() : 0;
}

// Paid on Stripe (the page's confirm or the 5-minute sync): mark it paid, then email the voucher.
function voucherPaid_(code, session) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) return; // the next sync tries again
  let v;
  try {
    const sh = voucherSheet_(false);
    const row = sh ? findVoucherRow_(sh, code) : 0;
    if (!row) return console.error('Paid voucher not in the list: ' + code + ' (' + session.id + ')');
    const range = sh.getRange(row, 1, 1, VOUCHER_COLUMNS.length);
    const r = range.getValues()[0];
    if (r[VC['Status'] - 1] === VOUCHER_STATUS.paid) return;
    const paidAt = new Date();
    const until = new Date(paidAt.getTime());
    until.setMonth(until.getMonth() + VOUCHER_VALID_MONTHS);
    const tier = Object.keys(VOUCHERS).find((k) => VOUCHERS[k].label === r[VC['Pakiet'] - 1]) || 'gift';
    v = {
      code: code, tier: tier, amount: r[VC['Kwota (zł)'] - 1], name: r[VC['Kupujący'] - 1], email: r[VC['E-mail'] - 1],
      phone: r[VC['Telefon'] - 1], recipient: r[VC['Dla kogo'] - 1], message: r[VC['Dedykacja'] - 1],
      hidePrice: r[VC['Ukryta kwota'] - 1] === 'tak',
      lang: VOUCHER_MAIL[r[VC['Język'] - 1]] ? r[VC['Język'] - 1] : 'pl', until: until,
      paid: session.amount_total / 100 + ' ' + String(session.currency || 'pln').toUpperCase(),
    };
    sh.getRange(row, VC['Status']).setValue(VOUCHER_STATUS.paid);
    sh.getRange(row, VC['Opłacono']).setValue(paidAt);
    sh.getRange(row, VC['Ważny do']).setValue(until);
    sh.getRange(row, VC['Stripe']).setValue(session.id + ', ' + v.paid);
    const mailed = sendVoucher_(v);
    if (!mailed) sh.getRange(row, VC['Stripe']).setValue(session.id + ', ' + v.paid + ', BŁĄD WYSYŁKI MAILA');
    const d = (x) => Utilities.formatDate(x, TZ, 'dd.MM.yyyy');
    telegram_(
      [
        '🎁 <b>Sprzedany voucher</b>',
        '',
        '<b>' + tgEsc_(VOUCHERS[tier].label) + ', ' + v.amount + ' zł</b>',
        tgEsc_(VOUCHERS[tier].items),
        'Kod: <b>' + code + '</b>',
        'Ważny do: ' + d(until),
        'Kupujący: ' + tgEsc_(v.name),
        'Telefon: ' + tgEsc_(v.phone || '-'),
        'E-mail: ' + tgEsc_(v.email),
        'Dla kogo: ' + tgEsc_(v.recipient || '-'),
        'Dedykacja: ' + tgEsc_(v.message || '-'),
        'Kwota na voucherze: ' + (v.hidePrice ? 'ukryta' : 'widoczna'),
        'Stripe: ' + tgEsc_(session.id) + ', ' + v.paid,
        'Język strony: ' + v.lang.toUpperCase(),
        mailed ? 'Voucher wysłany klientowi mailem.' : '⚠️ Mail z voucherem nie wyszedł, wyślij go ręcznie.',
        '',
        'Lista voucherów: ' + sh.getParent().getUrl(),
      ].join('\n')
    );
  } finally {
    lock.releaseLock();
  }
}

// The voucher email in the buyer's language, with the printable voucher as a PDF attachment.
function sendVoucher_(v) {
  const t = VOUCHER_MAIL[v.lang];
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const fill = (s) => s.replace('{name}', v.name).replace('{tier}', t.tiers[v.tier][0]).replace('{phone}', STUDIO_PHONE).replace('{email}', STUDIO_EMAIL);
  const until = Utilities.formatDate(v.until, TZ, 'dd.MM.yyyy');
  const rows = [
    [t.package, t.tiers[v.tier][0] + ': ' + t.tiers[v.tier][1]],
    [t.value, v.amount + ' zł'],
    v.recipient ? [t.for, v.recipient] : null,
    [t.valid, until],
    [t.paid, v.paid],
  ].filter(Boolean);
  const body = [fill(t.hi), '', fill(t.intro), '', t.code + ': ' + v.code]
    .concat(rows.map((r) => r[0] + ': ' + r[1]))
    .concat(['', fill(t.how), '', fill(t.questions), '', 'Sanctum Sound', STUDIO_ADDRESS, SITE])
    .join('\n');

  const cell = 'font-family:Helvetica,Arial,sans-serif;';
  const detailRows = rows
    .map(
      (r) =>
        '<tr><td style="' + cell + 'padding:12px 16px 12px 0;border-top:1px solid #262626;color:#9a9a9a;font-size:14px;white-space:nowrap;">' + esc(r[0]) + '</td>' +
        '<td align="right" style="' + cell + 'padding:12px 0;border-top:1px solid #262626;color:#ffffff;font-size:14px;font-weight:bold;">' + esc(r[1]) + '</td></tr>'
    )
    .join('');
  // Same dark card as the booking confirmation.
  const html =
    '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width">' +
    '<meta name="color-scheme" content="dark"><meta name="supported-color-schemes" content="dark"></head>' +
    '<body style="margin:0;padding:0;background:#000000;">' +
    '<div style="display:none;max-height:0;overflow:hidden;">' + esc(fill(t.intro)) + '</div>' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#000000;"><tr><td align="center" style="padding:28px 12px;">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">' +
    '<tr><td align="center" style="padding:0 0 20px;"><a href="' + SITE + '"><img src="' + SITE + '/icon-192.png" width="112" height="112" alt="Sanctum Sound" style="display:block;border:0;"></a></td></tr>' +
    '<tr><td style="background:#0d0d0d;border:1px solid #262626;border-radius:14px;padding:32px 28px;">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0">' +
    '<tr><td style="' + cell + 'color:#ffffff;font-size:13px;letter-spacing:2px;text-transform:uppercase;padding-bottom:10px;">🎁&nbsp; ' + esc(t.heading) + '</td></tr>' +
    '<tr><td style="' + cell + 'color:#ffffff;font-size:15px;line-height:1.5;padding-bottom:22px;">' + esc(fill(t.hi)) + ' ' + esc(fill(t.intro)) + '</td></tr>' +
    '<tr><td style="background:#ffffff;border-radius:10px;padding:20px 22px;">' +
    '<div style="' + cell + 'color:#555555;font-size:13px;text-transform:uppercase;letter-spacing:1px;">' + esc(t.code) + '</div>' +
    '<div style="font-family:Consolas,Menlo,monospace;color:#000000;font-size:30px;font-weight:bold;line-height:1.3;padding-top:4px;letter-spacing:2px;">' + esc(v.code) + '</div>' +
    '<div style="' + cell + 'color:#000000;font-size:16px;font-weight:bold;padding-top:6px;">' + esc(t.tiers[v.tier][0]) + ', ' + esc(v.amount) + ' zł</div>' +
    '</td></tr>' +
    '<tr><td style="padding-top:18px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">' + detailRows + '</table></td></tr>' +
    '<tr><td style="' + cell + 'padding-top:22px;color:#cfcfcf;font-size:14px;line-height:1.5;">' + esc(fill(t.how)) + '</td></tr>' +
    '<tr><td style="' + cell + 'padding-top:12px;color:#cfcfcf;font-size:14px;line-height:1.5;">' + esc(fill(t.questions)) + '</td></tr>' +
    '</table></td></tr>' +
    '<tr><td align="center" style="' + cell + 'padding:22px 0 0;color:#6b6b6b;font-size:12px;line-height:1.6;">Sanctum Sound · ' + esc(STUDIO_ADDRESS) + '<br>' +
    '<a href="' + SITE + '" style="color:#9a9a9a;">sanctum-sa.com</a></td></tr>' +
    '</table></td></tr></table></body></html>';

  const attachments = [];
  try {
    attachments.push(voucherPdf_(v, t, until, esc, fill));
  } catch (err) {
    console.error('Voucher PDF failed for ' + v.code + ': ' + err);
  }
  try {
    MailApp.sendEmail({
      to: v.email,
      subject: fill(t.subject),
      body: body,
      htmlBody: html,
      name: 'Sanctum Sound',
      replyTo: STUDIO_EMAIL,
      attachments: attachments,
    });
    return true;
  } catch (err) {
    console.error('Voucher email to ' + v.email + ' failed: ' + err);
    return false;
  }
}

// The printable voucher: one A4 page in the site's black-and-white style. It goes to the recipient, so
// the amount is left off when the buyer ticked "hide the price" (the email to the buyer still shows it).
function voucherPdf_(v, t, until, esc, fill) {
  let logo = '';
  try {
    const img = UrlFetchApp.fetch(SITE + '/icon-512.png', { muteHttpExceptions: true });
    if (img.getResponseCode() === 200) {
      logo = '<img src="data:image/png;base64,' + Utilities.base64Encode(img.getContent()) + '" width="120" height="120" style="display:block;margin:0 auto 14px;">';
    }
  } catch (err) {
    // no logo, the name is printed anyway
  }
  const f = 'font-family:Helvetica,Arial,sans-serif;';
  const html =
    '<html><head><meta charset="utf-8"><style>@page{size:A4;margin:16mm;}body{margin:0;' + f + 'color:#000;}</style></head><body>' +
    '<div style="border:2px solid #000;border-radius:12px;overflow:hidden;">' +
    '<div style="background:#000;color:#fff;text-align:center;padding:26px 20px 22px;">' + logo +
    '<div style="' + f + 'font-size:34px;font-weight:bold;">' + esc(t.voucher) + '</div></div>' +
    '<div style="padding:30px 36px 26px;">' +
    // the package: the main thing on the voucher
    '<div style="border:3px solid #000;border-radius:12px;padding:22px 20px 24px;margin:0 10px;text-align:center;">' +
    '<div style="' + f + 'font-size:42px;font-weight:bold;line-height:1.15;">' + esc(t.tiers[v.tier][0]) + '</div>' +
    '<div style="width:56px;height:4px;background:#000;margin:14px auto;"></div>' +
    '<div style="' + f + 'font-size:21px;font-weight:bold;color:#111;line-height:1.4;">' + esc(t.tiers[v.tier][1]) + '</div></div>' +
    // the fields: one boxed cell each, label on top and the value under it
    '<table cellpadding="0" cellspacing="0" style="width:100%;table-layout:fixed;margin-top:18px;border-collapse:separate;border-spacing:10px 0;"><tr>' +
    (v.hidePrice ? [] : [[t.value, v.amount + ' zł']])
      .concat([[t.valid, until]])
      .concat(v.recipient ? [[t.for, v.recipient]] : [])
      .map(
        (c) =>
          '<td style="border:1.5px solid #000;border-radius:10px;padding:14px 12px;text-align:center;vertical-align:top;">' +
          '<div style="' + f + 'font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#666;">' + esc(c[0]) + '</div>' +
          '<div style="' + f + 'font-size:20px;font-weight:bold;margin-top:6px;">' + esc(c[1]) + '</div></td>'
      )
      .join('') +
    '</tr></table>' +
    (v.message
      ? '<div style="background:#f2f2f2;border-left:4px solid #000;border-radius:6px;padding:16px 20px;margin:20px 10px 0;">' +
        '<div style="' + f + 'font-size:17px;font-style:italic;color:#222;line-height:1.5;">„' + esc(v.message) + '”</div></div>'
      : '') +
    // the code on a black band, the part the recipient reads out when booking
    '<div style="background:#000;border-radius:10px;padding:18px 16px;margin:24px 10px 0;text-align:center;">' +
    '<div style="' + f + 'font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#aaa;">' + esc(t.code) + '</div>' +
    '<div style="font-family:Courier,monospace;font-size:32px;font-weight:bold;letter-spacing:4px;color:#fff;margin-top:6px;">' + esc(v.code) + '</div></div>' +
    '<div style="' + f + 'text-align:center;font-size:14px;color:#333;margin-top:22px;line-height:1.5;">' + esc(fill(t.how)) + '</div>' +
    '</div>' +
    // footer: every way to reach the studio, each with its icon, two per row
    '<div style="background:#000;color:#fff;padding:20px 26px 22px;">' +
    '<div style="' + f + 'font-size:18px;font-weight:bold;text-align:center;margin-bottom:12px;">Sanctum Sound</div>' +
    '<table cellpadding="0" cellspacing="0" style="width:100%;table-layout:fixed;">' +
    [
      [['phone', STUDIO_PHONE], ['mail', STUDIO_EMAIL]],
      [['pin', STUDIO_ADDRESS], ['instagram', STUDIO_INSTAGRAM]],
      [['globe', 'sanctum-sa.com'], ['clock', t.hours]],
    ]
      .map(
        (row) =>
          '<tr>' +
          row
            .map(
              (c) =>
                '<td style="padding:7px 8px;vertical-align:middle;">' +
                '<table cellpadding="0" cellspacing="0"><tr>' +
                '<td style="width:30px;vertical-align:middle;"><img src="data:image/png;base64,' + VOUCHER_ICONS[c[0]] + '" width="22" height="22" style="display:block;"></td>' +
                '<td style="' + f + 'font-size:15px;color:#fff;vertical-align:middle;line-height:1.35;">' +
                // the address goes on two lines: street, then postcode and city
                (c[0] === 'pin' ? esc(c[1]).replace(', ', '<br>') : esc(c[1])) + '</td>' +
                '</tr></table></td>'
            )
            .join('') +
          '</tr>'
      )
      .join('') +
    '</table></div>' +
    '</div></body></html>';
  return Utilities.newBlob(html, 'text/html', 'voucher.html').getAs('application/pdf').setName('Sanctum-Sound-voucher-' + v.code + '.pdf');
}

// Run by the 5-minute sync: unpaid vouchers whose Stripe Checkout has run out are marked expired.
function expireVouchers_() {
  const sh = voucherSheet_(false);
  if (!sh || sh.getLastRow() < 2) return;
  const n = sh.getLastRow() - 1;
  const status = sh.getRange(2, VC['Status'], n, 1).getValues();
  const created = sh.getRange(2, VC['Utworzono'], n, 1).getValues();
  status.forEach((s, i) => {
    const at = created[i][0] instanceof Date ? created[i][0].getTime() : 0;
    if (s[0] === VOUCHER_STATUS.pending && at && Date.now() - at > HOLD_MINUTES * 60000) {
      sh.getRange(i + 2, VC['Status']).setValue(VOUCHER_STATUS.expired);
    }
  });
}

// Run once from the editor to try the voucher email: sends a sample voucher (not saved anywhere) to
// the studio's own inbox.
function voucherTest() {
  const until = new Date();
  until.setMonth(until.getMonth() + VOUCHER_VALID_MONTHS);
  const ok = sendVoucher_({
    code: 'SV-TEST-TEST', tier: 'song', amount: VOUCHERS.song.price, name: 'Sanctum Sound', email: STUDIO_EMAIL,
    phone: STUDIO_PHONE, recipient: 'Anna', message: 'Wszystkiego najlepszego!', lang: 'pl', until: until, paid: VOUCHERS.song.price + ' PLN',
  });
  console.log(ok ? 'Sent to ' + STUDIO_EMAIL + '. Check the inbox.' : 'Not sent, see the error above.');
}

function stripePost_(path, params) {
  const key = PropertiesService.getScriptProperties().getProperty('STRIPE_SECRET_KEY');
  if (!key) return null;
  const res = UrlFetchApp.fetch('https://api.stripe.com/v1/' + path, {
    method: 'post',
    headers: { Authorization: 'Bearer ' + key },
    payload: params, // sent form-encoded
    muteHttpExceptions: true,
  });
  if (res.getResponseCode() !== 200) {
    console.error('Stripe ' + res.getResponseCode() + ': ' + res.getContentText());
    return null;
  }
  return JSON.parse(res.getContentText());
}

function stripe_(path) {
  const key = PropertiesService.getScriptProperties().getProperty('STRIPE_SECRET_KEY');
  if (!key) return null;
  const res = UrlFetchApp.fetch('https://api.stripe.com/v1/' + path, {
    headers: { Authorization: 'Bearer ' + key },
    muteHttpExceptions: true,
  });
  if (res.getResponseCode() !== 200) {
    console.error('Stripe ' + res.getResponseCode() + ': ' + res.getContentText());
    return null;
  }
  return JSON.parse(res.getContentText());
}

// ---------------------------------------------------------------- Telegram

// Optional: a Telegram bot posts bookings, payments, requests and contact messages to the studio's
// chat (script properties TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID). Messages are in Polish, like the
// calendar. Never throws: a Telegram problem must not stop a booking or a payment.
// quiet: the message arrives without a sound (holds and expiries); payments and requests ring.
function telegram_(text, quiet) {
  const props = PropertiesService.getScriptProperties();
  const token = String(props.getProperty('TELEGRAM_BOT_TOKEN') || '').trim();
  const chats = String(props.getProperty('TELEGRAM_CHAT_ID') || '')
    .split(',')
    .map((c) => c.trim())
    .filter(Boolean);
  if (!token || !chats.length) return false;
  let ok = true;
  try {
    const res = UrlFetchApp.fetchAll(
      chats.map((chat) => ({
        url: 'https://api.telegram.org/bot' + token + '/sendMessage',
        method: 'post',
        contentType: 'application/json',
        payload: JSON.stringify({
          chat_id: chat,
          text: text,
          parse_mode: 'HTML',
          disable_web_page_preview: true,
          disable_notification: Boolean(quiet),
        }),
        muteHttpExceptions: true,
      }))
    );
    res.forEach((r, i) => {
      if (r.getResponseCode() !== 200) {
        ok = false;
        console.error('Telegram ' + r.getResponseCode() + ' (chat ' + chats[i] + '): ' + r.getContentText());
      }
    });
  } catch (err) {
    console.error('Telegram failed: ' + String(err).split(token).join('***'));
    return false;
  }
  return ok;
}

const tgEsc_ = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// A booking from the calendar event: when, then the details the event already holds
// (name, phone, email, amount, extras, notes, reference, and the Stripe payment once paid).
function telegramBooking_(ev, heading, quiet) {
  try {
    const start = ev.getStartTime();
    const end = ev.getEndTime();
    const hours = Math.round((end.getTime() - start.getTime()) / 360000) / 10;
    const day = MAIL.pl.days[Number(Utilities.formatDate(start, TZ, 'u')) - 1] || '';
    const service = SERVICE_LABELS[ev.getTag('sanctumService')] || '';
    const lang = (ev.getTag('sanctumLang') || 'pl').toUpperCase();
    const lines = [
      heading,
      '',
      '<b>' + tgEsc_(service) + '</b>',
      '<b>' + day + ', ' + Utilities.formatDate(start, TZ, 'dd.MM.yyyy') + ', ' +
        Utilities.formatDate(start, TZ, 'HH:mm') + '–' + Utilities.formatDate(end, TZ, 'HH:mm') + '</b> (' + hours + ' godz.)',
      '',
    ]
      .concat(ev.getDescription().split('\n').filter(Boolean).map(tgEsc_))
      .concat(['Język strony: ' + lang]);
    telegram_(lines.join('\n'), quiet);
  } catch (err) {
    console.error('Telegram message failed: ' + err);
  }
}

// Recording and mixing requests and contact form messages. The site emails these to the studio
// itself and also sends them here, only so they reach Telegram too (nothing is booked).
const REQUEST_LABELS = { recording: 'Nagrywanie', mixing: 'Miks i mastering' };

function notify_(b) {
  const contact = b.kind === 'contact';
  const name = clip_(b.name, 100);
  if ((!contact && !REQUEST_LABELS[b.service]) || !name || (!clip_(b.email, 255) && !clip_(b.phone, 50))) {
    return { error: 'invalid_request' };
  }
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) return { error: 'busy' };
  try {
    if (tooMany_(b)) return { error: 'rate_limited' };
    countBooking_(b);
  } finally {
    lock.releaseLock();
  }
  const topic = clip_(b.topic, 100);
  const lines = [
    contact
      ? '✉️ <b>Nowa wiadomość z formularza kontaktowego</b>' + (topic ? ': ' + tgEsc_(topic) : '')
      : '📝 <b>Nowe zapytanie: ' + REQUEST_LABELS[b.service] + '</b>',
    '',
    'Imię: ' + tgEsc_(name),
    'Telefon: ' + tgEsc_(clip_(b.phone, 50) || '-'),
    'E-mail: ' + tgEsc_(clip_(b.email, 255) || '-'),
    (contact ? 'Wiadomość: ' : 'Opis: ') + tgEsc_(clip_(contact ? b.message : b.notes, 2500) || '-'),
    'Język strony: ' + tgEsc_(clip_(b.language, 5).toUpperCase() || 'PL'),
    '',
    contact ? 'Odpowiedz klientowi telefonicznie lub mailem.' : 'Klient czeka na telefon lub maila, żeby ustalić termin.',
  ];
  telegram_(lines.join('\n'));
  return { ok: true };
}

// Run once from the editor after adding TELEGRAM_BOT_TOKEN and writing anything to the bot (or in
// the group with the bot): prints the chat ids the bot can see, to paste into TELEGRAM_CHAT_ID.
function telegramChatIds() {
  const token = String(PropertiesService.getScriptProperties().getProperty('TELEGRAM_BOT_TOKEN') || '').trim();
  if (!token) return console.log('Add the TELEGRAM_BOT_TOKEN script property first.');
  const res = UrlFetchApp.fetch('https://api.telegram.org/bot' + token + '/getUpdates', { muteHttpExceptions: true });
  if (res.getResponseCode() !== 200) return console.log('Telegram ' + res.getResponseCode() + ': ' + res.getContentText());
  const seen = {};
  (JSON.parse(res.getContentText()).result || []).forEach((u) => {
    const m = u.message || u.channel_post || u.my_chat_member || {};
    if (m.chat) seen[m.chat.id] = m.chat.title || [m.chat.first_name, m.chat.last_name].filter(Boolean).join(' ') || m.chat.username || '';
  });
  const ids = Object.keys(seen);
  if (!ids.length) return console.log('No chats yet. Send any message to the bot (or in the group), then run this again.');
  ids.forEach((id) => console.log('TELEGRAM_CHAT_ID: ' + id + '   (' + seen[id] + ')'));
}

// Run once from the editor to check the bot: sends a test message to TELEGRAM_CHAT_ID.
function telegramTest() {
  const sent = telegram_('✅ Sanctum Sound: Telegram działa. Tu będą przychodzić rezerwacje i zapytania ze strony.');
  console.log(sent ? 'Sent. Check Telegram.' : 'Not sent. Check TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID (and the Executions log).');
}

// ---------------------------------------------------------------- setup and helpers

// Run once from the editor (and again after updating this file): creates the 5-minute Stripe sync,
// makes the voucher list and asks for the calendar, email and Sheets permissions.
function setup() {
  ScriptApp.getProjectTriggers()
    .filter((t) => t.getHandlerFunction() === 'syncStripe')
    .forEach((t) => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('syncStripe').timeBased().everyMinutes(5).create();
  console.log('Calendar: ' + calendar_().getName() + '. Stripe sync runs every 5 minutes.');
  console.log('Emails left today: ' + MailApp.getRemainingDailyQuota()); // also asks for the email permission
  console.log('Voucher list: ' + voucherSheet_(true).getParent().getUrl()); // also asks for the Sheets permission
}

function calendar_() {
  const id = PropertiesService.getScriptProperties().getProperty('CALENDAR_ID');
  const cal = id ? CalendarApp.getCalendarById(id) : CalendarApp.getDefaultCalendar();
  if (!cal) throw new Error('Calendar not found: ' + id);
  return cal;
}

const pad_ = (n) => (n < 10 ? '0' : '') + n;

// Instant for a Warsaw-local date and minutes after midnight.
function at_(date, minutes) {
  return Utilities.parseDate(date + ' ' + pad_(Math.floor(minutes / 60)) + ':' + pad_(minutes % 60), TZ, 'yyyy-MM-dd HH:mm');
}

function local_(d) {
  const hm = Utilities.formatDate(d, TZ, 'HH:mm').split(':');
  return { date: Utilities.formatDate(d, TZ, 'yyyy-MM-dd'), minutes: Number(hm[0]) * 60 + Number(hm[1]) };
}

function nextDay_(date) {
  return Utilities.formatDate(new Date(at_(date, 0).getTime() + 36 * 3600 * 1000), TZ, 'yyyy-MM-dd');
}

function ageMinutes_(ev) {
  const created = Number(ev.getTag('sanctumCreated') || 0);
  return created ? (Date.now() - created) / 60000 : 0;
}

const clip_ = (s, n) => String(s || '').trim().slice(0, n);

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
