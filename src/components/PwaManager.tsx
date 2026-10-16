"use client";

import { useEffect, useState } from "react";
import { Download, Share, Smartphone, X, CheckCircle2 } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

const DISMISS_KEY = "sparkyq-install-dismissed";

function isStandaloneMode(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIosBrowser(): boolean {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) && !("MSStream" in window);
}

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Ignore SW registration errors in restricted environments
      });
    }

    const standalone = isStandaloneMode();
    setIsInstalled(standalone);
    setIsIos(isIosBrowser());
    setDismissed(localStorage.getItem(DISMISS_KEY) === "1");

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const onInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function triggerInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") {
      setDeferredPrompt(null);
      setIsInstalled(true);
    }
  }

  function dismissBanner() {
    localStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  }

  return {
    deferredPrompt,
    isInstalled,
    isIos,
    dismissed,
    triggerInstall,
    dismissBanner,
  };
}

export function PwaInstallBanner() {
  const { deferredPrompt, isInstalled, isIos, dismissed, triggerInstall, dismissBanner } =
    usePwaInstall();

  if (isInstalled || dismissed) return null;
  if (!deferredPrompt && !isIos) return null;

  return (
    <div className="mx-auto max-w-5xl px-4 pt-3">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-spark-400/30 bg-spark-400/10 px-3.5 py-2.5 text-xs">
        <div className="flex items-center gap-2.5 text-ink-200">
          <Smartphone className="h-4 w-4 shrink-0 text-spark-400" />
          {deferredPrompt ? (
            <span>
              <strong>Install SparkyQ</strong> on your phone for 1-tap access on site.
            </span>
          ) : (
            <span className="flex flex-wrap items-center gap-1">
              <strong>Install on iPhone:</strong> tap{" "}
              <Share className="inline h-3.5 w-3.5 text-spark-400" /> <strong>Share</strong> in
              Safari, then <strong>Add to Home Screen</strong>.
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {deferredPrompt && (
            <button
              type="button"
              onClick={triggerInstall}
              className="btn-primary px-3 py-1.5 text-xs"
            >
              <Download className="h-3.5 w-3.5" /> Install app
            </button>
          )}
          <button
            type="button"
            onClick={dismissBanner}
            aria-label="Dismiss install banner"
            className="rounded-lg p-1 text-ink-500 hover:text-ink-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function PwaSettingsCard() {
  const { deferredPrompt, isInstalled, isIos, triggerInstall } = usePwaInstall();

  return (
    <div className="card flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 className="font-semibold text-ink-50">Phone app</h2>
        <p className="text-xs text-ink-500">
          {isInstalled
            ? "SparkyQ is installed on this device and running as a standalone app."
            : isIos
              ? "In Safari, tap Share → Add to Home Screen to install SparkyQ on your iPhone."
              : "Install SparkyQ to your home screen for fast job-site access and offline fallback."}
        </p>
      </div>
      {isInstalled ? (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
          <CheckCircle2 className="h-3.5 w-3.5" /> Installed
        </span>
      ) : deferredPrompt ? (
        <button type="button" onClick={triggerInstall} className="btn-primary text-xs">
          <Download className="h-3.5 w-3.5" /> Install app
        </button>
      ) : null}
    </div>
  );
}
