import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Cache Components und Partial Prefetching (Next 16).
   *
   * Emil ist durchgehend angemeldet, also hängt jede Seite an `cookies()` und
   * wurde bisher bei jedem Klick komplett neu auf dem Server gerendert. Diese
   * beiden Schalter sind der Grund, dass das aufhört:
   *
   * - `cacheComponents` erlaubt `use cache: private` — damit bekommt ein
   *   Session-Zugriff eine Lebensdauer und kann vorab geladen werden.
   * - `partialPrefetching` lässt jeden sichtbaren `<Link>` die App Shell der
   *   Zielroute holen, bevor geklickt wird. Entscheidend dabei: `cookies()`
   *   bindet einen Prefetch NICHT an eine URL, Session-Inhalte liegen also
   *   im Shell und sind schon vor dem Tippen da.
   */
  cacheComponents: true,
  partialPrefetching: true,

  /**
   * Emil wird am Handy entwickelt, nicht nur am Schreibtisch. Next 16 sperrt
   * im Entwicklungsmodus die `_next`-Ressourcen für alle Hosts außer localhost
   * — vom Handy aus lädt dann das Client-Bundle nicht, nichts hydriert, und
   * Formulare schicken sich als normale Navigation ab.
   *
   * Gilt ausschließlich für `next dev`; im Produktionsbuild hat der Eintrag
   * keine Wirkung.
   */
  allowedDevOrigins: ["192.168.2.109"],
};

export default nextConfig;
