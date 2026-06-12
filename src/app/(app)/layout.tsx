import Link from "next/link";
import { redirect } from "next/navigation";
import { Zap, Home, PlusCircle, Bell, User, ShieldAlert } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/SignOutButton";
import type { Profile } from "@/lib/types";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle<Profile>();
  if (!profile) redirect("/onboarding");

  const { count: unread } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .is("read_at", null);

  const isStaff = profile.is_admin || profile.is_moderator;

  const navItems = [
    { href: "/feed", label: "Feed", icon: Home },
    { href: "/ask", label: "Ask", icon: PlusCircle },
    { href: "/notifications", label: "Alerts", icon: Bell, count: unread ?? 0 },
    { href: `/u/${profile.handle}`, label: "Profile", icon: User },
    ...(isStaff ? [{ href: "/admin", label: "Admin", icon: ShieldAlert }] : []),
  ];

  return (
    <div className="mx-auto flex min-h-dvh max-w-5xl flex-col">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-ink-800 bg-ink-950/90 px-4 py-3 backdrop-blur">
        <Link href="/feed" className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-spark-400" />
          <span className="font-bold text-white">SparkyStack</span>
        </Link>
        <nav className="hidden items-center gap-1 sm:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-ink-300 transition hover:bg-ink-900 hover:text-white"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
              {"count" in item && (item.count ?? 0) > 0 && (
                <span className="ml-1 rounded-full bg-spark-400 px-1.5 text-xs font-bold text-ink-950">
                  {item.count}
                </span>
              )}
            </Link>
          ))}
          <SignOutButton />
        </nav>
      </header>

      <main className="flex-1 px-4 pb-24 pt-6 sm:pb-10">{children}</main>

      {/* Mobile bottom navigation */}
      <nav className="fixed inset-x-0 bottom-0 z-20 flex items-stretch justify-around border-t border-ink-800 bg-ink-950/95 backdrop-blur sm:hidden">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="relative flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] text-ink-400 transition hover:text-white"
          >
            <item.icon className="h-5 w-5" />
            {item.label}
            {"count" in item && (item.count ?? 0) > 0 && (
              <span className="absolute right-1/4 top-1 rounded-full bg-spark-400 px-1.5 text-[10px] font-bold text-ink-950">
                {item.count}
              </span>
            )}
          </Link>
        ))}
      </nav>
    </div>
  );
}
