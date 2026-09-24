import type { SupabaseClient } from "@supabase/supabase-js";
import { dataErrorMessage } from "./errors";
import { fail, ok, type Result } from "./result";

/**
 * Haushalte, Mitglieder, Einladungen.
 *
 * Geschrieben wird hier nichts direkt: Mitgliedschaften entstehen
 * ausschließlich in `create_household()` und `redeem_invite()`. Gäbe es eine
 * INSERT-Policy auf `household_members`, könnte sich jeder mit einer geratenen
 * `household_id` in einen fremden Haushalt eintragen — die Begründung steht
 * ausführlich in 0005_funktionen.sql.
 */

export type Role = "owner" | "member";

export interface Household {
  id: string;
  name: string;
  role: Role;
}

export interface Member {
  userId: string;
  role: Role;
  joinedAt: string;
}

/**
 * Haushalte des angemeldeten Nutzers, neueste Mitgliedschaft zuerst.
 *
 * Meistens genau einer. Mehrere kommen vor, solange jemand einer weiteren
 * Einladung folgt, ohne den alten Haushalt vorher zu verlassen — `/liste` &
 * Co. zeigen dann den zuletzt beigetretenen (siehe `requireHousehold()`, das
 * Element 0 nimmt): wer über /beitreten/[code] beitritt, soll sofort im neuen
 * Haushalt landen, nicht weiter im alten, den `leaveHousehold()` danach
 * aufräumt. `created_at` sortiert hier über `household_members`, nicht über
 * `households` — gemeint ist der Zeitpunkt des Beitritts.
 */
export async function listHouseholds(
  supabase: SupabaseClient,
): Promise<Result<Household[]>> {
  const { data, error } = await supabase
    .from("household_members")
    .select("role, households (id, name)")
    .order("created_at", { ascending: false });

  if (error) return fail(dataErrorMessage(error));

  const rows = (data ?? []) as unknown as {
    role: Role;
    households: { id: string; name: string } | null;
  }[];

  return ok(
    rows
      .filter((row) => row.households !== null)
      .map((row) => ({
        id: row.households!.id,
        name: row.households!.name,
        role: row.role,
      })),
  );
}

export async function listMembers(
  supabase: SupabaseClient,
  householdId: string,
): Promise<Result<Member[]>> {
  const { data, error } = await supabase
    .from("household_members")
    .select("user_id, role, created_at")
    .eq("household_id", householdId)
    .order("created_at", { ascending: true });

  if (error) return fail(dataErrorMessage(error));

  return ok(
    (data ?? []).map((row) => ({
      userId: row.user_id as string,
      role: row.role as Role,
      joinedAt: row.created_at as string,
    })),
  );
}

/** Legt Haushalt, Eigentümer-Mitgliedschaft und leere Einkaufsliste an. */
export async function createHousehold(
  supabase: SupabaseClient,
  name: string,
): Promise<Result<string>> {
  const { data, error } = await supabase.rpc("create_household", {
    p_name: name,
  });
  return error ? fail(dataErrorMessage(error)) : ok(data as string);
}

/** Achtstelliger Code, gültig 14 Tage, einmal einlösbar. */
export async function createInvite(
  supabase: SupabaseClient,
  householdId: string,
): Promise<Result<string>> {
  const { data, error } = await supabase.rpc("create_invite", {
    p_household_id: householdId,
  });
  return error ? fail(dataErrorMessage(error)) : ok(data as string);
}

export async function redeemInvite(
  supabase: SupabaseClient,
  code: string,
): Promise<Result<string>> {
  const { data, error } = await supabase.rpc("redeem_invite", {
    p_code: code.trim().toUpperCase(),
  });
  return error ? fail(dataErrorMessage(error)) : ok(data as string);
}

/**
 * Offene, noch nicht eingelöste Einladungen eines Haushalts.
 *
 * Abgelaufene werden nicht gelöscht, sondern nur ausgeblendet: sie sind der
 * Beleg dafür, dass ein Code einmal existiert hat.
 */
export async function listOpenInvites(
  supabase: SupabaseClient,
  householdId: string,
): Promise<Result<{ code: string; expiresAt: string }[]>> {
  const { data, error } = await supabase
    .from("invites")
    .select("code, expires_at")
    .eq("household_id", householdId)
    .is("used_by", null)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });

  if (error) return fail(dataErrorMessage(error));

  return ok(
    (data ?? []).map((row) => ({
      code: row.code as string,
      expiresAt: row.expires_at as string,
    })),
  );
}

export async function revokeInvite(
  supabase: SupabaseClient,
  code: string,
): Promise<Result> {
  const { error } = await supabase.from("invites").delete().eq("code", code);
  return error ? fail(dataErrorMessage(error)) : ok(undefined);
}

/**
 * Einen Haushalt verlassen. Ist danach niemand mehr Mitglied, löscht die
 * Funktion ihn gleich mit — per Kaskade samt Rezepten, Einkaufsliste und
 * Aufgaben (siehe leave_household in 0023_haushalt_verlassen.sql).
 */
export async function leaveHousehold(
  supabase: SupabaseClient,
  householdId: string,
): Promise<Result> {
  const { error } = await supabase.rpc("leave_household", {
    p_household_id: householdId,
  });
  return error ? fail(dataErrorMessage(error)) : ok(undefined);
}
