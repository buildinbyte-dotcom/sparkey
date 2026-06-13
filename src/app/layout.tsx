import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "SparkyQ — verified peer help for Australian electricians",
    template: "%s | SparkyQ",
  },
  description:
    "A verified peer-help and work network for Australian electricians. Practical job-site answers build reputation; reputation unlocks better work.",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#020617",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-AU">
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
