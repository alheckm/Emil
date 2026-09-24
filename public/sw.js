/**
 * Service Worker für Emil.
 *
 * Von Hand geschrieben statt über ein Build-Plugin: @serwist/next unterstützt
 * Turbopack nicht, und Next 16 baut standardmäßig damit. Für unseren Zweck
 * braucht es ohnehin nur zwei Regeln, und die sind so nachvollziehbar.
 *
 * Aufgabe: die Einkaufsliste muss sich im Supermarkt mit einem Balken Empfang
 * noch öffnen lassen. Die gepufferten Häkchen liegen woanders (IndexedDB,
 * siehe src/lib/client/offline/), hier geht es nur darum, dass die Seite
 * überhaupt erscheint.
 *
 * Was hier bewusst NICHT zwischengespeichert wird: alles unter /api/ und jede
 * Anfrage an Supabase. Eine zwischengespeicherte Antwort mit Anmeldedaten oder
 * veralteten Listenständen wäre schlimmer als gar keine Offline-Fähigkeit.
 */

// Bei jeder Icon-Änderung erhöhen (s. layout.tsx/manifest.ts): der Sprung in
// diesem String ist die einzige Änderung an dieser Datei, die einen Browser
// dazu bringt, sie neu zu laden — erst dann verwirft `activate` unten die
// alten, für immer zwischengespeicherten Icons.
const VERSION = "emil-v2";
const PAGES = `${VERSION}-seiten`;
const ASSETS = `${VERSION}-dateien`;

self.addEventListener("install", (event) => {
  // Sofort übernehmen: bei einer App, die man vom Home-Bildschirm startet,
  // will niemand erst alle Tabs schließen, damit eine Aktualisierung greift.
  self.skipWaiting();
  event.waitUntil(
    caches.open(ASSETS).then((cache) =>
      cache.addAll(["/icons/icon-192.png?v=2", "/icons/apple-touch-icon.png?v=2"]),
    ),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names.filter((name) => !name.startsWith(VERSION)).map((name) => caches.delete(name)),
      );
      await self.clients.claim();
    })(),
  );
});

function isCacheableAsset(url) {
  // Turbopack und Next vergeben gehashte Dateinamen — die dürfen dauerhaft
  // aus dem Speicher kommen, weil sich ihr Inhalt nie ändert.
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname === "/manifest.webmanifest"
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Fremde Adressen (Supabase, Bilder aus dem Storage) gehen unberührt durch.
  if (url.origin !== self.location.origin) return;

  // Eigene API-Routen nie zwischenspeichern.
  if (url.pathname.startsWith("/api/")) return;

  if (isCacheableAsset(url)) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ??
          fetch(request).then((response) => {
            if (response.ok) {
              const copy = response.clone();
              void caches.open(ASSETS).then((cache) => cache.put(request, copy));
            }
            return response;
          }),
      ),
    );
    return;
  }

  // Seitenaufrufe: zuerst das Netz, damit man immer den frischen Stand sieht;
  // schlägt es fehl, die zuletzt gesehene Fassung. Genau das ist der
  // Supermarkt-Fall — die Liste erscheint, und die Oberfläche legt darüber,
  // was lokal gepuffert ist.
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(request);
          if (response.ok) {
            const copy = response.clone();
            void caches.open(PAGES).then((cache) => cache.put(request, copy));
          }
          return response;
        } catch {
          const cached = await caches.match(request);
          if (cached) return cached;
          const fallback = await caches.match("/liste");
          if (fallback) return fallback;
          return new Response(
            "<!doctype html><meta charset=utf-8><title>Offline</title>" +
              "<body style='font:16px -apple-system,sans-serif;padding:2rem'>" +
              "<h1>Keine Verbindung</h1><p>Diese Seite war noch nicht geladen. " +
              "Sobald wieder Netz da ist, funktioniert alles wie gewohnt.</p>",
            { status: 200, headers: { "content-type": "text/html; charset=utf-8" } },
          );
        }
      })(),
    );
  }
});
