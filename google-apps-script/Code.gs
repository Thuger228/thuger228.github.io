/**
 * Sanctum Sound booking backend: Google Apps Script running in the studio's Google account.
 *
 * The studio's Google Calendar is the booking database:
 *   - the booking page reads busy times from it (event titles never leave this script),
 *   - every booking made on the site becomes a calendar event,
 *   - rehearsal room bookings get a Stripe Checkout for the exact amount, created here,
 *   - Stripe payments are confirmed by asking Stripe directly, then the event is marked paid and the
 *     customer gets a confirmation email with a calendar invite (in the language they booked in).
 * Anything you put in the calendar yourself (a session booked by phone, a day off) blocks those times.
 *
 * Script properties (Project Settings → Script properties):
 *   STRIPE_SECRET_KEY  a Stripe *restricted* key with "Checkout Sessions: Write" only (rk_live_...)
 *   CALENDAR_ID        optional; the calendar to use. Default: this account's main calendar.
 *
 * Setup: paste this file, set the properties, run setup() once, then Deploy → New deployment →
 * Web app (Execute as: Me, Who has access: Anyone). See STRIPE-SETUP.md for the full steps.
 */

const TZ = 'Europe/Warsaw';
const MIN_NOTICE_MINUTES = 240; // a booking must start at least 4 hours from now (same as the site)
const MAX_REHEARSAL_HOURS = 4; // longest rehearsal (same as maxQuantity in src/data/booking.ts)
const CHECKOUT_MINUTES = 31; // the Stripe Checkout expires after this (Stripe's minimum is 30)
const HOLD_MINUTES = 35; // an unpaid booking holds its slot this long while the customer pays
const KEEP_UNPAID_HOURS = 25; // unpaid bookings stay in the calendar (as expired) this long, then are deleted
const SERVICE_LABELS = { recording: 'Nagrywanie', rehearsal: 'Sala prób' };
const SITE = 'https://sanctum-sa.com';
const STUDIO_EMAIL = 'support@sanctum-sa.com'; // sender and organizer of the customer's calendar invite
const STUDIO_PHONE = '+48 881 238 684';
const STUDIO_ADDRESS = 'Aleja Stanów Zjednoczonych 67, 03-770 Warszawa';

// Rehearsal room prices in PLN, charged on Stripe. Keep in line with src/data/booking.ts.
// perHour extras change the hourly price; the others are a fixed charge per rehearsal.
const REHEARSAL = {
  perHour: 60,
  options: {
    cymbals: { price: 10, perHour: false, label: 'zestaw talerzy' },
    double_pedal: { price: 5, perHour: false, label: 'podwójna stopa' },
    solo: { price: -10, perHour: true, label: 'tylko perkusja lub wokal' },
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
    (b.service === 'rehearsal' && duration > MAX_REHEARSAL_HOURS * 60)
  ) {
    return { error: 'invalid_booking' };
  }
  const start = at_(b.date, start_minute);
  const end = new Date(start.getTime() + duration * 60000);
  if (start.getTime() < Date.now() + MIN_NOTICE_MINUTES * 60000) return { error: 'too_soon' };

  // The price is worked out here from REHEARSAL, never taken from the page.
  const hours = duration / 60;
  const options = Object.keys(REHEARSAL.options).filter((k) => (b.options || []).indexOf(k) >= 0);
  const priced = b.service === 'rehearsal' && hours === Math.floor(hours);
  const opt = (k) => REHEARSAL.options[k];
  const hourly = options.filter((k) => opt(k).perHour);
  const fixed = options.filter((k) => !opt(k).perHour);
  const perHour = priced ? hourly.reduce((sum, k) => sum + opt(k).price, REHEARSAL.perHour) : 0;
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
        'Dodatki: ' + (options.map((k) => REHEARSAL.options[k].label).join(', ') || '-'),
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
  if (!checkout) return { ok: true };

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
      'Sala prób - 1 godz.' + (hourly.length ? ' (' + hourly.map((k) => opt(k).label).join(', ') + ')' : ''),
    'line_items[0][price_data][product_data][description]': b.date + ', ' + pad_(Math.floor(start_minute / 60)) + ':' + pad_(start_minute % 60),
  };
  // Fixed extras: one line each, charged once per rehearsal.
  fixed.forEach((k, i) => {
    const line = 'line_items[' + (i + 1) + ']';
    params[line + '[quantity]'] = '1';
    params[line + '[price_data][currency]'] = 'pln';
    params[line + '[price_data][unit_amount]'] = String(opt(k).price * 100);
    params[line + '[price_data][product_data][name]'] = 'Sala prób: ' + opt(k).label;
  });
  const session = stripePost_('checkout/sessions', params);
  if (!session || !session.url) {
    // No payment page: free the slot, and the site tells the customer nothing was booked.
    // The reason is in Executions (the "Stripe ..." error line).
    ev.setTag('sanctumStatus', 'expired');
    ev.setTitle('⌛ Błąd płatności Stripe: ' + label + ' - ' + name);
    return { error: 'checkout_failed' };
  }
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
    if (s.payment_status === 'paid' && /^SS-/.test(s.client_reference_id || '')) markPaid_(s.client_reference_id, s);
  });

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
      }
    });
}

function markPaid_(reference, session) {
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
    options: { cymbals: 'Zestaw talerzy', double_pedal: 'Podwójna stopa', solo: 'Tylko perkusja lub tylko wokal' },
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
    options: { cymbals: 'Cymbal set', double_pedal: 'Double bass drum pedal', solo: 'Drums or vocals only' },
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
    options: { cymbals: 'Комплект тарілок', double_pedal: 'Подвійна педаль', solo: 'Тільки барабани або тільки вокал' },
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
    options: { cymbals: 'Камплект талерак', double_pedal: 'Падвойная педаль', solo: 'Толькі барабаны або толькі вакал' },
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
    options: { cymbals: 'Комплект тарелок', double_pedal: 'Двойная педаль', solo: 'Только барабаны или только вокал' },
  },
};

// Payment confirmation to the customer, with the booking as a calendar invite (.ics, which Gmail,
// Outlook and Apple Mail show as an invite) and an "add to Google Calendar" link. Sent once per booking.
function sendConfirmation_(ev, session) {
  if (ev.getTag('sanctumMailed')) return;
  const details = session.customer_details || {};
  const to = String(details.email || session.customer_email || ev.getTag('sanctumEmail') || '').trim();
  if (!/^[^\s@<>,;]+@[^\s@<>,;]+\.[^\s@<>,;]+$/.test(to)) return;
  const t = MAIL[ev.getTag('sanctumLang')] || MAIL.pl;
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

// ---------------------------------------------------------------- setup and helpers

// Run once from the editor: creates the 5-minute Stripe sync and asks for calendar permission.
function setup() {
  ScriptApp.getProjectTriggers()
    .filter((t) => t.getHandlerFunction() === 'syncStripe')
    .forEach((t) => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('syncStripe').timeBased().everyMinutes(5).create();
  console.log('Calendar: ' + calendar_().getName() + '. Stripe sync runs every 5 minutes.');
  console.log('Emails left today: ' + MailApp.getRemainingDailyQuota()); // also asks for the email permission
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
