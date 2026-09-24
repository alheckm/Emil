import { cacheLife } from "next/cache";
import { getAvatarUrl, getProfile } from "@/lib/data/profiles";
import { getCurrentUser, getServerSupabase } from "./supabase";

export type MyAvatar = { initial: string | null; avatarUrl: string | null };

/**
 * Avatar-Initiale und Foto-URL des angemeldeten Nutzers für die Tabbar.
 *
 * Derselbe Zuschnitt wie `loadHousehold()` in `household.ts`: der teure Teil
 * (Sitzung prüfen, Profil und signierte URL holen) bekommt hier eine
 * Lebensdauer und wandert dadurch in die App Shell — nur Serialisierbares
 * (kein `SupabaseClient`) verlässt die Funktion.
 */
export async function getMyAvatar(): Promise<MyAvatar> {
  "use cache: private";
  cacheLife({ stale: 300, revalidate: 60, expire: 900 });

  const user = await getCurrentUser();
  if (!user) return { initial: null, avatarUrl: null };

  const fallbackInitial = user.email?.trim().charAt(0).toUpperCase() || null;

  const supabase = await getServerSupabase();
  if (!supabase) return { initial: fallbackInitial, avatarUrl: null };

  const profile = await getProfile(supabase, user.id);
  const displayName = profile.ok ? profile.value?.displayName : null;
  const avatarPath = profile.ok ? (profile.value?.avatarPath ?? null) : null;

  return {
    initial: displayName?.trim().charAt(0).toUpperCase() || fallbackInitial,
    avatarUrl: await getAvatarUrl(supabase, avatarPath),
  };
}
