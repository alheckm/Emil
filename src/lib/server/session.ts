import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getSupabaseConfig } from "./env";

/**
 * Sitzung bei jedem Request auffrischen — aufgerufen aus src/proxy.ts.
 *
 * Supabase-Zugriffstoken laufen nach einer Stunde ab. Ohne diese Auffrischung
 * hielte eine Server-Komponente eine abgelaufene Sitzung für gültig, bis der
 * Browser das nächste Mal von sich aus erneuert — beim Aufruf aus dem
 * Home-Bildschirm heraus also womöglich nie. Der Nutzer sähe „nicht
 * angemeldet", obwohl er sich gerade angemeldet hat.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const config = getSupabaseConfig();
  if (!config) return response;

  const supabase = createServerClient(config.url, config.anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (items) => {
        // Zweimal setzen ist kein Versehen: einmal auf dem Request, damit
        // nachgelagerte Server-Komponenten in diesem Durchlauf schon das
        // frische Token sehen, und einmal auf der Antwort, damit der Browser
        // es behält.
        for (const { name, value } of items) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of items) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // Muss prüfen, nicht bloß lesen: getSession() glaubt dem Cookie blind und
  // überstünde auch ein gefälschtes. getClaims() verifiziert die Signatur
  // wirklich — bei asymmetrischen Signing Keys (dieses Projekt: ES256) lokal
  // per WebCrypto, also ohne Netzrunde zum Auth-Server. Genau das ist der
  // Unterschied zu getUser(), das hier auf JEDEM Request eine volle Runde
  // gekostet hat, Prefetches eingeschlossen. Läuft das Token bald ab, frischt
  // getClaims() die Sitzung vorher selbst auf — der eigentliche Zweck bleibt.
  await supabase.auth.getClaims();

  return response;
}
