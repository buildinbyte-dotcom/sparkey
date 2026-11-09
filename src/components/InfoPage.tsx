import Link from "next/link";
import { Zap } from "lucide-react";

// Override with NEXT_PUBLIC_SUPPORT_EMAIL (local dev uses support@sparkyq.test)
export const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@sparkyq.com";

/** Shell for public text pages (privacy policy, support). */
export function InfoPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated?: string;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto min-h-app max-w-2xl px-4 py-8">
      <Link href="/" className="mb-8 inline-flex items-center gap-2">
        <Zap className="h-6 w-6 text-spark-400" />
        <span className="text-lg font-bold text-ink-50">SparkyQ</span>
      </Link>
      <h1 className="text-2xl font-bold text-ink-50">{title}</h1>
      {updated && <p className="mt-1 text-xs text-ink-500">Last updated {updated}</p>}
      <div className="mt-6 space-y-6 text-sm leading-relaxed text-ink-300 [&_a]:text-spark-400 [&_a]:underline [&_h2]:mb-2 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-ink-50 [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-1">
        {children}
      </div>
    </main>
  );
}

export function SupportEmailLink() {
  return <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>;
}
