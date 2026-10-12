/**
 * Sanctum Sound booking backend: Google Apps Script running in the studio's Google account.
 *
 * The studio's Google Calendar is the booking database:
 *   - the booking page reads busy times from it (event titles never leave this script),
 *   - every booking made on the site becomes a calendar event,
 *   - Stripe payments are confirmed by asking Stripe directly, then the event is marked paid.
 * Anything you put in the calendar yourself (a session booked by phone, a day off) blocks those times.
 *
 * Script properties (Project Settings → Script properties):
 *   STRIPE_SECRET_KEY  a Stripe *restricted* key with "Checkout Sessions: Read" only (rk_live_...)
 *   CALENDAR_ID        optional; the calendar to use. Default: this account's main calendar.
 *
 * Setup: paste this file, set the properties, run setup() once, then Deploy → New deployment →
 * Web app (Execute as: Me, Who has access: Anyone). See STRIPE-SETUP.md for the full steps.
 */

const TZ = 'Europe/Warsaw';
const HOLD_MINUTES = 30; // an unpaid booking holds its slot this long while the customer pays
const KEEP_UNPAID_HOURS = 25; // a Stripe Payment Link checkout can be paid up to 24 h after it starts
const SERVICE_LABELS = { recording: 'Nagrywanie', rehearsal: 'Sala prób' };
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

// ---------------------------------------------------------------- web app entry points

function doGet(e) {
  const p = e.parameter || {};
  if (p.action === 'busy') return json_(busy_(p.service, p.from, p.to));
  return json_({ ok: true, service: 'sanctum-booking' });
}

// The booking page posts JSON as text/plain (no CORS preflight).
function doPost(e) {
  let body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return json_({ error: 'bad_request' });
  }
  if (body.action === 'book') return json_(book_(body));
  if (body.action === 'confirm') return json_(confirm_(body.session_id));
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
    !(duration >= 30 && duration <= 720)
  ) {
    return { error: 'invalid_booking' };
  }
  const start = at_(b.date, start_minute);
  const end = new Date(start.getTime() + duration * 60000);
  if (start.getTime() < Date.now()) return { error: 'date_in_past' };

  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const cal = calendar_();
    if (cal.getEvents(start, end).some((ev) => blocks_(ev, b.service))) return { error: 'slot_taken' };

    const name = clip_(b.name, 100);
    const pay = Boolean(b.pay);
    const ev = cal.createEvent((pay ? '⏳ Nieopłacone: ' : '📝 Do potwierdzenia: ') + label + ' — ' + name, start, end, {
      description: [
        'Rezerwacja: ' + b.reference,
        'Imię: ' + name,
        'Telefon: ' + clip_(b.phone, 50),
        'E-mail: ' + clip_(b.email, 255),
        'Kwota: ' + Number(b.amount || 0) + ' zł' + (pay ? ' (płatność Stripe)' : ' (płatność do ustalenia)'),
        'Uwagi: ' + (clip_(b.notes, 2000) || '-'),
      ].join('\n'),
    });
    ev.setTag('sanctumRef', b.reference);
    ev.setTag('sanctumService', b.service);
    ev.setTag('sanctumStatus', pay ? 'pending' : 'request');
    ev.setTag('sanctumCreated', String(Date.now()));
    ev.setTag('sanctumLabel', label + ' — ' + name);
    return { ok: true };
  } finally {
    lock.releaseLock();
  }
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
  const date = m[2] + '-' + m[3] + '-' + m[4];
  const cal = calendar_();
  const ev = cal
    .getEvents(at_(date, 0), new Date(at_(date, 0).getTime() + 36 * 3600 * 1000))
    .find((e) => e.getTag('sanctumRef') === reference);
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
