import { Capacitor } from "@capacitor/core";
import { Haptics, ImpactStyle } from "@capacitor/haptics";

/** True inside the iOS/Android app shell; false in browsers and the PWA. */
export function isNativeApp() {
  return Capacitor.isNativePlatform();
}

/** A light tap on supported phones; does nothing on the web. */
export function tapHaptic(style: "light" | "medium" = "light") {
  if (!isNativeApp()) return;
  void Haptics.impact({ style: style === "medium" ? ImpactStyle.Medium : ImpactStyle.Light }).catch(
    () => {}
  );
}

/**
 * Opens a SparkyQ link (universal link or push payload) inside the app. Only paths on
 * this site are followed; anything else is ignored. A full navigation is used so server
 * routes like /auth/callback run.
 */
export function openInApp(url: string) {
  let target: URL;
  try {
    target = new URL(url, window.location.origin);
  } catch {
    return;
  }
  const sameSite =
    target.origin === window.location.origin || target.hostname.replace(/^www\./, "") === "sparkyq.com";
  if (!sameSite) return;
  window.location.assign(target.pathname + target.search + target.hash);
}
