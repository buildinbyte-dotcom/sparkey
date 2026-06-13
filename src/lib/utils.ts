import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

export function mediaUrl(storagePath: string): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/question-media/${storagePath}`;
}

export type FeedParams = {
  q?: string;
  state?: string;
  job_type?: string;
  urgent?: string;
  f?: string;
};

// Build a feed URL that toggles a single clickable "badge" filter while keeping
// the top filter (search / state / category / urgent) untouched. Applying a new
// token replaces any previous one; clicking the active token clears it.
export function feedFilterHref(params: FeedParams, token: string): string {
  const sp = new URLSearchParams();
  for (const key of ["q", "state", "job_type", "urgent"] as const) {
    const v = params[key];
    if (v) sp.set(key, v);
  }
  if (params.f !== token) sp.set("f", token);
  const qs = sp.toString();
  return qs ? `/feed?${qs}` : "/feed";
}

export function slugifyHandle(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 30);
}
