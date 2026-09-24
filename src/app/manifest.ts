import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "emil – Rezepte & Einkaufsliste",
    short_name: "emil",
    description:
      "Rezepte sammeln, Portionen umrechnen, Einkaufsliste im Haushalt teilen.",
    lang: "de",
    start_url: "/",
    // Ohne "standalone" startet die App vom Home-Bildschirm in Safari
    // mit Adressleiste — dann fühlt sie sich nicht wie eine App an.
    display: "standalone",
    orientation: "portrait",
    // `ground` der Instagram-Baseline-Richtung (DESIGN.md). Das ist die
    // Fläche, die iOS beim Start zeigt, bevor das erste Pixel der App da
    // ist — steht hier etwas anderes, blitzt beim Öffnen ein fremder Ton auf.
    background_color: "#ffffff",
    theme_color: "#ffffff",
    // `?v=3` s. layout.tsx — bei der nächsten Icon-Änderung mit erhöhen.
    icons: [
      { src: "/icons/icon-192.png?v=3", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png?v=3", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/icon-512-maskable.png?v=3",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
