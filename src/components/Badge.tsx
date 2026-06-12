import { cn } from "@/lib/utils";

const VARIANTS = {
  default: "bg-ink-800 text-ink-300 border-ink-700",
  spark: "bg-spark-400/10 text-spark-300 border-spark-400/30",
  green: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
  red: "bg-red-500/10 text-red-300 border-red-500/30",
  orange: "bg-orange-500/10 text-orange-300 border-orange-500/30",
  blue: "bg-sky-500/10 text-sky-300 border-sky-500/30",
} as const;

export function Badge({
  children,
  variant = "default",
  className,
}: {
  children: React.ReactNode;
  variant?: keyof typeof VARIANTS;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
        VARIANTS[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

export function RiskBadge({ risk }: { risk: string }) {
  if (risk === "high" || risk === "needs_expert")
    return <Badge variant="red">{risk === "high" ? "High risk" : "Needs expert"}</Badge>;
  if (risk === "moderate") return <Badge variant="orange">Moderate risk</Badge>;
  return null;
}

export function UrgencyBadge({ urgency }: { urgency: string }) {
  if (urgency === "stuck_on_site") return <Badge variant="red">Stuck on site</Badge>;
  if (urgency === "same_day") return <Badge variant="orange">Same day</Badge>;
  return null;
}

export function VerifiedBadge({ status }: { status: string }) {
  if (status === "verified") return <Badge variant="green">✓ Verified</Badge>;
  if (status === "pending") return <Badge variant="orange">Pending verification</Badge>;
  return <Badge>Unverified</Badge>;
}
