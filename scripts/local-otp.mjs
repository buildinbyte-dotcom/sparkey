#!/usr/bin/env node
// Prints the latest 6-digit sign-in code sent to an address by local Supabase.
// Usage: npm run otp -- admin@sparkyq.test
const email = process.argv[2];
if (!email) {
  console.error("Usage: npm run otp -- <email>");
  process.exit(1);
}

const MAILPIT = "http://127.0.0.1:54324/api/v1";

try {
  const search = await fetch(`${MAILPIT}/search?query=${encodeURIComponent(`to:${email}`)}`);
  const latest = (await search.json()).messages?.[0];
  if (!latest) throw new Error(`No email for ${email} yet. Request a code first.`);

  const message = await (await fetch(`${MAILPIT}/message/${latest.ID}`)).json();
  const code = message.Text?.match(/\b\d{6}\b/)?.[0];
  if (!code) throw new Error("Latest email has no 6-digit code.");
  console.log(code);
} catch (err) {
  console.error(err instanceof Error && err.cause ? "Mailpit not reachable. Is `supabase start` running?" : err.message);
  process.exit(1);
}
