import { redirect } from "next/navigation";
import { cacheLife } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { listHouseholds, type Household } from "@/lib/data/households";
import { getCurrentUser, getServerSupabase } from "./supabase";

/**
 * Der immer gleiche Vorspann jeder angemeldeten Seite: Client und Haushalt.
 *
 * Die Weichen (nicht angemeldet → Anmeldung, kein Haushalt → Haushalt anlegen)
 * gehören auf den Server. Im Browser blitzte sonst kurz der falsche Bildschirm
 * auf, und im Standalone-Modus sieht man genau das besonders deutlich.
 *
 * Ein Fehler beim Laden führt dagegen **nicht** zur Weiterleitung: der Screen
 * soll ihn zeigen. Eine Weiterleitung würde einen vorübergehenden
 * Netzwerkfehler in „du hast keinen Haushalt" verwandeln.
 */
export type HouseholdContext =
  | { ok: true; supabase: SupabaseClient; household: Household }
  | { ok: false; error: string };

/**
 * Ladefehler als Ausnahme statt als Rückgabewert — nur hier drin.
 *
 * Der Grund ist der Zwischenspeicher: ein zurückgegebenes `{ ok: false }` wäre
 * ein ganz normales Ergebnis und bliebe fünf Minuten lang stehen. Eine einzige
 * wacklige Verbindung würde den Haushalt damit für fünf Minuten „kaputt"
 * halten. Geworfenes wird nicht zwischengespeichert; draußen wird daraus
 * wieder das `Result`, das die Screens erwarten.
 */
class HouseholdLoadError extends Error {}

/**
 * Nur der Haushalt — und damit ausschließlich Serialisierbares.
 *
 * Das ist der Grund für den Zuschnitt: ein `SupabaseClient` ist nicht
 * serialisierbar und käme über keine Cache-Grenze. Er wird deshalb draußen
 * frisch erzeugt (kostet nur einen Cookie-Zugriff), während hier drinnen der
 * teure Teil liegt — Sitzung prüfen und Haushalt holen — und eine Lebensdauer
 * bekommt. Damit wandert dieser Teil in die App Shell und ist vor dem Klick da.
 */
async function loadHousehold(): Promise<Household> {
  "use cache: private";
  cacheLife({ stale: 300, revalidate: 60, expire: 900 });

  // `redirect()` wirft, um das Rendern abzubrechen, und wird deshalb nicht
  // mitgespeichert — zwischengespeichert wird nur ein echter Haushalt.
  const user = await getCurrentUser();
  if (!user) redirect("/anmelden");

  const supabase = await getServerSupabase();
  if (!supabase) redirect("/anmelden");

  const households = await listHouseholds(supabase);
  if (!households.ok) throw new HouseholdLoadError(households.error);
  if (households.value.length === 0) redirect("/haushalt/start");

  return households.value[0];
}

export async function requireHousehold(): Promise<HouseholdContext> {
  const supabase = await getServerSupabase();
  if (!supabase) redirect("/anmelden");

  try {
    return { ok: true, supabase, household: await loadHousehold() };
  } catch (error) {
    if (error instanceof HouseholdLoadError) {
      return { ok: false, error: error.message };
    }
    // Alles andere — allen voran die Ausnahme aus `redirect()` — muss
    // unberührt weiterfliegen, sonst verschluckt dieser Block die Weiterleitung.
    throw error;
  }
}
