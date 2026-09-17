/**
 * Zugriff auf die Supabase-Konfiguration mit klarer Fehlermeldung.
 *
 * Ohne diese Prüfung äußert sich ein fehlender Eintrag als „Invalid URL" tief
 * im Supabase-Client — eine Meldung, mit der man nichts anfangen kann.
 */

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export function getSupabaseConfig(): SupabaseConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  return { url, anonKey };
}

export const SUPABASE_MISSING_MESSAGE =
  "Supabase ist nicht konfiguriert. Trage NEXT_PUBLIC_SUPABASE_URL und " +
  "NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local (lokal) bzw. in den " +
  "Vercel-Projekteinstellungen ein.";

/**
 * Secret Key (`sb_secret_…`) — umgeht RLS vollständig.
 *
 * Nur an einer einzigen Stelle in der App erlaubt: beim Löschen des Kontos.
 * Den Auth-Nutzer selbst zu entfernen kann kein Code im Nutzerkontext, denn
 * `auth.users` gehört nicht dem Nutzer. Alles andere läuft über RLS.
 *
 * Bewusst ohne `NEXT_PUBLIC_`-Präfix: sonst würde Next den Wert in das
 * Browser-Bundle schreiben und jeder Besucher hätte volle Datenbankrechte.
 */
export function getSecretKey(): string | null {
  return process.env.SUPABASE_SECRET_KEY || null;
}

export const SECRET_KEY_MISSING_MESSAGE =
  "Das Konto kann gerade nicht gelöscht werden: SUPABASE_SECRET_KEY fehlt. " +
  "Der Wert steht im Supabase-Dashboard unter Project Settings → API keys → " +
  "secret keys und gehört in .env.local bzw. in die Vercel-Projekt" +
  "einstellungen (niemals als NEXT_PUBLIC_*).";

