"use client";

import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * While a navigation triggered by this link is in flight, swap the icon for a
 * spinner. This gives the user immediate "I tapped something" feedback even
 * though the destination page is server-rendered.
 */
function NavInner({
  icon,
  label,
  count,
  spinnerClassName,
  badgeClassName,
}: {
  icon: React.ReactNode;
  label: string;
  count?: number;
  spinnerClassName: string;
  badgeClassName: string;
}) {
  const { pending } = useLinkStatus();
  return (
    <>
      {pending ? <Loader2 className={cn("animate-spin", spinnerClassName)} /> : icon}
      {label}
      {(count ?? 0) > 0 && <span className={badgeClassName}>{count}</span>}
    </>
  );
}

export function NavLink({
  href,
  icon,
  label,
  count,
  className,
  activeClassName,
  spinnerClassName = "h-4 w-4",
  badgeClassName = "ml-1 rounded-full bg-spark-400 px-1.5 text-xs font-bold text-ink-950",
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  count?: number;
  className?: string;
  activeClassName?: string;
  spinnerClassName?: string;
  badgeClassName?: string;
}) {
  const pathname = usePathname();
  const active = pathname === href || (href !== "/feed" && pathname.startsWith(`${href}/`));

  return (
    <Link href={href} className={cn(className, active && activeClassName)}>
      <NavInner
        icon={icon}
        label={label}
        count={count}
        spinnerClassName={spinnerClassName}
        badgeClassName={badgeClassName}
      />
    </Link>
  );
}
