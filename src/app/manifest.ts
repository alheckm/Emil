import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Emil – Rezepte & Einkaufsliste",
    short_name: "Emil",
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
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
