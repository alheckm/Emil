"use client";

import { useSyncExternalStore } from "react";

/**
 * Ist gerade Netz da?
 *
 * `useSyncExternalStore` statt eines Effekts mit Zustand: das ist genau der
 * Fall, für den der Hook gedacht ist — ein Wert außerhalb von React, der sich
 * jederzeit ändern kann. Auf dem Server und beim ersten Rendern gilt bewusst
 * „online", sonst blitzte bei jedem Seitenaufruf kurz ein Offline-Hinweis auf.
 *
 * Achtung bei der Aussagekraft: `navigator.onLine` meldet nur, ob das Gerät in
 * einem Netz hängt — nicht, ob der Server erreichbar ist. Im Supermarkt mit
 * einem Balken steht oft „online", während nichts durchgeht. Deshalb hängt die
 * App nicht an diesem Wert, sondern puffert grundsätzlich und verschickt, was
 * geht; der Wert dient nur der Anzeige und als Auslöser fürs Nachliefern.
 */
function subscribe(onChange: () => void): () => void {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
}

export function useOnlineStatus(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true,
  );
}
