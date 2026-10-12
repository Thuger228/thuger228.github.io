// Busy times from the studio's Google Calendar, for the booking page calendar.
// GET /functions/v1/calendar-busy?from=YYYY-MM-DD&to=YYYY-MM-DD
// Returns [{ booking_date, start_minute, duration_minutes }], with no event titles or details.

import { busySlots, googleCalendarConfigured } from "../_shared/google-calendar.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

const isoDate = /^\d{4}-\d{2}-\d{2}$/;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  const url = new URL(req.url);
  const from = url.searchParams.get("from") ?? "";
  const to = url.searchParams.get("to") ?? "";
  if (!isoDate.test(from) || !isoDate.test(to) || to < from || Date.parse(to) - Date.parse(from) > 120 * 86_400_000) {
    return new Response(JSON.stringify({ error: "invalid_range" }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
  }
  if (!googleCalendarConfigured()) {
    return new Response(JSON.stringify([]), { headers: { ...cors, "Content-Type": "application/json" } });
  }

  try {
    const slots = await busySlots(from, to);
    return new Response(JSON.stringify(slots), {
      headers: { ...cors, "Content-Type": "application/json", "Cache-Control": "public, max-age=60" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: "calendar_unavailable" }), { status: 502, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
