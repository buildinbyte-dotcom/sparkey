"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";
import { Share } from "@capacitor/share";
import { isNativeApp, tapHaptic } from "@/lib/native";

/** Native share sheet in the app, Web Share where supported, otherwise copies the link. */
export function ShareButton({ title, path }: { title: string; path: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = new URL(path, window.location.origin).toString();
    try {
      if (isNativeApp()) {
        tapHaptic();
        await Share.share({ title, text: title, url, dialogTitle: "Share question" });
      } else if (navigator.share) {
        await navigator.share({ title, url });
      } else if (await copyText(url)) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        // Clipboard blocked (permissions, non-HTTPS): let them copy it by hand
        window.prompt("Copy this link:", url);
      }
    } catch {
      // Cancelled share sheets reject; nothing to do
    }
  }

  return (
    <button
      type="button"
      onClick={share}
      className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-ink-500 transition hover:text-ink-200"
    >
      <Share2 className="h-3.5 w-3.5" /> {copied ? "Link copied" : "Share"}
    </button>
  );
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Older fallback; works where the async clipboard API is unavailable
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    area.remove();
    return ok;
  }
}
