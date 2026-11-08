import type { CapacitorConfig } from "@capacitor/cli";

// The native app is a shell around the hosted Next.js site (it uses SSR and
// server actions, so it can't be bundled). CAP_SERVER_URL picks which site the
// shell loads; it is read when you run `npx cap sync`, not at runtime.
//   dev:     npm run cap:ios            -> http://localhost:3000 (iOS Simulator)
//   release: CAP_SERVER_URL=https://your-domain npm run cap:sync
const serverUrl = process.env.CAP_SERVER_URL ?? "http://localhost:3000";

const config: CapacitorConfig = {
  appId: "au.com.sparkyq.app",
  appName: "SparkyQ",
  // Only shown if the server can't be reached before the site loads.
  webDir: "capacitor-www",
  server: {
    url: serverUrl,
    cleartext: serverUrl.startsWith("http://"),
  },
  ios: {
    contentInset: "never",
    backgroundColor: "#0f172a",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
      backgroundColor: "#0f172a",
    },
  },
};

export default config;
