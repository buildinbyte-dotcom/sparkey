"use client";

import { useEffect, useState } from "react";
import {
  Download,
  Share,
  Smartphone,
  X,
  CheckCircle2,
  PlusSquare,
  MoreVertical,
  ExternalLink,
  Menu,
} from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

declare global {
  interface Window {
    __sparkyqDeferredPrompt?: BeforeInstallPromptEvent | null;
  }
}

const DISMISS_KEY = "sparkyq-install-dismissed-v2";

function isStandaloneMode(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

type PlatformInfo = {
  isIos: boolean;
  isAndroid: boolean;
  isSamsung: boolean;
  isFirefox: boolean;
  isMobileOrTouch: boolean;
  isInAppWebView: boolean;
};

function detectPlatform(): PlatformInfo {
  if (typeof window === "undefined") {
    return {
      isIos: false,
      isAndroid: false,
      isSamsung: false,
      isFirefox: false,
      isMobileOrTouch: false,
      isInAppWebView: false,
    };
  }
  const ua = window.navigator.userAgent || "";
  const isSamsung = /SamsungBrowser/i.test(ua);
  const isFirefox = /Firefox|FxiOS/i.test(ua);
  const isIos =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/i.test(ua);
  const isMobileOrTouch =
    isIos ||
    isAndroid ||
    isSamsung ||
    /Mobi|Android|Touch/i.test(ua) ||
    navigator.maxTouchPoints > 1 ||
    window.matchMedia("(max-width: 768px)").matches;

  // Detect Gmail, Outlook, Instagram, Facebook, Slack, or generic embedded webviews
  const isInAppWebView =
    /FBAN|FBAV|Instagram|Line|MicroMessenger|GSA\/|Gmail|Outlook|Slack|wv\)/i.test(ua) ||
    (isIos && !/Safari/i.test(ua) && !/CriOS|FxiOS|EdgiOS/i.test(ua));

  return { isIos, isAndroid, isSamsung, isFirefox, isMobileOrTouch, isInAppWebView };
}

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [platform, setPlatform] = useState<PlatformInfo>({
    isIos: false,
    isAndroid: false,
    isSamsung: false,
    isFirefox: false,
    isMobileOrTouch: false,
    isInAppWebView: false,
  });
  const [dismissed, setDismissed] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    setMounted(true);

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Ignore SW registration errors in restricted environments
      });
    }

    setIsInstalled(isStandaloneMode());
    setPlatform(detectPlatform());
    setDismissed(sessionStorage.getItem(DISMISS_KEY) === "1");

    // Pick up any beforeinstallprompt event captured before React hydrated
    if (window.__sparkyqDeferredPrompt) {
      setDeferredPrompt(window.__sparkyqDeferredPrompt);
    }

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      window.__sparkyqDeferredPrompt = promptEvent;
      setDeferredPrompt(promptEvent);
    };

    const onInstalled = () => {
      window.__sparkyqDeferredPrompt = null;
      setIsInstalled(true);
      setDeferredPrompt(null);
      setShowGuide(false);
    };

    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    const onDisplayModeChange = (e: MediaQueryListEvent) => {
      if (e.matches) setIsInstalled(true);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    mediaQuery.addEventListener?.("change", onDisplayModeChange);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
      mediaQuery.removeEventListener?.("change", onDisplayModeChange);
    };
  }, []);

  async function triggerInstall() {
    const promptEvent = deferredPrompt || window.__sparkyqDeferredPrompt;
    if (promptEvent) {
      try {
        await promptEvent.prompt();
        const choice = await promptEvent.userChoice;
        if (choice.outcome === "accepted") {
          window.__sparkyqDeferredPrompt = null;
          setDeferredPrompt(null);
          setIsInstalled(true);
        }
        return;
      } catch {
        // Fall through to manual guide modal if native prompt fails
      }
    }
    setShowGuide(true);
  }

  function dismissBanner() {
    sessionStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  }

  return {
    mounted,
    deferredPrompt,
    isInstalled,
    platform,
    dismissed,
    showGuide,
    setShowGuide,
    triggerInstall,
    dismissBanner,
  };
}

export function PwaInstallModal({
  open,
  onClose,
  platform,
}: {
  open: boolean;
  onClose: () => void;
  platform: PlatformInfo;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/70 p-4 backdrop-blur-xs sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md space-y-4 rounded-2xl border border-ink-700 bg-ink-900 p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-spark-400/15 text-spark-400">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-ink-50">Install SparkyQ on your phone</h3>
              <p className="text-xs text-ink-400">
                Adds SparkyQ to your Home Screen like a native app
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close install guide"
            className="rounded-lg p-1 text-ink-400 hover:bg-ink-800 hover:text-ink-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {platform.isInAppWebView && (
          <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-200">
            <p className="font-semibold">Opened inside an email or social app</p>
            <p className="mt-1">
              In-app browsers block home-screen installation. Tap{" "}
              <ExternalLink className="inline h-3.5 w-3.5" /> <strong>Open in Safari / Chrome</strong>{" "}
              (top or bottom corner) first, then follow the steps below.
            </p>
          </div>
        )}

        {platform.isIos ? (
          <ol className="space-y-2.5 text-sm text-ink-200">
            <li className="flex items-center gap-3 rounded-xl border border-ink-800 bg-ink-950 p-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-spark-400 text-xs font-bold text-slate-950">
                1
              </span>
              <span>
                Tap the <Share className="mx-0.5 inline h-4 w-4 text-spark-400" />{" "}
                <strong>Share</strong> button in your browser bar.
              </span>
            </li>
            <li className="flex items-center gap-3 rounded-xl border border-ink-800 bg-ink-950 p-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-spark-400 text-xs font-bold text-slate-950">
                2
              </span>
              <span>
                Scroll down and tap{" "}
                <PlusSquare className="mx-0.5 inline h-4 w-4 text-spark-400" />{" "}
                <strong>Add to Home Screen</strong>.
              </span>
            </li>
            <li className="flex items-center gap-3 rounded-xl border border-ink-800 bg-ink-950 p-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-spark-400 text-xs font-bold text-slate-950">
                3
              </span>
              <span>
                Tap <strong>Add</strong> in the top-right corner, then launch SparkyQ from your
                Home Screen.
              </span>
            </li>
          </ol>
        ) : platform.isSamsung ? (
          <ol className="space-y-2.5 text-sm text-ink-200">
            <li className="flex items-center gap-3 rounded-xl border border-ink-800 bg-ink-950 p-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-spark-400 text-xs font-bold text-slate-950">
                1
              </span>
              <span>
                Look at the top URL bar and tap the{" "}
                <Download className="mx-0.5 inline h-4 w-4 text-spark-400" />{" "}
                <strong>Install / Download icon</strong> (or tap the bottom menu{" "}
                <Menu className="mx-0.5 inline h-4 w-4 text-spark-400" /> in the bottom-right
                corner).
              </span>
            </li>
            <li className="flex items-center gap-3 rounded-xl border border-ink-800 bg-ink-950 p-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-spark-400 text-xs font-bold text-slate-950">
                2
              </span>
              <span>
                Select <strong>Add page to</strong> → <strong>App screen</strong> (or{" "}
                <strong>Home screen</strong>).
              </span>
            </li>
            <li className="flex items-center gap-3 rounded-xl border border-ink-800 bg-ink-950 p-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-spark-400 text-xs font-bold text-slate-950">
                3
              </span>
              <span>Tap <strong>Install</strong> to add SparkyQ as a standalone app.</span>
            </li>
          </ol>
        ) : platform.isFirefox ? (
          <ol className="space-y-2.5 text-sm text-ink-200">
            <li className="flex items-center gap-3 rounded-xl border border-ink-800 bg-ink-950 p-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-spark-400 text-xs font-bold text-slate-950">
                1
              </span>
              <span>
                Tap the menu <MoreVertical className="mx-0.5 inline h-4 w-4 text-spark-400" /> next
                to the address bar.
              </span>
            </li>
            <li className="flex items-center gap-3 rounded-xl border border-ink-800 bg-ink-950 p-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-spark-400 text-xs font-bold text-slate-950">
                2
              </span>
              <span>
                Tap <Download className="mx-0.5 inline h-4 w-4 text-spark-400" />{" "}
                <strong>Install</strong> or <strong>Add to Home screen</strong>.
              </span>
            </li>
            <li className="flex items-center gap-3 rounded-xl border border-ink-800 bg-ink-950 p-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-spark-400 text-xs font-bold text-slate-950">
                3
              </span>
              <span>Confirm <strong>Add</strong> to add SparkyQ to your phone.</span>
            </li>
          </ol>
        ) : (
          <ol className="space-y-2.5 text-sm text-ink-200">
            <li className="flex items-center gap-3 rounded-xl border border-ink-800 bg-ink-950 p-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-spark-400 text-xs font-bold text-slate-950">
                1
              </span>
              <span>
                Tap the browser menu{" "}
                <MoreVertical className="mx-0.5 inline h-4 w-4 text-spark-400" /> in the top-right
                corner (or the install icon in the address bar).
              </span>
            </li>
            <li className="flex items-center gap-3 rounded-xl border border-ink-800 bg-ink-950 p-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-spark-400 text-xs font-bold text-slate-950">
                2
              </span>
              <span>
                Tap <Download className="mx-0.5 inline h-4 w-4 text-spark-400" />{" "}
                <strong>Install app</strong> or <strong>Add to Home screen</strong>.
              </span>
            </li>
            <li className="flex items-center gap-3 rounded-xl border border-ink-800 bg-ink-950 p-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-spark-400 text-xs font-bold text-slate-950">
                3
              </span>
              <span>Confirm <strong>Install</strong> to add SparkyQ to your phone.</span>
            </li>
          </ol>
        )}

        <button type="button" onClick={onClose} className="btn-primary w-full text-xs">
          Got it
        </button>
      </div>
    </div>
  );
}

export function PwaInstallBanner() {
  const {
    mounted,
    deferredPrompt,
    isInstalled,
    platform,
    dismissed,
    showGuide,
    setShowGuide,
    triggerInstall,
    dismissBanner,
  } = usePwaInstall();

  if (!mounted || isInstalled) return null;

  // Show banner automatically on any mobile/touch device or whenever native install prompt is ready
  const shouldShowBanner = !dismissed && (platform.isMobileOrTouch || Boolean(deferredPrompt));

  return (
    <>
      {shouldShowBanner && (
        <div className="border-b border-spark-400/30 bg-spark-400/10 px-4 py-2.5">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 text-ink-100">
              <Smartphone className="h-4 w-4 shrink-0 text-spark-400" />
              <span>
                <strong>Install SparkyQ</strong> on your phone for 1-tap job-site access.
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <button
                type="button"
                onClick={triggerInstall}
                className="btn-primary px-3 py-1.5 text-xs"
              >
                <Download className="h-3.5 w-3.5" /> Install app
              </button>
              <button
                type="button"
                onClick={dismissBanner}
                aria-label="Dismiss install banner"
                className="rounded-lg p-1 text-ink-400 hover:text-ink-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
      <PwaInstallModal
        open={showGuide}
        onClose={() => setShowGuide(false)}
        platform={platform}
      />
    </>
  );
}

export function PwaHeaderInstallButton() {
  const { mounted, isInstalled, showGuide, setShowGuide, platform, triggerInstall } =
    usePwaInstall();

  if (!mounted || isInstalled) return null;

  return (
    <>
      <button
        type="button"
        onClick={triggerInstall}
        className="inline-flex items-center gap-1.5 rounded-lg border border-spark-400/40 bg-spark-400/10 px-2.5 py-1.5 text-xs font-semibold text-spark-300 transition hover:bg-spark-400/20 sm:hidden"
      >
        <Download className="h-3.5 w-3.5" />
        Install
      </button>
      <PwaInstallModal
        open={showGuide}
        onClose={() => setShowGuide(false)}
        platform={platform}
      />
    </>
  );
}

export function PwaSettingsCard() {
  const { mounted, isInstalled, platform, showGuide, setShowGuide, triggerInstall } =
    usePwaInstall();

  return (
    <div className="card flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 className="font-semibold text-ink-50">Phone app</h2>
        <p className="text-xs text-ink-500">
          {mounted && isInstalled
            ? "SparkyQ is installed on this device and running as a standalone app."
            : "Install SparkyQ to your phone's home screen for full-screen job-site access and offline fallback."}
        </p>
      </div>
      {mounted && isInstalled ? (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
          <CheckCircle2 className="h-3.5 w-3.5" /> Installed
        </span>
      ) : (
        <button type="button" onClick={triggerInstall} className="btn-primary text-xs">
          <Download className="h-3.5 w-3.5" /> Install app
        </button>
      )}
      <PwaInstallModal
        open={showGuide}
        onClose={() => setShowGuide(false)}
        platform={platform}
      />
    </div>
  );
}
