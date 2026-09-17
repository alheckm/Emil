import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
