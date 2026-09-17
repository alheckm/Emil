import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ServiceWorkerRegistration } from "./ServiceWorkerRegistration";

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
    { media: "(prefers-color-scheme: light)", color: "#fdfaf6" },
    { media: "(prefers-color-scheme: dark)", color: "#171310" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <ServiceWorkerRegistration />
        {children}
      </body>
    </html>
  );
}
