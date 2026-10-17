import type { Metadata, Viewport } from "next";
import { PwaInstallBanner } from "@/components/PwaManager";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "SparkyQ — verified peer help for Australian electricians",
    template: "%s | SparkyQ",
  },
  description:
    "A verified peer-help and work network for Australian electricians. Practical job-site answers build reputation; reputation unlocks better work.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SparkyQ",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f1f5f9" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const THEME_INIT_SCRIPT = `(function(){try{var s=localStorage.getItem("sparkyq-theme");var d=s==="dark"||(s!=="light"&&window.matchMedia("(prefers-color-scheme: dark)").matches);var r=document.documentElement;r.classList.toggle("dark",d);r.style.colorScheme=d?"dark":"light";}catch(e){}window.addEventListener("beforeinstallprompt",function(e){e.preventDefault();window.__sparkyqDeferredPrompt=e;});})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-AU" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-dvh">
        <PwaInstallBanner />
        {children}
      </body>
    </html>
  );
}
