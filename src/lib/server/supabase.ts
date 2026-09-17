import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { getSupabaseConfig } from "./env";

/**
 * Supabase-Client für Server-Komponenten und Route Handler.
 *
 * Arbeitet mit der Sitzung des angemeldeten Nutzers, damit jede Abfrage durch
 * dieselben RLS-Policies läuft wie im Browser. Der Secret Key kommt hier
 * absichtlich nicht vor — der umgeht RLS und gehört nur in Wartungsskripte
 * und in die Konto-Löschung.
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

/** Angemeldeter Nutzer oder null. */
export async function getCurrentUser() {
  const supabase = await getServerSupabase();
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}
