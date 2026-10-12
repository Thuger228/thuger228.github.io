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

export type HoldResult = 'held' | 'slot_taken' | 'unavailable';

// Puts the booking in the studio calendar, holding the slot while the customer pays.
export const holdSlot = async (args: {
  reference: string;
  service: BookingServiceId;
  date: string;
  startMinute: number;
  durationMinutes: number;
  name: string;
  email: string;
  phone: string;
  notes: string;
  amount: number;
  pay: boolean;
}): Promise<HoldResult> => {
  try {
    const res = await post({
      action: 'book',
      reference: args.reference,
      service: args.service,
      date: args.date,
      start_minute: args.startMinute,
      duration_minutes: args.durationMinutes,
      name: args.name,
      email: args.email,
      phone: args.phone,
      notes: args.notes,
      amount: args.amount,
      pay: args.pay,
    });
    if (res.ok) return 'held';
    return res.error === 'slot_taken' ? 'slot_taken' : 'unavailable';
  } catch {
    return 'unavailable';
  }
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
