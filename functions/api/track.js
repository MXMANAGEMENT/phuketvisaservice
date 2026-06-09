/* =========================================================
   Cloudflare Pages Function — /api/track
   Server-side event forwarding:
     - Meta Conversions API (CAPI)
     - GA4 Measurement Protocol (MP)
   Runs on Cloudflare (no separate backend). Keeps the site
   "Cloudflare-only". De-duplicates with the browser Pixel/GA
   via the shared event_id / client_id.

   REQUIRED environment variables (Cloudflare Pages → Settings →
   Environment variables). Leave unset to disable that channel:
     META_PIXEL_ID        e.g. 1234567890
     META_CAPI_TOKEN      Meta Conversions API access token (secret)
     META_TEST_CODE       (optional) Meta test event code for debugging
     GA4_MEASUREMENT_ID   e.g. G-XXXXXXX
     GA4_API_SECRET       GA4 Measurement Protocol API secret (secret)
   ========================================================= */

// Meta standard event mapping (must match consent.js)
const META_STD = { whatsapp_click: "Lead", phone_click: "Contact", email_click: "Contact" };

async function sha256(value) {
  if (!value) return undefined;
  const norm = String(value).trim().toLowerCase();
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(norm));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function gaClientId(gaCookie) {
  // _ga cookie format: GA1.1.XXXXXXXXX.YYYYYYYYY  → clientId = "XXXXXXXXX.YYYYYYYYY"
  if (!gaCookie) return String(Date.now()) + "." + Math.floor(Math.random() * 1e9);
  const parts = gaCookie.split(".");
  return parts.length >= 4 ? parts.slice(-2).join(".") : gaCookie;
}

export async function onRequestPost({ request, env }) {
  let body;
  try { body = await request.json(); } catch (e) { return new Response("bad json", { status: 400 }); }

  // Consent guard — server only forwards when marketing consent was given client-side.
  if (!body || !body.consent || !body.consent.marketing) {
    return new Response(JSON.stringify({ ok: true, skipped: "no-consent" }), {
      headers: { "Content-Type": "application/json" }
    });
  }

  const ip = request.headers.get("CF-Connecting-IP") || "";
  const ua = request.headers.get("User-Agent") || "";
  const eventName = String(body.event_name || "custom");
  const eventId = String(body.event_id || crypto.randomUUID());
  const sourceUrl = String(body.event_source_url || "");
  const nowSec = Math.floor(Date.now() / 1000);

  const results = {};

  /* ---------------- Meta Conversions API ---------------- */
  if (env.META_PIXEL_ID && env.META_CAPI_TOKEN) {
    const userData = {
      client_ip_address: ip,
      client_user_agent: ua
    };
    if (body.fbp) userData.fbp = body.fbp;
    if (body.fbc) userData.fbc = body.fbc;
    // No PII is collected on this site (WhatsApp-only). If a form is added later,
    // hash email/phone here with sha256() before sending.

    const payload = {
      data: [
        {
          event_name: META_STD[eventName] || eventName,
          event_time: nowSec,
          event_id: eventId,
          action_source: "website",
          event_source_url: sourceUrl,
          user_data: userData,
          custom_data: body.data || {}
        }
      ]
    };
    if (env.META_TEST_CODE) payload.test_event_code = env.META_TEST_CODE;

    try {
      const r = await fetch(
        "https://graph.facebook.com/v19.0/" + env.META_PIXEL_ID + "/events?access_token=" + encodeURIComponent(env.META_CAPI_TOKEN),
        { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }
      );
      results.meta = r.status;
    } catch (e) { results.meta = "error"; }
  }

  /* ---------------- GA4 Measurement Protocol ---------------- */
  if (env.GA4_MEASUREMENT_ID && env.GA4_API_SECRET) {
    const clientId = gaClientId(body.ga_cookie);
    const mpBody = {
      client_id: clientId,
      events: [
        {
          name: eventName,
          params: Object.assign({}, body.data || {}, {
            engagement_time_msec: 1,
            event_id: eventId,
            page_location: sourceUrl
          })
        }
      ]
    };
    try {
      const r = await fetch(
        "https://www.google-analytics.com/mp/collect?measurement_id=" +
          encodeURIComponent(env.GA4_MEASUREMENT_ID) + "&api_secret=" + encodeURIComponent(env.GA4_API_SECRET),
        { method: "POST", body: JSON.stringify(mpBody) }
      );
      results.ga4 = r.status;
    } catch (e) { results.ga4 = "error"; }
  }

  return new Response(JSON.stringify({ ok: true, event_id: eventId, results }), {
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
  });
}

// Optional: respond to non-POST for quick health-check
export async function onRequestGet() {
  return new Response(JSON.stringify({ ok: true, service: "track", method: "POST only" }), {
    headers: { "Content-Type": "application/json" }
  });
}
