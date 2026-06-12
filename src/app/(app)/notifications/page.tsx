import Link from "next/link";
import { redirect } from "next/navigation";
import { Bell } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { timeAgo } from "@/lib/utils";
import type { AppNotification } from "@/lib/types";

export const metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const notifications = (data ?? []) as AppNotification[];

  // Mark everything as read once viewed.
  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .is("read_at", null);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-xl font-bold text-white">Notifications</h1>
      {notifications.length === 0 ? (
        <div className="card py-16 text-center text-ink-500">
          <Bell className="mx-auto mb-2 h-6 w-6" />
          <p>Nothing yet — answers and votes will show up here.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const content = (
              <div
                className={`card flex items-start justify-between gap-3 py-4 ${
                  n.read_at ? "opacity-70" : "border-spark-400/30"
                }`}
              >
                <div>
                  <p className="text-sm font-medium text-ink-100">{n.title}</p>
                  {n.body && <p className="mt-0.5 text-xs text-ink-400">{n.body}</p>}
                </div>
                <span className="shrink-0 text-xs text-ink-600">{timeAgo(n.created_at)}</span>
              </div>
            );
            return n.link ? (
              <Link key={n.id} href={n.link} className="block">
                {content}
              </Link>
            ) : (
              <div key={n.id}>{content}</div>
            );
          })}
        </div>
      )}
    </div>
  );
}
