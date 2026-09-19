import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { ServiceWorkerRegistration } from "./ServiceWorkerRegistration";
import { SpeedInsights } from "@vercel/speed-insights/next";

/**
 * Die eine Schrift aus docs/app_redesign.jpg.
 *
 * Der Entwurf setzt an keiner Stelle eine Serife — Titel, Abschnitte,
 * Fließtext und Kleinschrift laufen alle in derselben geometrisch-
 * humanistischen Grotesk, nur in unterschiedlichem Schnitt und Gewicht. Das
 * ist der Bruch mit der vorigen Fassung, die zwei Familien gegeneinander
 * setzte (Playfair Display + Poppins) — design-system.md, Abschnitt 5 und 12.
 *
 * **Plus Jakarta Sans**: geometrisches Grundgerüst mit leicht humanistischer
 * Abrundung, ein enges, niedriges „a" und eine kräftige, nicht überzogene
 * Kursive für die Namens-Betonung in der Begrüßung — das trifft den Entwurf
 * deutlich näher als etwa Inter (zu neo-grotesk) oder Manrope (zu rund im
 * Auge).
 *
 * Zwei CSS-Variablen für dieselbe Schrift, nicht weil es zwei Familien gäbe,
 * sondern weil `font-display` im Code an vielen Stellen steht (Rezepttitel,
 * Abschnittsüberschriften, Ziffernkasten) und ein Massenumbenennen auf
 * `font-sans` nur Fehlerrisiko ohne Nutzen wäre — beide Tokens zeigen jetzt
 * auf dieselbe Instanz.
 *
 * `next/font` lädt zur Bauzeit herunter und liefert von der eigenen Domain —
 * kein Aufruf zu Google zur Laufzeit, und datenschutzseitig die einzige
 * saubere Variante.
 */
const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
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
  // Der Ton der Fläche ganz oben am Bildschirm — durchgehend das fliederblaue
  // `--bg` aus docs/app_redesign.jpg. Kein `dark`-Eintrag mehr: die Referenz
  // zeigt nur Hell (design-system.md, Abschnitt 4, „Dunkel").
  themeColor: "#c9d2e3",
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
