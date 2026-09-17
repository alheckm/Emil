"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import { setEntryChecked } from "@/lib/data/shoppingList";
import { clearToggle, pendingToggles, queueToggle } from "./db";
import type { PendingToggle } from "./db";

/**
 * Gepufferte Häkchen nachliefern.
 *
 * Jeder Eintrag trägt den Zeitpunkt des Antippens; `set_entry_checked`
 * vergleicht ihn mit dem Stand in der Datenbank und lässt einen veralteten
 * Puffer wirkungslos verfallen. Dadurch kann ein Nachzügler kein neueres
 * Häkchen vom anderen Handy überschreiben.
 */

export interface FlushResult {
  sent: number;
  /** Bleibt liegen, weil gerade nichts rausgeht — kein Fehler des Nutzers. */
  remaining: number;
}

export async function rememberToggle(
  entryId: string,
  checked: boolean,
): Promise<PendingToggle> {
  const toggle: PendingToggle = {
    entryId,
    checked,
    clientUpdatedAt: new Date().toISOString(),
  };
  await queueToggle(toggle);
  return toggle;
}

export async function flushOutbox(
  supabase: SupabaseClient,
): Promise<FlushResult> {
  const pending = await pendingToggles();
  if (pending.length === 0) return { sent: 0, remaining: 0 };

  let sent = 0;
  let remaining = 0;

  for (const toggle of pending) {
    const result = await setEntryChecked(
      supabase,
      toggle.entryId,
      toggle.checked,
      toggle.clientUpdatedAt,
    );

    if (result.ok) {
      await clearToggle(toggle.entryId);
      sent += 1;
      continue;
    }

    // Die Zeile gibt es nicht mehr — jemand hat das Rezept von der Liste
    // genommen. Weiter zu versuchen hilft niemandem, also wegräumen.
    if (result.error.includes("gibt es nicht mehr")) {
      await clearToggle(toggle.entryId);
      continue;
    }

    remaining += 1;
  }

  return { sent, remaining };
}

export { pendingToggles } from "./db";
export type { PendingToggle } from "./db";
