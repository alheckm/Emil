import type { Metadata, Viewport } from "next";
import { Public_Sans, Unbounded } from "next/font/google";
import "./globals.css";
import { ServiceWorkerRegistration } from "./ServiceWorkerRegistration";
import { SpeedInsights } from "@vercel/speed-insights/next";

/**
 * Die zwei Schriften der Instagram-Baseline-Richtung (DESIGN.md,
 * „Typografie"): **Public Sans** für Fließtext/UI, **Unbounded** für
 * Display/Titel/Abschnitt/Kennzahl — Hierarchie kommt aus Größe/Gewicht
 * dieser beiden, nicht aus zusätzlichen Containern oder Schatten.
 *
 * Beide über Google Fonts, SIL Open Font License, uneingeschränkt einbettbar.
 * `next/font/google` lädt zur Bauzeit herunter und liefert von der eigenen
 * Domain — kein Aufruf zu Google zur Laufzeit, kein manuelles Font-Hosting
 * nötig.
 */
const sans = Public_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-sans-ui",
});

const display = Unbounded({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  display: "swap",
  variable: "--font-display-ui",
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
  // Der Ton der Fläche ganz oben am Bildschirm — durchgehend Weiß
  // (Instagram-Baseline, DESIGN.md „Farbe": `ground` = `#FFFFFF`). Kein
  // `dark`-Eintrag: kein Dark Mode, siehe PRODUCT.md.
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="de"
      className={`h-full antialiased ${sans.variable} ${display.variable}`}
    >
      <body className="min-h-full flex flex-col">
        <ServiceWorkerRegistration />
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
