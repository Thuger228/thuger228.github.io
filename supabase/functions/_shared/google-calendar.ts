// Google Calendar access for the booking page, using a Google Cloud service account.
//
// Secrets (Supabase / Lovable Cloud → function secrets):
//   GOOGLE_SERVICE_ACCOUNT_JSON  the whole JSON key file of the service account
//   GOOGLE_CALENDAR_ID           the calendar to use, e.g. sanctum.studio@gmail.com
// Share that calendar with the service account's email ("Make changes to events") so it can read
// busy times and add paid bookings.

const STUDIO_TIME_ZONE = "Europe/Warsaw";

interface ServiceAccount {
  client_email: string;
  private_key: string;
}

const b64url = (data: ArrayBuffer | string) => {
  const bytes = typeof data === "string" ? new TextEncoder().encode(data) : new Uint8Array(data);
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

let cachedToken: { token: string; expires: number } | null = null;

// OAuth access token for the service account (JWT bearer flow, RS256 signed with WebCrypto).
async function accessToken(): Promise<string> {
  if (cachedToken && cachedToken.expires > Date.now() + 60_000) return cachedToken.token;
  const sa = JSON.parse(Deno.env.get("GOOGLE_SERVICE_ACCOUNT_JSON") ?? "{}") as ServiceAccount;
  if (!sa.client_email || !sa.private_key) throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON is not set");

  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = b64url(
    JSON.stringify({
      iss: sa.client_email,
      scope: "https://www.googleapis.com/auth/calendar",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    }),
  );
  const pem = sa.private_key.replace(/-----[^-]+-----/g, "").replace(/\s+/g, "");
  const der = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey("pkcs8", der, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(`${header}.${claims}`));

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${header}.${claims}.${b64url(signature)}`,
    }),
  });
  if (!res.ok) throw new Error(`Google token error ${res.status}: ${await res.text()}`);
  const json = await res.json();
  cachedToken = { token: json.access_token, expires: Date.now() + json.expires_in * 1000 };
  return cachedToken.token;
}

const calendarId = () => {
  const id = Deno.env.get("GOOGLE_CALENDAR_ID");
  if (!id) throw new Error("GOOGLE_CALENDAR_ID is not set");
  return id;
};

// Studio-local date ('YYYY-MM-DD') and minutes after midnight for an instant.
function studioLocal(d: Date): { date: string; minutes: number } {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: STUDIO_TIME_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(d)
      .map((x) => [x.type, x.value]),
  );
  return { date: `${p.year}-${p.month}-${p.day}`, minutes: Number(p.hour) * 60 + Number(p.minute) };
}

// UTC offset of Warsaw on a given studio-local date/time, e.g. "+02:00".
function studioOffset(date: string, minutes: number): string {
  const guess = new Date(`${date}T${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}:00Z`);
  const local = studioLocal(guess);
  const localMs = Date.parse(`${local.date}T00:00:00Z`) + local.minutes * 60_000;
  const diff = Math.round((localMs - guess.getTime()) / 60_000);
  const sign = diff >= 0 ? "+" : "-";
  const abs = Math.abs(diff);
  return `${sign}${String(Math.floor(abs / 60)).padStart(2, "0")}:${String(abs % 60).padStart(2, "0")}`;
}

const addDays = (iso: string, days: number) => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

export interface BusySlot {
  booking_date: string;
  start_minute: number;
  duration_minutes: number;
}

// Busy times in the calendar between two studio-local dates, split per day, same shape as booked_slots.
export async function busySlots(from: string, to: string): Promise<BusySlot[]> {
  const res = await fetch("https://www.googleapis.com/calendar/v3/freeBusy", {
    method: "POST",
    headers: { Authorization: `Bearer ${await accessToken()}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      timeMin: `${from}T00:00:00${studioOffset(from, 0)}`,
      timeMax: `${addDays(to, 1)}T00:00:00${studioOffset(addDays(to, 1), 0)}`,
      timeZone: STUDIO_TIME_ZONE,
      items: [{ id: calendarId() }],
    }),
  });
  if (!res.ok) throw new Error(`Google freeBusy error ${res.status}: ${await res.text()}`);
  const json = await res.json();
  const cal = json.calendars?.[calendarId()];
  if (cal?.errors?.length) throw new Error(`Google calendar not readable: ${JSON.stringify(cal.errors)}`);

  const slots: BusySlot[] = [];
  for (const b of cal?.busy ?? []) {
    let start = studioLocal(new Date(b.start));
    const end = studioLocal(new Date(b.end));
    // Split events that run past midnight into one slot per day.
    while (start.date < end.date) {
      slots.push({ booking_date: start.date, start_minute: start.minutes, duration_minutes: 1440 - start.minutes });
      start = { date: addDays(start.date, 1), minutes: 0 };
    }
    if (end.minutes > start.minutes) {
      slots.push({ booking_date: start.date, start_minute: start.minutes, duration_minutes: end.minutes - start.minutes });
    }
  }
  return slots;
}

// Adds a paid booking to the calendar. The reference is stored on the event so retries don't duplicate it.
export async function addBookingEvent(b: {
  reference: string;
  service: string;
  booking_date: string;
  start_minute: number;
  duration_minutes: number;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  notes: string | null;
  amount_pln: number | null;
}): Promise<void> {
  const token = await accessToken();
  const base = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId())}/events`;

  const existing = await fetch(`${base}?privateExtendedProperty=${encodeURIComponent(`bookingRef=${b.reference}`)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (existing.ok && ((await existing.json()).items ?? []).length > 0) return;

  const hhmm = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}:00`;
  const endMinute = b.start_minute + b.duration_minutes;
  const label = b.service === "recording" ? "Nagrywanie" : "Sala prób";
  const res = await fetch(base, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      summary: `${label}: ${b.customer_name ?? ""} (opłacone)`,
      description: [
        `Rezerwacja: ${b.reference}`,
        `Telefon: ${b.customer_phone ?? "-"}`,
        `E-mail: ${b.customer_email ?? "-"}`,
        `Kwota: ${b.amount_pln ?? "-"} zł`,
        `Uwagi: ${b.notes || "-"}`,
      ].join("\n"),
      start: { dateTime: `${b.booking_date}T${hhmm(b.start_minute)}`, timeZone: STUDIO_TIME_ZONE },
      end: {
        dateTime: endMinute >= 1440 ? `${addDays(b.booking_date, 1)}T00:00:00` : `${b.booking_date}T${hhmm(endMinute)}`,
        timeZone: STUDIO_TIME_ZONE,
      },
      extendedProperties: { private: { bookingRef: b.reference } },
    }),
  });
  if (!res.ok) throw new Error(`Google insert error ${res.status}: ${await res.text()}`);
}

export const googleCalendarConfigured = () =>
  Boolean(Deno.env.get("GOOGLE_SERVICE_ACCOUNT_JSON") && Deno.env.get("GOOGLE_CALENDAR_ID"));
