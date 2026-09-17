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
    background_color: "#fdfaf6",
    theme_color: "#fdfaf6",
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
