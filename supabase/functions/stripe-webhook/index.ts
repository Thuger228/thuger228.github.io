// Stripe webhook: marks a booking as paid when its Payment Link checkout completes.
//
// Stripe → Developers → Webhooks → Add endpoint:
//   URL:    https://<project-ref>.supabase.co/functions/v1/stripe-webhook
//   Events: checkout.session.completed, checkout.session.async_payment_succeeded
// Then save the endpoint's signing secret (whsec_...) as the STRIPE_WEBHOOK_SECRET function secret.
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided by Supabase automatically.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const encoder = new TextEncoder();

// Checks the Stripe-Signature header (HMAC-SHA256 of "timestamp.body"), as described in
// https://docs.stripe.com/webhooks#verify-manually
async function verifyStripeSignature(body: string, header: string | null, secret: string): Promise<boolean> {
  if (!header) return false;
  const timestamp = header.split(",").find((p) => p.startsWith("t="))?.slice(2);
  const signatures = header.split(",").filter((p) => p.startsWith("v1=")).map((p) => p.slice(3));
  if (!timestamp || signatures.length === 0) return false;
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;

  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = await crypto.subtle.sign("HMAC", key, encoder.encode(`${timestamp}.${body}`));
  const expected = Array.from(new Uint8Array(mac)).map((b) => b.toString(16).padStart(2, "0")).join("");
  return signatures.some((sig) => sig.length === expected.length && timingSafeEqual(sig, expected));
}

function timingSafeEqual(a: string, b: string): boolean {
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const secret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!secret) return new Response("STRIPE_WEBHOOK_SECRET is not set", { status: 500 });

  const body = await req.text();
  if (!(await verifyStripeSignature(body, req.headers.get("stripe-signature"), secret))) {
    return new Response("Invalid signature", { status: 400 });
  }

  const event = JSON.parse(body);
  const session = event.data?.object;
  const paidEvent =
    (event.type === "checkout.session.completed" && session?.payment_status === "paid") ||
    event.type === "checkout.session.async_payment_succeeded";
  if (!paidEvent || !session?.client_reference_id) {
    return new Response(JSON.stringify({ received: true, ignored: true }), { status: 200 });
  }

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { error } = await supabase
    .from("bookings")
    .update({ status: "paid", paid_at: new Date().toISOString(), stripe_session_id: session.id })
    .eq("reference", session.client_reference_id)
    .neq("status", "cancelled");
  if (error) {
    console.error("Failed to mark booking paid", session.client_reference_id, error);
    return new Response("Database error", { status: 500 }); // Stripe retries
  }
  return new Response(JSON.stringify({ received: true }), { status: 200 });
});
