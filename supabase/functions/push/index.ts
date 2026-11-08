// Sends one notification to the member's iOS devices via APNs.
// Called by the `notification_push` database trigger (migration 0005) with
// { notification_id } and the shared x-push-secret header. Everything else is loaded here
// with the service role, so the request body is never trusted for content or recipients.
//
// Secrets (supabase secrets set ...; locally from config.toml [edge_runtime.secrets]):
//   PUSH_WEBHOOK_SECRET  must match vault secret `push_webhook_secret`
//   APNS_KEY_ID, APNS_TEAM_ID, APNS_PRIVATE_KEY (.p8 contents), APNS_BUNDLE_ID,
//   APNS_ENV = "production" | "development" (TestFlight/App Store use production)
// Without the APNS_* values it runs as a dry run and only logs what it would send.

import { createClient } from "npm:@supabase/supabase-js@2.49.4";

const PUSH_SECRET = Deno.env.get("PUSH_WEBHOOK_SECRET");
const APNS = {
  keyId: Deno.env.get("APNS_KEY_ID"),
  teamId: Deno.env.get("APNS_TEAM_ID"),
  privateKey: Deno.env.get("APNS_PRIVATE_KEY"),
  bundleId: Deno.env.get("APNS_BUNDLE_ID") ?? "au.com.sparkyq.app",
  host:
    Deno.env.get("APNS_ENV") === "development"
      ? "api.sandbox.push.apple.com"
      : "api.push.apple.com",
};

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);
  if (!PUSH_SECRET || req.headers.get("x-push-secret") !== PUSH_SECRET) {
    return json({ error: "unauthorized" }, 401);
  }

  const { notification_id } = await req.json().catch(() => ({}));
  if (typeof notification_id !== "string") return json({ error: "notification_id required" }, 400);

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } }
  );

  const { data: notification } = await admin
    .from("notifications")
    .select("id, user_id, title, body, link")
    .eq("id", notification_id)
    .maybeSingle();
  if (!notification) return json({ error: "notification not found" }, 404);

  const { data: tokens } = await admin
    .from("push_tokens")
    .select("token")
    .eq("user_id", notification.user_id)
    .eq("platform", "ios");
  const iosTokens = (tokens ?? []).map((t) => t.token as string);
  if (!iosTokens.length) return json({ sent: 0 });

  const payload = JSON.stringify({
    aps: {
      alert: { title: notification.title, ...(notification.body ? { body: notification.body } : {}) },
      sound: "default",
    },
    link: notification.link,
  });

  if (!APNS.keyId || !APNS.teamId || !APNS.privateKey) {
    console.log("APNs not configured, dry run:", { tokens: iosTokens.length, payload });
    return json({ sent: 0, dryRun: true, tokens: iosTokens.length });
  }

  const jwt = await apnsJwt();
  let sent = 0;
  const deadTokens: string[] = [];

  await Promise.all(
    iosTokens.map(async (token) => {
      const res = await fetch(`https://${APNS.host}/3/device/${token}`, {
        method: "POST",
        headers: {
          authorization: `bearer ${jwt}`,
          "apns-topic": APNS.bundleId,
          "apns-push-type": "alert",
          "apns-priority": "10",
          "content-type": "application/json",
        },
        body: payload,
      });
      if (res.ok) {
        sent++;
        return;
      }
      const reason = (await res.json().catch(() => ({}))).reason;
      // The app was deleted or the token belongs to the other APNs environment
      if (res.status === 410 || reason === "BadDeviceToken" || reason === "Unregistered") {
        deadTokens.push(token);
      } else {
        console.error("APNs rejected push:", res.status, reason);
      }
    })
  );

  if (deadTokens.length) await admin.from("push_tokens").delete().in("token", deadTokens);
  return json({ sent, removed: deadTokens.length });
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

// APNs provider token: ES256 JWT, valid up to an hour; Apple rejects refreshing more than
// every 20 minutes, so reuse one for 50.
let cachedJwt: { token: string; issuedAt: number } | null = null;

async function apnsJwt() {
  const now = Math.floor(Date.now() / 1000);
  if (cachedJwt && now - cachedJwt.issuedAt < 50 * 60) return cachedJwt.token;

  const pem = APNS.privateKey!.replace(/\\n/g, "\n");
  const der = Uint8Array.from(
    atob(pem.replace(/-----[^-]+-----/g, "").replace(/\s+/g, "")),
    (c) => c.charCodeAt(0)
  );
  const key = await crypto.subtle.importKey(
    "pkcs8",
    der,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );

  const encode = (obj: object) => base64url(new TextEncoder().encode(JSON.stringify(obj)));
  const unsigned = `${encode({ alg: "ES256", kid: APNS.keyId })}.${encode({ iss: APNS.teamId, iat: now })}`;
  // Web Crypto returns the raw r||s signature JWT expects
  const signature = new Uint8Array(
    await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, new TextEncoder().encode(unsigned))
  );

  cachedJwt = { token: `${unsigned}.${base64url(signature)}`, issuedAt: now };
  return cachedJwt.token;
}

function base64url(bytes: Uint8Array) {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
