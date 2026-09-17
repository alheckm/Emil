import type { Metadata, Viewport } from "next";
import { Roboto_Slab } from "next/font/google";
import "./globals.css";
import { ServiceWorkerRegistration } from "./ServiceWorkerRegistration";
import { SpeedInsights } from "@vercel/speed-insights/next";

/**
 * Roboto Slab für Überschriften.
 *
 * Die Slab-Serife ist das Auffälligste an KptnCooks Auftritt; ohne sie wäre es
 * nur eine Farbpalette. Nur ein Schnitt und nur für Überschriften — der
 * Fließtext bleibt die Systemschrift, die null Bytes kostet und auf dem iPhone
 * ohnehin die beste ist.
 *
 * `next/font` lädt die Datei zur Bauzeit herunter und liefert sie von der
 * eigenen Domain aus. Kein Aufruf zu Google zur Laufzeit — schneller, und
 * datenschutzseitig ist es die einzige saubere Variante.
 *
 * `display: swap`: lieber sofort in der Systemschrift lesen und einmal
 * umspringen, als die Überschrift zurückzuhalten.
 */
const slab = Roboto_Slab({
  subsets: ["latin"],
  weight: ["600"],
  display: "swap",
  variable: "--font-slab",
});

export const metadata: Metadata = {
  title: { default: "Emil", template: "%s · Emil" },
  description:
    "Rezepte aus Kochbuch, Webseite oder App sammeln, Portionen umrechnen und die Einkaufsliste im Haushalt teilen.",
  applicationName: "Emil",
  appleWebApp: { capable: true, title: "Emil", statusBarStyle: "default" },
  formatDetection: { telephone: false },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Randlos bis unter Notch und Home-Indikator; die Screens halten über
  // die *-safe-Utilities Abstand. Zoom bleibt bewusst erlaubt.
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f4e7" },
    { media: "(prefers-color-scheme: dark)", color: "#151c23" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de" className={`h-full antialiased ${slab.variable}`}>
      <body className="min-h-full flex flex-col">
        <ServiceWorkerRegistration />
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
