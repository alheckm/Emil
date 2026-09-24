import type { SupabaseClient } from "@supabase/supabase-js";
import { dataErrorMessage, storageErrorMessage } from "./errors";
import { fail, ok, type Result } from "./result";

/**
 * Klarname und Profilfoto — sichtbar im eigenen Konto, im Haushalt und bei
 * zugewiesenen Aufgaben.
 *
 * Der Bucket `avatars` ist privat, und die Policy prüft den ERSTEN
 * Pfadabschnitt gegen die user_id (0024_profil.sql). Der Pfad ist deshalb
 * keine Nebensache, sondern die Zugriffsgrenze: {user_id}/{dateiname}. Wer
 * ihn anders baut, hebelt die Prüfung aus — darum wird er hier an genau einer
 * Stelle erzeugt, wie bei `recipeImages.ts`.
 */

const BUCKET = "avatars";

/** Signierte URLs sind kurzlebig; eine Stunde überdauert jeden Seitenaufruf. */
const SIGNED_URL_TTL_SECONDS = 3600;

export interface Profile {
  userId: string;
  displayName: string | null;
  avatarPath: string | null;
  activeHouseholdId: string | null;
}

function toProfile(row: {
  user_id: string;
  display_name: string | null;
  avatar_path: string | null;
  active_household_id?: string | null;
}): Profile {
  return {
    userId: row.user_id,
    displayName: row.display_name,
    avatarPath: row.avatar_path,
    activeHouseholdId: row.active_household_id ?? null,
  };
}

export async function getProfile(
  supabase: SupabaseClient,
  userId: string,
): Promise<Result<Profile | null>> {
  const { data, error } = await supabase
    .from("profiles")
    .select("user_id, display_name, avatar_path, active_household_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) return fail(dataErrorMessage(error));
  return ok(data ? toProfile(data) : null);
}

/**
 * Profile mehrerer Nutzer:innen auf einmal — für Mitgliederliste und
 * Aufgaben-Zuweisung. Kein Join von `household_members` aus: dafür gibt es
 * keine Fremdschlüsselbeziehung, PostgREST könnte ihn nicht auflösen.
 */
export async function getProfiles(
  supabase: SupabaseClient,
  userIds: string[],
): Promise<Result<Profile[]>> {
  if (userIds.length === 0) return ok([]);

  const { data, error } = await supabase
    .from("profiles")
    .select("user_id, display_name, avatar_path")
    .in("user_id", userIds);

  if (error) return fail(dataErrorMessage(error));
  return ok((data ?? []).map(toProfile));
}

export async function setDisplayName(
  supabase: SupabaseClient,
  userId: string,
  displayName: string,
): Promise<Result> {
  const { error } = await supabase
    .from("profiles")
    .upsert({ user_id: userId, display_name: displayName }, { onConflict: "user_id" });

  return error ? fail(dataErrorMessage(error)) : ok(undefined);
}

/**
 * Welchen Haushalt Home, Liste und Aufgaben zeigen, wenn jemand mehreren
 * angehört (siehe 0026_aktiver_haushalt.sql). Die Policy lässt nur
 * Haushalte zu, in denen man selbst Mitglied ist — ein ungültiger Wert
 * kommt deshalb nicht als App-Fehler, sondern als RLS-Ablehnung zurück.
 */
export async function setActiveHousehold(
  supabase: SupabaseClient,
  userId: string,
  householdId: string,
): Promise<Result> {
  const { error } = await supabase
    .from("profiles")
    .upsert({ user_id: userId, active_household_id: householdId }, { onConflict: "user_id" });

  return error ? fail(dataErrorMessage(error)) : ok(undefined);
}

function buildAvatarPath(userId: string, fileName: string): string {
  const extension = fileName.toLowerCase().match(/\.(jpe?g|png|webp|heic)$/)?.[1];
  const suffix = extension === "jpeg" ? "jpg" : (extension ?? "jpg");
  return `${userId}/${crypto.randomUUID()}.${suffix}`;
}

/**
 * Foto hochladen und im Profil vermerken. Ein vorheriges Foto wird erst
 * danach gelöscht, nicht vorher — schlägt der Upload fehl, bleibt das alte
 * Foto stehen statt spurlos zu verschwinden.
 */
export async function uploadAvatar(
  supabase: SupabaseClient,
  userId: string,
  file: File,
  previousPath: string | null,
): Promise<Result<string>> {
  const path = buildAvatarPath(userId, file.name);

  const upload = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type || "image/jpeg", upsert: false });
  if (upload.error) return fail(storageErrorMessage(upload.error));

  const update = await supabase
    .from("profiles")
    .upsert({ user_id: userId, avatar_path: path }, { onConflict: "user_id" });
  if (update.error) {
    // Aufräumen, damit keine verwaiste Datei im Bucket zurückbleibt.
    await supabase.storage.from(BUCKET).remove([path]);
    return fail(dataErrorMessage(update.error));
  }

  if (previousPath) await supabase.storage.from(BUCKET).remove([previousPath]);
  return ok(path);
}

export async function removeAvatar(
  supabase: SupabaseClient,
  userId: string,
  path: string,
): Promise<Result> {
  const update = await supabase
    .from("profiles")
    .update({ avatar_path: null })
    .eq("user_id", userId);
  if (update.error) return fail(dataErrorMessage(update.error));

  // Eine Datei, die sich nicht löschen lässt, ist nur Ballast im Speicher —
  // das Profil zeigt sie bereits nicht mehr an. Kein Grund für einen Fehler.
  await supabase.storage.from(BUCKET).remove([path]);
  return ok(undefined);
}

export async function getAvatarUrl(
  supabase: SupabaseClient,
  path: string | null,
): Promise<string | null> {
  if (!path) return null;
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
  if (error || !data) return null;
  return data.signedUrl;
}

/** Signierte URLs für mehrere Pfade auf einmal — eine Netzrunde statt vieler. */
export async function getAvatarUrls(
  supabase: SupabaseClient,
  paths: (string | null)[],
): Promise<Record<string, string>> {
  const wanted = [...new Set(paths.filter((path): path is string => !!path))];
  if (wanted.length === 0) return {};

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrls(wanted, SIGNED_URL_TTL_SECONDS);
  if (error || !data) return {};

  const urls: Record<string, string> = {};
  for (const item of data) {
    if (item.path && item.signedUrl) urls[item.path] = item.signedUrl;
  }
  return urls;
}
