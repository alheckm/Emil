import { cookies } from "next/headers";
import { cacheLife } from "next/cache";
import { createServerClient } from "@supabase/ssr";
import { getSupabaseConfig } from "./env";

/**
 * Supabase-Client für Server-Komponenten und Route Handler.
 *
 * Arbeitet mit der Sitzung des angemeldeten Nutzers, damit jede Abfrage durch
 * dieselben RLS-Policies läuft wie im Browser. Der Secret Key kommt hier
 * absichtlich nicht vor — der umgeht RLS und gehört nur in Wartungsskripte
 * und in die Konto-Löschung.
 *
 * Bewusst **nicht** zwischengespeichert: ein Client ist nicht serialisierbar
 * und käme über keine Cache-Grenze. Er ist aber auch billig — hier passiert
 * nur ein Cookie-Zugriff, kein Netzverkehr.
 */
export async function getServerSupabase() {
  const config = getSupabaseConfig();
  if (!config) return null;

  const cookieStore = await cookies();

  return createServerClient(config.url, config.anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (items) => {
        try {
          for (const { name, value, options } of items) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // In Server-Komponenten sind Cookies schreibgeschützt; das Setzen
          // übernimmt dort der Proxy (src/proxy.ts). Kein Fehlerfall.
        }
      },
    },
  });
}

/** Was die App vom angemeldeten Nutzer tatsächlich braucht — mehr nicht. */
export type SessionUser = { id: string; email: string | null };

/**
 * Angemeldeter Nutzer oder null.
 *
 * Zwei Dinge stehen hier bewusst so:
 *
 * **`getClaims()` statt `getUser()`.** `getUser()` legt das Token bei jedem
 * Aufruf dem Auth-Server vor — eine volle Netzrunde, und zwar auf dem
 * kritischen Pfad *jeder* Navigation. `getClaims()` prüft die Signatur bei
 * asymmetrischen Signing Keys lokal per WebCrypto (dieses Projekt signiert mit
 * ES256, siehe `/auth/v1/.well-known/jwks.json`). Sicherheitsgleichwertig:
 * beide verifizieren wirklich — im Gegensatz zu `getSession()`, das dem Cookie
 * blind glaubt. Läuft das Token bald ab, frischt `getClaims()` die Sitzung
 * vorher selbst auf.
 *
 * **`use cache: private`.** Damit bekommt der Session-Zugriff eine
 * Lebensdauer und landet in der App Shell — er ist dann schon da, bevor
 * geklickt wird. `stale: 300` ist keine runde Zahl aus Bequemlichkeit: unter
 * fünf Minuten fällt der Eintrag aus der App Shell, unter 30 Sekunden ganz aus
 * dem Prefetching. Zwischengespeichert wird ausschließlich im Browser des
 * Nutzers, nie auf dem Server.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  "use cache: private";
  cacheLife({ stale: 300, revalidate: 60, expire: 900 });

  const supabase = await getServerSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) return null;

  const { sub, email } = data.claims;
  return { id: sub, email: typeof email === "string" ? email : null };
}
