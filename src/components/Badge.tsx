import Link from "next/link";
import { cn } from "@/lib/utils";

const VARIANTS = {
  default: "bg-ink-800 text-ink-300 border-ink-700",
  spark: "bg-spark-400/10 text-spark-300 border-spark-400/30",
  green: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
  red: "bg-red-500/10 text-red-300 border-red-500/30",
  orange: "bg-orange-500/10 text-orange-300 border-orange-500/30",
  blue: "bg-sky-500/10 text-sky-300 border-sky-500/30",
} as const;

type Variant = keyof typeof VARIANTS;

const BASE = "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium";

export function Badge({
  children,
  variant = "default",
  className,
}: {
  children: React.ReactNode;
  variant?: Variant;
  className?: string;
}) {
  return <span className={cn(BASE, VARIANTS[variant], className)}>{children}</span>;
}

// A Badge that links to a filtered feed. When `active`, it shows a highlighted
// ring so the user can see (and click again to clear) the applied filter.
export function FilterBadge({
  children,
  href,
  active = false,
  variant = "default",
  className,
}: {
  children: React.ReactNode;
  href: string;
  active?: boolean;
  variant?: Variant;
  className?: string;
}) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-pressed={active}
      className={cn(
        BASE,
        VARIANTS[variant],
        "cursor-pointer transition hover:brightness-125",
        active && "ring-2 ring-spark-400/70 ring-offset-1 ring-offset-ink-900",
        className
      )}
    >
      {children}
    </Link>
  );
}

export function RiskBadge({
  risk,
  href,
  active,
}: {
  risk: string;
  href?: string;
  active?: boolean;
}) {
  let variant: Variant;
  let label: string;
  if (risk === "high" || risk === "needs_expert") {
    variant = "red";
    label = risk === "high" ? "High risk" : "Needs expert";
  } else if (risk === "moderate") {
    variant = "orange";
    label = "Moderate risk";
  } else {
    return null;
  }
  if (href) {
    return (
      <FilterBadge href={href} active={active} variant={variant}>
        {label}
      </FilterBadge>
    );
  }
  return <Badge variant={variant}>{label}</Badge>;
}

export function UrgencyBadge({
  urgency,
  href,
  active,
}: {
  urgency: string;
  href?: string;
  active?: boolean;
}) {
  let variant: Variant;
  let label: string;
  if (urgency === "stuck_on_site") {
    variant = "red";
    label = "Stuck on site";
  } else if (urgency === "same_day") {
    variant = "orange";
    label = "Same day";
  } else {
    return null;
  }
  if (href) {
    return (
      <FilterBadge href={href} active={active} variant={variant}>
        {label}
      </FilterBadge>
    );
  }
  return <Badge variant={variant}>{label}</Badge>;
}

export function VerifiedBadge({ status }: { status: string }) {
  if (status === "verified") return <Badge variant="green">✓ Verified</Badge>;
  if (status === "pending") return <Badge variant="orange">Pending verification</Badge>;
  return <Badge>Unverified</Badge>;
}
