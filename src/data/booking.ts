// Online booking: which services can be booked and their prices.
//
// Only the rehearsal room is booked in the calendar and paid online. GitHub Pages has no server, so
// the Google Apps Script backend (google-apps-script/Code.gs) creates the Stripe Checkout for the
// exact amount; no Stripe key ever touches this site. The backend has its own copy of the rehearsal
// prices (REHEARSAL in Code.gs) and charges those, so change both together.
// Recording and mixing are requests: the studio writes or calls back.

export type BookingServiceId = 'recording' | 'rehearsal' | 'mixing';

export interface BookingService {
  id: BookingServiceId;
  pricePerUnit: number; // PLN per hour or per song
  unit: 'hour' | 'song';
  needsSlot: boolean; // pick a date and start time, then pay online
  maxQuantity: number;
}

export const BOOKING_SERVICES: BookingService[] = [
  {
    id: 'rehearsal',
    pricePerUnit: 60, // set by the studio on 2026-10-12
    unit: 'hour',
    needsSlot: true,
    maxQuantity: 12,
  },
  {
    id: 'recording',
    pricePerUnit: 120,
    unit: 'hour',
    needsSlot: false, // a request: the studio writes or calls back to agree the date (set by the studio on 2026-10-12)
    maxQuantity: 12,
  },
  {
    id: 'mixing',
    pricePerUnit: 400,
    unit: 'song',
    needsSlot: false, // a request (no date, no online payment); the studio replies
    maxQuantity: 20,
  },
];

// Rehearsal room extras (set by the studio on 2026-10-12): cymbals and the double pedal are a fixed
// charge per rehearsal; "drums or vocals only" lowers the hourly price. Keep in line with
// REHEARSAL.options in Code.gs.
export type RehearsalOptionId = 'cymbals' | 'double_pedal' | 'solo';
export const REHEARSAL_OPTIONS: { id: RehearsalOptionId; price: number; perHour: boolean }[] = [
  { id: 'cymbals', price: 10, perHour: false },
  { id: 'double_pedal', price: 5, perHour: false },
  { id: 'solo', price: -10, perHour: true }, // drums only or vocals only
];

// Booking backend: the Google Apps Script web app from google-apps-script/Code.gs, deployed in the
// studio's Google account (https://script.google.com/macros/s/.../exec). It reads busy times from the
// studio's Google Calendar and adds bookings to it. While empty, every time in opening hours shows as free.
export const BOOKING_API_URL = 'https://script.google.com/macros/s/AKfycbxVxfnd5xhrmA-5MP7jnTQqele-eMYbVnRdXZpFKxk9xd1uCKUF0fNZEIUoj-mYrU8PBQ/exec';

// Booking details are emailed here (same inbox as the contact form) before the customer pays.
export const BOOKING_EMAIL_ENDPOINT = 'https://formsubmit.co/ajax/support@sanctum-sa.com';

// Stripe Checkout languages; Ukrainian and Belarusian aren't offered, so Stripe picks from the browser.
export const STRIPE_LOCALES: Record<string, string | undefined> = {
  pl: 'pl',
  en: 'en',
  ru: 'ru',
};

// ---------------------------------------------------------------------------------------------
// Calendar schedule.
// Opening hours confirmed by the studio on 2026-10-12: every day 9:00–24:00. Edit them here and the
// booking calendar follows. Times are Warsaw time; '24:00' means midnight. Recording and the rehearsal room are booked
// separately, so a recording session doesn't block the rehearsal room and vice versa.
// ---------------------------------------------------------------------------------------------

export const STUDIO_TIME_ZONE = 'Europe/Warsaw';

// Opening hours per weekday (0 = Sunday … 6 = Saturday) as [open, close] in 'HH:MM', or null if closed.
export const OPENING_HOURS: Record<number, [string, string] | null> = {
  0: ['09:00', '24:00'],
  1: ['09:00', '24:00'],
  2: ['09:00', '24:00'],
  3: ['09:00', '24:00'],
  4: ['09:00', '24:00'],
  5: ['09:00', '24:00'],
  6: ['09:00', '24:00'],
};

export const SLOT_STEP_MINUTES = 60; // how often a session can start (60 = on the hour)
export const BOOK_AHEAD_DAYS = 60; // how far ahead customers can book
export const MIN_NOTICE_MINUTES = 240; // earliest start: now + this (4 hours, set by the studio on 2026-10-12)
