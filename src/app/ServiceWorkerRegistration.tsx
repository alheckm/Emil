"use client";

import { useEffect } from "react";

/**
 * Meldet den Service Worker an.
 *
 * Nur im Produktionsbetrieb: in der Entwicklung würde der Datei-Zwischen-
 * speicher das Neuladen bei Änderungen aushebeln, und man sucht Fehler, die
 * längst behoben sind. Zum Prüfen der Offline-Fähigkeit also `npm run build`
 * und `npm run start` benutzen.
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    void navigator.serviceWorker.register("/sw.js").catch(() => {
      // Ohne Service Worker läuft die App online ganz normal weiter.
    });
  }, []);

  return null;
}
