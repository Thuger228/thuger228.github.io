// Talks to the booking backend: a Google Apps Script web app in the studio's Google account
// (google-apps-script/Code.gs). The studio's Google Calendar is the booking database.

import { BOOKING_API_URL, BookingServiceId } from '@/data/booking';

export interface TakenSlot {
  booking_date: string; // YYYY-MM-DD
  start_minute: number;
  duration_minutes: number;
}

// Apps Script answers POSTs with a redirect that browsers follow fine for text/plain bodies
// (no CORS preflight), so JSON goes as text/plain.
const post = async (body: object) => {
  if (!BOOKING_API_URL) throw new Error('not_configured');
  const res = await fetch(BOOKING_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`http_${res.status}`);
  return res.json();
};

// Busy times for a service. Returns null when they can't be loaded (e.g. the backend isn't set up
// yet): the calendar then shows every slot in opening hours as free and the studio confirms by hand.
export const fetchTakenSlots = async (service: BookingServiceId, from: string, to: string): Promise<TakenSlot[] | null> => {
  if (!BOOKING_API_URL) return null;
  try {
    const res = await fetch(`${BOOKING_API_URL}?action=busy&service=${service}&from=${from}&to=${to}`);
    const data = await res.json();
    return Array.isArray(data) ? data : null;
  } catch {
    return null;
  }
};

export type HoldResult = { status: 'held'; checkoutUrl?: string } | { status: 'slot_taken' } | { status: 'unavailable' };

// Puts the booking in the studio calendar, holding the slot while the customer pays. With checkout,
// the backend also creates the Stripe Checkout for the exact amount and returns its URL; without a
// URL (Stripe not set up, or an older backend) the booking stays a request the studio confirms by hand.
export const holdSlot = async (args: {
  reference: string;
  service: BookingServiceId;
  date: string;
  startMinute: number;
  durationMinutes: number;
  options: string[];
  name: string;
  email: string;
  phone: string;
  notes: string;
  amount: number;
  checkout: boolean;
  locale?: string;
  returnPath: string;
}): Promise<HoldResult> => {
  try {
    const res = await post({
      action: 'book',
      reference: args.reference,
      service: args.service,
      date: args.date,
      start_minute: args.startMinute,
      duration_minutes: args.durationMinutes,
      options: args.options,
      name: args.name,
      email: args.email,
      phone: args.phone,
      notes: args.notes,
      amount: args.amount,
      pay: false, // older backends: keep the booking as a request
      checkout: args.checkout,
      locale: args.locale,
      return_path: args.returnPath,
    });
    if (res.ok) return { status: 'held', checkoutUrl: typeof res.checkout_url === 'string' ? res.checkout_url : undefined };
    // too_soon: the time slipped inside the minimum notice while the form was open.
    return { status: res.error === 'slot_taken' || res.error === 'too_soon' ? 'slot_taken' : 'unavailable' };
  } catch {
    return { status: 'unavailable' };
  }
};

// The customer left Stripe without paying (?cancel=<reference>): free the slot straight away.
export const releaseHold = async (reference: string) => {
  try {
    await post({ action: 'cancel', reference });
  } catch {
    // the hold runs out by itself
  }
};

// Recording and mixing requests and contact form messages: the site emails them itself, and also
// sends a copy here so the studio gets them on Telegram too. Fire and forget: never holds up the form.
export const notifyStudio = (args: {
  kind: 'request' | 'contact';
  service?: BookingServiceId;
  topic?: string;
  name: string;
  email: string;
  phone: string;
  notes?: string;
  message?: string;
  language: string;
}) => {
  if (!BOOKING_API_URL) return;
  post({ action: 'notify', ...args }).catch(() => {
    // the email already reached the studio
  });
};

// After Stripe: the backend checks the Checkout Session with Stripe and marks the booking paid.
// Best effort: the backend also checks Stripe every few minutes on its own.
export const confirmPayment = async (sessionId: string) => {
  try {
    await post({ action: 'confirm', session_id: sessionId });
  } catch {
    // the 5-minute sync picks it up
  }
};
