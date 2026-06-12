import { ShieldAlert } from "lucide-react";
import { SAFETY_DISCLAIMER } from "@/lib/constants";

export function SafetyBanner() {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-spark-400/20 bg-spark-400/5 p-3 text-xs text-ink-400">
      <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-spark-400" />
      <p>{SAFETY_DISCLAIMER}</p>
    </div>
  );
}
