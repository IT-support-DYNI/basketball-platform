import type { Metadata, Viewport } from "next";
import { Big_Shoulders_Display, IBM_Plex_Mono, Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

import Providers from "./providers";
import NavBar from "@/components/NavBar";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";
import ThemeScript from "@/components/theme/ThemeScript";

// Same face swap as the public /club site (app/club/layout.tsx), applied
// app-wide so the internal admin/coach/player/guardian screens match it:
// Big Shoulders Display for headings and stat-card/profile contexts (one
// face for both — --font-archivo and --font-barlow now load the same
// family), Inter for body copy, IBM Plex Mono for labels. Variable NAMES
// are kept as-is (--font-inter, --font-archivo, --font-barlow) even though
// they no longer hold Inter/Archivo/Barlow — renaming them would mean
// touching every consumer in tailwind.config.ts's fontFamily map and
// beyond for no functional gain.
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-inter", display: "swap" });
const archivo = Big_Shoulders_Display({
  subsets: ["latin"],
  weight: ["700", "800", "900"],
  variable: "--font-archivo",
  display: "swap",
});
const barlow = Big_Shoulders_Display({
  subsets: ["latin"],
  weight: ["700", "800", "900"],
  variable: "--font-barlow",
  display: "swap",
});
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
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
        <ThemeScript />
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
