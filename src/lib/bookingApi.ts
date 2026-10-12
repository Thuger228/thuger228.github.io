// Talks to the booking functions in Supabase (supabase/migrations/*_bookings.sql) over plain REST.
// We don't use the generated supabase client here: it touches localStorage on import, which breaks the
// build-time pre-render, and the booking page only needs two calls.

import type { BookingServiceId } from '@/data/booking';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

export interface TakenSlot {
  booking_date: string; // YYYY-MM-DD
  start_minute: number;
  duration_minutes: number;
}

const rpc = async (fn: string, args: object) => {
  if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error('not_configured');
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
    body: JSON.stringify(args),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(typeof err.message === 'string' ? err.message : `http_${res.status}`);
  }
  return res.json();
};

// Busy times in the studio's Google Calendar (supabase/functions/calendar-busy). They block every service.
const fetchCalendarBusy = async (from: string, to: string): Promise<TakenSlot[]> => {
  if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error('not_configured');
  const res = await fetch(`${SUPABASE_URL}/functions/v1/calendar-busy?from=${from}&to=${to}`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
  });
  if (!res.ok) throw new Error(`http_${res.status}`);
  return res.json();
};

// Taken times = bookings made on the site + busy times in Google Calendar. Returns null when neither
// can be loaded (e.g. nothing is set up yet): the calendar then shows every slot in opening hours as
// free and the studio confirms by hand.
export const fetchTakenSlots = async (service: BookingServiceId, from: string, to: string): Promise<TakenSlot[] | null> => {
  const [booked, busy] = await Promise.allSettled([
    rpc('booked_slots', { p_service: service, p_from: from, p_to: to }) as Promise<TakenSlot[]>,
    fetchCalendarBusy(from, to),
  ]);
  if (booked.status === 'rejected' && busy.status === 'rejected') return null;
  return [
    ...(booked.status === 'fulfilled' ? booked.value : []),
    ...(busy.status === 'fulfilled' ? busy.value : []),
  ];
};

export type HoldResult = 'held' | 'slot_taken' | 'unavailable';

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
}): Promise<HoldResult> => {
  try {
    await rpc('create_booking', {
      p_reference: args.reference,
      p_service: args.service,
      p_date: args.date,
      p_start_minute: args.startMinute,
      p_duration_minutes: args.durationMinutes,
      p_name: args.name,
      p_email: args.email,
      p_phone: args.phone,
      p_notes: args.notes,
      p_amount_pln: args.amount,
    });
    return 'held';
  } catch (e) {
    return e instanceof Error && e.message.includes('slot_taken') ? 'slot_taken' : 'unavailable';
  }
};
