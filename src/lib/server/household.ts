import { redirect } from "next/navigation";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { listHouseholds, type Household } from "@/lib/data/households";
import { getCurrentUser, getServerSupabase } from "./supabase";

/**
 * Der immer gleiche Vorspann jeder angemeldeten Seite: Nutzer, Client, Haushalt.
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
  | { ok: true; supabase: SupabaseClient; user: User; household: Household }
  | { ok: false; error: string };

export async function requireHousehold(): Promise<HouseholdContext> {
  const user = await getCurrentUser();
  if (!user) redirect("/anmelden");

  const supabase = await getServerSupabase();
  if (!supabase) redirect("/anmelden");

  const households = await listHouseholds(supabase);
  if (!households.ok) return { ok: false, error: households.error };
  if (households.value.length === 0) redirect("/haushalt/start");

  return { ok: true, supabase, user, household: households.value[0] };
}
