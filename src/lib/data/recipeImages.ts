import type { SupabaseClient } from "@supabase/supabase-js";
import { fail, ok, type Result } from "./result";
import { dataErrorMessage, storageErrorMessage } from "./errors";

/**
 * Rezeptbilder im Storage-Bucket `recipe-images`.
 *
 * Der Bucket ist privat, und die Policy prüft den ERSTEN Pfadabschnitt gegen
 * die Haushalte des Nutzers. Der Pfad ist deshalb kein Detail, sondern die
 * Zugriffsgrenze: {household_id}/{recipe_id}/{dateiname}. Wer ihn anders baut,
 * hebelt die Prüfung aus — darum wird er hier an genau einer Stelle erzeugt.
 *
 * Bilder werden nicht ausgelesen, nur aufbewahrt und angezeigt. Das
 * Digitalisieren eines Kochbuchfotos passiert in claude.ai, siehe importPrompt.
 */

const BUCKET = "recipe-images";

/** Signierte URLs sind kurzlebig; eine Stunde überdauert jeden Seitenaufruf. */
const SIGNED_URL_TTL_SECONDS = 3600;

export function buildImagePath(
  householdId: string,
  recipeId: string,
  fileName: string,
): string {
  const extension = fileName.toLowerCase().match(/\.(jpe?g|png|webp|heic)$/)?.[1];
  // Auf eine bekannte Endung normalisieren: der Dateiname kommt vom Gerät und
  // enthält auf iOS gern Leerzeichen und Doppelpunkte.
  const suffix = extension === "jpeg" ? "jpg" : (extension ?? "jpg");
  return `${householdId}/${recipeId}/${crypto.randomUUID()}.${suffix}`;
}

export async function uploadRecipeImage(
  supabase: SupabaseClient,
  householdId: string,
  recipeId: string,
  file: File,
): Promise<Result<string>> {
  const path = buildImagePath(householdId, recipeId, file.name);

  const upload = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type || "image/jpeg", upsert: false });
  if (upload.error) return fail(storageErrorMessage(upload.error));

  // Erst nach erfolgreichem Upload am Rezept vermerken — sonst zeigt das
  // Rezept auf eine Datei, die es nicht gibt.
  const update = await supabase
    .from("recipes")
    .update({ image_path: path })
    .eq("id", recipeId);
  if (update.error) {
    // Aufräumen, damit keine verwaiste Datei im Bucket zurückbleibt.
    await supabase.storage.from(BUCKET).remove([path]);
    return fail(dataErrorMessage(update.error));
  }

  return ok(path);
}

/** Bild entfernen: erst vom Rezept lösen, dann die Datei löschen. */
export async function removeRecipeImage(
  supabase: SupabaseClient,
  recipeId: string,
  path: string,
): Promise<Result> {
  const update = await supabase
    .from("recipes")
    .update({ image_path: null })
    .eq("id", recipeId);
  if (update.error) return fail(dataErrorMessage(update.error));

  const removal = await supabase.storage.from(BUCKET).remove([path]);
  // Eine Datei, die sich nicht löschen lässt, ist nur Ballast im Speicher —
  // das Rezept zeigt sie bereits nicht mehr an. Kein Grund, den Nutzer mit
  // einem Fehler zu behelligen.
  if (removal.error) return ok(undefined);
  return ok(undefined);
}

/**
 * Anzeigbare URL für ein gespeichertes Bild.
 *
 * Signiert statt öffentlich: der Bucket ist privat, damit ein Rezeptbild nicht
 * über eine erratene URL im Netz steht.
 */
export async function getRecipeImageUrl(
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
