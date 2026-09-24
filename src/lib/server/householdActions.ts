"use server";

import { updateTag } from "next/cache";
import { createHousehold, redeemInvite } from "@/lib/data/households";
import { setActiveHousehold } from "@/lib/data/profiles";
import { fail, ok, type Result } from "@/lib/data/result";
import { householdContextTag } from "./household";
import { getCurrentUser, getServerSupabase } from "./supabase";

/**
 * Haushalt wechseln, anlegen oder per Code beitreten — und dabei den
 * *aktiven* Haushalt sofort sichtbar machen.
 *
 * Server Actions statt Browser-Client, obwohl `setActiveHousehold()` &
 * Co. genauso gut über `getBrowserSupabase()` liefen (und das zuerst auch
 * taten): `loadHousehold()` (household.ts) ist `"use cache: private"` und
 * blieb dabei bis zu `revalidate: 60` Sekunden lang beim alten Haushalt
 * stehen, selbst nach hartem Neuladen — `updateTag()` räumt genau das
 * sofort weg, kann aber nur innerhalb einer Server Action laufen (Next-Doku:
 * „Can only be used in Server Actions"), nicht aus einer Route oder vom
 * Client aus.
 *
 * Jede Funktion holt sich Nutzer und Supabase-Client selbst — Aufrufer
 * geben nur mit, was inhaltlich zur jeweiligen Aktion gehört.
 */

async function context(): Promise<Result<{ userId: string; supabase: NonNullable<Awaited<ReturnType<typeof getServerSupabase>>> }>> {
  const user = await getCurrentUser();
  if (!user) return fail("Nicht angemeldet.");
  const supabase = await getServerSupabase();
  if (!supabase) return fail("Supabase ist nicht konfiguriert.");
  return ok({ userId: user.id, supabase });
}

export async function switchActiveHousehold(householdId: string): Promise<Result> {
  const ctx = await context();
  if (!ctx.ok) return ctx;
  const { userId, supabase } = ctx.value;

  const result = await setActiveHousehold(supabase, userId, householdId);
  if (!result.ok) return result;

  updateTag(householdContextTag(userId));
  return ok(undefined);
}

export async function createAndSwitchHousehold(name: string): Promise<Result<string>> {
  const ctx = await context();
  if (!ctx.ok) return ctx;
  const { userId, supabase } = ctx.value;

  const created = await createHousehold(supabase, name);
  if (!created.ok) return created;

  const activated = await setActiveHousehold(supabase, userId, created.value);
  if (!activated.ok) return activated;

  updateTag(householdContextTag(userId));
  return ok(created.value);
}

export async function redeemAndSwitchHousehold(code: string): Promise<Result<string>> {
  const ctx = await context();
  if (!ctx.ok) return ctx;
  const { userId, supabase } = ctx.value;

  const joined = await redeemInvite(supabase, code);
  if (!joined.ok) return joined;

  const activated = await setActiveHousehold(supabase, userId, joined.value);
  if (!activated.ok) return activated;

  updateTag(householdContextTag(userId));
  return ok(joined.value);
}
