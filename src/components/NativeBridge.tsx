"use client";

import { useEffect } from "react";
import { App } from "@capacitor/app";
import { PushNotifications } from "@capacitor/push-notifications";
import { StatusBar, Style } from "@capacitor/status-bar";
import { isNativeApp, openInApp } from "@/lib/native";

/**
 * App-shell glue that runs on every page: keeps the status bar readable in light/dark,
 * and routes universal links (e.g. sign-in emails) and push notification taps into the app.
 * Renders nothing and does nothing in browsers.
 */
export function NativeBridge() {
  useEffect(() => {
    if (!isNativeApp()) return;

    // Style.Dark = light text, for the dark theme
    const syncStatusBar = () => {
      const dark = document.documentElement.classList.contains("dark");
      void StatusBar.setStyle({ style: dark ? Style.Dark : Style.Light }).catch(() => {});
    };
    syncStatusBar();
    const themeObserver = new MutationObserver(syncStatusBar);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    const urlListener = App.addListener("appUrlOpen", ({ url }) => openInApp(url));
    const pushTapListener = PushNotifications.addListener(
      "pushNotificationActionPerformed",
      ({ notification }) => {
        const link = notification.data?.link;
        if (typeof link === "string") openInApp(link);
      }
    );

    return () => {
      themeObserver.disconnect();
      void urlListener.then((l) => l.remove());
      void pushTapListener.then((l) => l.remove());
    };
  }, []);

  return null;
}
