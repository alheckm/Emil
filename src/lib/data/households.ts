import type { SupabaseClient } from "@supabase/supabase-js";
import { dataErrorMessage } from "./errors";
import { getAvatarUrls, getProfiles } from "./profiles";
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
 * `userId` muss explizit mitgegeben werden, `household_members_select`
 * (0006_rls.sql) reicht dafür nicht: die Policy zeigt alle Mitgliedschaften
 * der EIGENEN Haushalte, nicht nur die eigene Zeile — richtig für die
 * Mitgliederliste (`listMembers()`), aber ohne den Filter hier lieferte diese
 * Funktion eine Zeile pro Mitbewohner:in zurück, mit dem gleichen Haushalt
 * mehrfach. Bei zwei Personen im selben Haushalt sah das aus wie zwei
 * Haushalte — sichtbar geworden als „Encountered two children with the same
 * key" im Haushalts-Wechsler (HouseholdSwitcher.tsx), der als erster über
 * `household.id` rendert statt die Liste nur auf Länge zu prüfen.
 *
 * Wer in mehreren Mitglied ist, wählt in `/einstellungen` den aktiven aus
 * (`profiles.active_household_id`, siehe `loadHousehold()` in
 * `household.ts`). Diese Sortierung ist nur noch der Rückfall, wenn (noch)
 * keiner gewählt ist — dann zeigt `/liste` & Co. den zuletzt beigetretenen,
 * etwa direkt nach `/beitreten/[code]`. `created_at` sortiert hier über
 * `household_members`, nicht über `households` — gemeint ist der Zeitpunkt
 * des Beitritts.
 */
export async function listHouseholds(
  supabase: SupabaseClient,
  userId: string,
): Promise<Result<Household[]>> {
  const { data, error } = await supabase
    .from("household_members")
    .select("role, households (id, name)")
    .eq("user_id", userId)
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

export interface MemberProfile extends Member {
  displayName: string | null;
  avatarUrl: string | null;
}

/**
 * Mitglieder samt Klarname und signierter Foto-URL — für die Mitgliederliste
 * im Haushalt und die Zuweisung bei Aufgaben. Zwei zusätzliche Abfragen statt
 * eines Joins: `profiles` hat keine Fremdschlüsselbeziehung zu
 * `household_members`, PostgREST könnte sie nicht auflösen (siehe
 * `profiles.ts`).
 */
export async function listMembersWithProfiles(
  supabase: SupabaseClient,
  householdId: string,
): Promise<Result<MemberProfile[]>> {
  const members = await listMembers(supabase, householdId);
  if (!members.ok) return members;

  const profiles = await getProfiles(supabase, members.value.map((member) => member.userId));
  const profileByUser = new Map(
    (profiles.ok ? profiles.value : []).map((profile) => [profile.userId, profile]),
  );
  const avatarUrls = await getAvatarUrls(
    supabase,
    (profiles.ok ? profiles.value : []).map((profile) => profile.avatarPath),
  );

  return ok(
    members.value.map((member) => {
      const profile = profileByUser.get(member.userId);
      return {
        ...member,
        displayName: profile?.displayName ?? null,
        avatarUrl: profile?.avatarPath ? (avatarUrls[profile.avatarPath] ?? null) : null,
      };
    }),
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
