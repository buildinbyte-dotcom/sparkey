// Supabase connection values. Works with both manual setup and the
// Vercel <-> Supabase marketplace integration: prefers the newer
// publishable key, falls back to the anon key (same capability).
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

export const SUPABASE_KEY = (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!;
