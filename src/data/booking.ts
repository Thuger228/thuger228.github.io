// Online booking: which services can be booked, their base prices and their Stripe Payment Links.
//
// GitHub Pages has no server, so payment goes through Stripe Payment Links created in the Stripe
// Dashboard (no secret key ever touches this site). Each link sells ONE unit of the service
// (1 hour, or 1 song for mixing) with "Let customers adjust quantity" turned on, and redirects
// back to https://sanctum-sa.com/booking/?paid=1&session_id={CHECKOUT_SESSION_ID} after payment.
//
// Paste each link (https://buy.stripe.com/...) below. While a link is empty, the form still works:
// it sends the booking request by email and the studio arranges payment directly.

export type BookingServiceId = 'recording' | 'rehearsal' | 'mixing';

export interface BookingService {
  id: BookingServiceId;
  pricePerUnit: number; // PLN, must match the price on the Stripe Payment Link
  unit: 'hour' | 'song';
  needsSlot: boolean; // pick a date and start time
  maxQuantity: number; // keep in line with the maximum quantity set on the Payment Link
  paymentLink: string;
}

export const BOOKING_SERVICES: BookingService[] = [
  {
    id: 'recording',
    pricePerUnit: 120,
    unit: 'hour',
    needsSlot: true,
    maxQuantity: 12,
    paymentLink: '', // TODO: Stripe Payment Link "Nagrywanie — 1 godz." (120 PLN)
  },
  {
    id: 'rehearsal',
    pricePerUnit: 50,
    unit: 'hour',
    needsSlot: true,
    maxQuantity: 12,
    paymentLink: '', // TODO: Stripe Payment Link "Sala prób — 1 godz." (50 PLN)
  },
  {
    id: 'mixing',
    pricePerUnit: 400,
    unit: 'song',
    needsSlot: false,
    maxQuantity: 20,
    paymentLink: '', // TODO: Stripe Payment Link "Miks i mastering — 1 utwór" (400 PLN)
  },
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
// PLACEHOLDER: these opening hours are NOT confirmed by the studio yet. Edit them here and the
// booking calendar follows. Times are Warsaw time. Recording and the rehearsal room are booked
// separately, so a recording session doesn't block the rehearsal room and vice versa.
// ---------------------------------------------------------------------------------------------

export const STUDIO_TIME_ZONE = 'Europe/Warsaw';

// Opening hours per weekday (0 = Sunday … 6 = Saturday) as [open, close] in 'HH:MM', or null if closed.
export const OPENING_HOURS: Record<number, [string, string] | null> = {
  0: ['10:00', '22:00'],
  1: ['10:00', '22:00'],
  2: ['10:00', '22:00'],
  3: ['10:00', '22:00'],
  4: ['10:00', '22:00'],
  5: ['10:00', '22:00'],
  6: ['10:00', '22:00'],
};

export const SLOT_STEP_MINUTES = 60; // how often a session can start (60 = on the hour)
export const BOOK_AHEAD_DAYS = 60; // how far ahead customers can book
export const MIN_NOTICE_MINUTES = 120; // earliest start: now + this
