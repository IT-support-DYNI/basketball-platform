import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

import Providers from "./providers";
import NavBar from "@/components/NavBar";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";
import DisplayPrefsScript from "@/components/theme/DisplayPrefsScript";

// Same face swap as the public /club site (app/club/layout.tsx), applied
// app-wide so the internal admin/coach/player/guardian screens match it:
// Big Shoulders Display for headings and stat-card/profile contexts (one
// face for both — --font-archivo and --font-barlow now load the same
// family), Inter for body copy, IBM Plex Mono for labels. Variable NAMES
// are kept as-is (--font-inter, --font-archivo, --font-barlow) even though
// they no longer hold Inter/Archivo/Barlow — renaming them would mean
// touching every consumer in tailwind.config.ts's fontFamily map and
// beyond for no functional gain.
//
// Self-hosted as static files (next/font/local) rather than next/font/google:
// the latter fetches from Google's servers at every cold build/dev-compile,
// which is a hard dependency on reaching fonts.gstatic.com at exactly that
// moment — on a flaky/filtered connection this manifests as every page
// compile hanging through several retries before falling back to a system
// font (see the AbortError/"Failed to download" loop this was replacing).
// Bundling the woff2 files removes that network round-trip entirely, for
// every environment, not just unreliable ones — a straightforward reliability
// and build-time win. See app/fonts/ for the actual files.
const inter = localFont({
  src: [
    { path: "./fonts/inter-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/inter-500.woff2", weight: "500", style: "normal" },
    { path: "./fonts/inter-600.woff2", weight: "600", style: "normal" },
    { path: "./fonts/inter-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-inter",
  display: "swap",
});
const archivo = localFont({
  src: [
    { path: "./fonts/big-shoulders-display-700.woff2", weight: "700", style: "normal" },
    { path: "./fonts/big-shoulders-display-800.woff2", weight: "800", style: "normal" },
    { path: "./fonts/big-shoulders-display-900.woff2", weight: "900", style: "normal" },
  ],
  variable: "--font-archivo",
  display: "swap",
});
const barlow = localFont({
  src: [
    { path: "./fonts/big-shoulders-display-700.woff2", weight: "700", style: "normal" },
    { path: "./fonts/big-shoulders-display-800.woff2", weight: "800", style: "normal" },
    { path: "./fonts/big-shoulders-display-900.woff2", weight: "900", style: "normal" },
  ],
  variable: "--font-barlow",
  display: "swap",
});
const plexMono = localFont({
  src: [
    { path: "./fonts/ibm-plex-mono-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/ibm-plex-mono-500.woff2", weight: "500", style: "normal" },
  ],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "DYNI Blazers",
    template: "%s · DYNI Blazers",
  },
  description:
    "DYNI Blazers club platform — registration, schedule, attendance, communication and player development for members and staff.",
  manifest: "/manifest.webmanifest",
  applicationName: "DYNI Blazers",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "DYNI Blazers" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#1c1915" },
    { media: "(prefers-color-scheme: light)", color: "#f6f4ef" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${archivo.variable} ${barlow.variable} ${plexMono.variable}`}
    >
      <head>
        <DisplayPrefsScript />
      </head>
      <body className="min-h-screen bg-ground font-sans text-ink antialiased">
        <Providers>
          <ServiceWorkerRegistration />
          <NavBar />
          {children}
        </Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
