import type { Metadata, Viewport } from "next";
import { Playfair_Display, Poppins } from "next/font/google";
import "./globals.css";
import { ServiceWorkerRegistration } from "./ServiceWorkerRegistration";
import { SpeedInsights } from "@vercel/speed-insights/next";

/**
 * Die beiden Schriften aus app_design.jpg.
 *
 * Der Entwurf setzt zwei Familien gegeneinander, und der Gegensatz ist der
 * ganze Auftritt:
 *
 * - **Playfair Display** für Überschriften — eine Serife mit starkem
 *   Strichkontrast. Vorher stand hier Roboto Slab; eine Slab-Serife hat
 *   gleichmäßige Striche und wirkt technisch, der Entwurf will das Elegante.
 *   Drei Schnitte statt zwei: der Rezepttitel auf dem Foto steht im Entwurf im
 *   **regulären** Schnitt, nicht im fetten — bei dieser Schriftgröße trägt der
 *   Strichkontrast allein, und 600 wirkte daneben plump. Die kleinen
 *   Abschnittsüberschriften („Zutaten", „Zubereitung") brauchen umgekehrt 600,
 *   sonst verschwinden sie.
 * - **Poppins** für alles andere. Das ist der Bruch mit der bisherigen Regel,
 *   die Systemschrift zu nehmen — die kostet null Bytes und ist auf dem iPhone
 *   hervorragend. Poppins kostet zwei Schnitte, aber die geometrischen,
 *   kreisrunden Buchstaben sind im Entwurf deutlich zu erkennen, und mit
 *   San Francisco sieht der Screen schlicht anders aus als das JPEG.
 *
 * Nur die wirklich benutzten Schnitte. Jeder weitere ist eine Datei, die im
 * Supermarkt über Mobilfunk geladen werden will.
 *
 * `next/font` lädt zur Bauzeit herunter und liefert von der eigenen Domain —
 * kein Aufruf zu Google zur Laufzeit, und datenschutzseitig die einzige
 * saubere Variante.
 */
const serif = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-serif",
});

const sans = Poppins({
  subsets: ["latin"],
  weight: ["400", "500"],
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
  themeColor: [
    // Der Ton der Fläche ganz oben am Bildschirm — und das ist seit dem
    // Wegfall des Canvas überall derselbe: das warme Off-White.
    { media: "(prefers-color-scheme: light)", color: "#f5f1ee" },
    { media: "(prefers-color-scheme: dark)", color: "#1f1c19" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="de"
      className={`h-full antialiased ${serif.variable} ${sans.variable}`}
    >
      <body className="min-h-full flex flex-col">
        <ServiceWorkerRegistration />
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
