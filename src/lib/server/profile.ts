import { cacheLife } from "next/cache";
import { getAvatarUrl, getProfile } from "@/lib/data/profiles";
import { getCurrentUser, getServerSupabase } from "./supabase";

export type MyProfile = {
  displayName: string | null;
  avatarPath: string | null;
  avatarUrl: string | null;
  /** Erster Buchstabe des Klarnamens, sonst der E-Mail-Adresse. */
  initial: string | null;
};

/**
 * Profil des angemeldeten Nutzers — für Tabbar-Avatar und Konto-Kopfzeile
 * dieselbe Quelle, damit beide dieselbe Netzrunde teilen (siehe unten) statt
 * doppelt zu laden.
 *
 * Derselbe Zuschnitt wie `loadHousehold()` in `household.ts`: der teure Teil
 * (Sitzung prüfen, Profil und signierte URL holen) bekommt hier eine
 * Lebensdauer und wandert dadurch in die App Shell — nur Serialisierbares
 * (kein `SupabaseClient`) verlässt die Funktion. Weil es dieselbe
 * `"use cache: private"`-Funktion ohne Argumente ist, führt ein zweiter
 * Aufruf innerhalb derselben Anfrage (Layout **und** Konto-Seite) nicht zu
 * einer zweiten Netzrunde.
 */
export async function getMyProfile(): Promise<MyProfile> {
  "use cache: private";
  cacheLife({ stale: 300, revalidate: 60, expire: 900 });

  const user = await getCurrentUser();
  if (!user) return { displayName: null, avatarPath: null, avatarUrl: null, initial: null };

  const fallbackInitial = user.email?.trim().charAt(0).toUpperCase() || null;

  const supabase = await getServerSupabase();
  if (!supabase) {
    return { displayName: null, avatarPath: null, avatarUrl: null, initial: fallbackInitial };
  }

  const profile = await getProfile(supabase, user.id);
  const displayName = profile.ok ? (profile.value?.displayName ?? null) : null;
  const avatarPath = profile.ok ? (profile.value?.avatarPath ?? null) : null;

  return {
    displayName,
    avatarPath,
    avatarUrl: await getAvatarUrl(supabase, avatarPath),
    initial: displayName?.trim().charAt(0).toUpperCase() || fallbackInitial,
  };
}
