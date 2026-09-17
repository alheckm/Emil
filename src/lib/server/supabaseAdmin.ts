import { createClient } from "@supabase/supabase-js";
import { getSecretKey, getSupabaseConfig } from "./env";

/**
 * Client mit dem Secret Key — umgeht RLS vollständig.
 *
 * Es gibt in der ganzen App genau einen berechtigten Aufrufer: das Löschen des
 * Kontos. Den Eintrag in `auth.users` kann kein Code im Nutzerkontext
 * entfernen, die Tabelle gehört dem Nutzer nicht. Alles andere — auch das
 * Aufräumen der Haushaltsdaten — läuft weiter durch RLS.
 *
 * Bewusst eine eigene Datei mit eigenem Namen: `getServerSupabase()` aus
 * supabase.ts darf man gedankenlos benutzen, diese Funktion nicht.
 */
export function getAdminSupabase() {
  const config = getSupabaseConfig();
  const secretKey = getSecretKey();
  if (!config || !secretKey) return null;

  return createClient(config.url, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
