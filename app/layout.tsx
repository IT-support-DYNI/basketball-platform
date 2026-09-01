import type { Metadata, Viewport } from "next";
import { Archivo, Inter, Barlow_Condensed, IBM_Plex_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

import Providers from "./providers";
import NavBar from "@/components/NavBar";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";
import ThemeScript from "@/components/theme/ThemeScript";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const archivo = Archivo({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-archivo",
  display: "swap",
});
const barlow = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["600", "700"],
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
    { media: "(prefers-color-scheme: dark)", color: "#0b0b0f" },
    { media: "(prefers-color-scheme: light)", color: "#f7f4ef" },
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
