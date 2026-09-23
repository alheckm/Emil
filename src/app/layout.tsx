import type { Metadata, Viewport } from "next";
import { Hanken_Grotesk } from "next/font/google";
import "./globals.css";
import { ServiceWorkerRegistration } from "./ServiceWorkerRegistration";
import { SpeedInsights } from "@vercel/speed-insights/next";

/**
 * Die eine Schrift der Maison-Augé-Richtung (HANDOFF-maison-auge.md).
 *
 * Die Referenz (maisonauge.com) setzt PP Neue Montreal Bold — kostenpflichtig
 * (Pangram Pangram, ab 40$), nicht lizenziert. **Hanken Grotesk** ist der
 * gewählte freie Ersatz (SIL OFL), Option A von drei verglichenen
 * Kandidaten (B=Archivo, C=Schibsted Grotesk verworfen): dieselbe kantige,
 * hochgezogene x-Höhe, ein enges Rastermaß, das auch in schwerem Schnitt bei
 * großer Displaygröße nicht ausfranst.
 *
 * Eine einzige Familie, Hierarchie nur über Gewicht/Größe (Signature-Element,
 * kein Genrewechsel zu einer Serife). Variable Font, kein Kursivschnitt —
 * in der neuen Richtung trägt keine Stelle mehr eine Betonung über Kursive.
 *
 * `next/font/google` lädt zur Bauzeit herunter und liefert von der eigenen
 * Domain — kein Aufruf zu Google zur Laufzeit, kein manuelles
 * Font-Hosting nötig.
 */
const sans = Hanken_Grotesk({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans-ui",
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
  // Der Ton der Fläche ganz oben am Bildschirm — durchgehend das Blush-Weiß
  // `--bg` der Maison-Augé-Richtung. Kein `dark`-Eintrag mehr: die Referenz
  // zeigt nur Hell.
  themeColor: "#fef5f9",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de" className={`h-full antialiased ${sans.variable}`}>
      <body className="min-h-full flex flex-col">
        <ServiceWorkerRegistration />
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
