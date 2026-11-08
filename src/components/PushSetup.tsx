"use client";

import { useEffect, useState } from "react";
import { Bell, X } from "lucide-react";
import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { savePushToken } from "@/app/(app)/notifications/actions";
import { isNativeApp } from "@/lib/native";

export const PUSH_TOKEN_KEY = "sparkyq-push-token";
const DISMISS_KEY = "sparkyq-push-prompt-dismissed";

/**
 * Signed-in app only. Registers this device for push if the member already allowed it,
 * otherwise offers a dismissible prompt (iOS only lets us ask once, so we ask in context).
 */
export function PushSetup() {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if (!isNativeApp()) return;

    const registration = PushNotifications.addListener("registration", ({ value }) => {
      try {
        localStorage.setItem(PUSH_TOKEN_KEY, value);
      } catch {}
      void savePushToken(value, Capacitor.getPlatform());
    });
    const registrationError = PushNotifications.addListener("registrationError", (err) =>
      console.warn("Push registration failed:", err.error)
    );

    void (async () => {
      const { receive } = await PushNotifications.checkPermissions();
      if (receive === "granted") {
        await PushNotifications.register();
      } else if (receive.startsWith("prompt")) {
        let dismissed = false;
        try {
          dismissed = localStorage.getItem(DISMISS_KEY) === "1";
        } catch {}
        setShowPrompt(!dismissed);
      }
    })();

    return () => {
      void registration.then((l) => l.remove());
      void registrationError.then((l) => l.remove());
    };
  }, []);

  async function enable() {
    setShowPrompt(false);
    const { receive } = await PushNotifications.requestPermissions();
    if (receive === "granted") await PushNotifications.register();
  }

  function dismiss() {
    setShowPrompt(false);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {}
  }

  if (!showPrompt) return null;

  return (
    <div className="border-b border-spark-400/30 bg-spark-400/10 px-4 py-2.5">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 text-ink-100">
          <Bell className="h-4 w-4 shrink-0 text-spark-400" />
          <span>Get notified when someone answers your question.</span>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <button type="button" onClick={enable} className="btn-primary px-3 py-1.5 text-xs">
            Turn on
          </button>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Not now"
            className="rounded-lg p-1 text-ink-400 hover:text-ink-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
