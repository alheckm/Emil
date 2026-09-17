import { cacheLife } from "next/cache";
import { getActiveListId, listPlannedRecipes } from "@/lib/data/shoppingList";
import { requireHousehold } from "./household";

/**
 * Welche Liste ist aktiv, und welches Rezept liegt mit wie vielen Portionen
 * darauf.
 *
 * Warum das zusammen und zwischengespeichert gehört: beide Abfragen hängen am
 * Haushalt, nicht an der Adresse. Damit sind sie für Next keine URL-Daten und
 * dürfen in die App Shell — sie liegen also bereit, bevor auf ein Rezept
 * getippt wird. Vorher waren es zwei aufeinander folgende Abfragen mitten im
 * kritischen Pfad; `listPlannedRecipes` konnte gar nicht erst starten, bevor
 * `getActiveListId` zurück war.
 *
 * Das Ergebnis hat noch eine zweite Aufgabe: `plannedServings` bestimmt, bei
 * welcher Portionszahl der Wähler am Rezept startet. Käme dieser Wert
 * nachträglich hereingeströmt, spränge die Zahl unter dem Daumen um. Genau
 * deshalb steht er hier im Zwischenspeicher und nicht hinter einer
 * Suspense-Grenze.
 *
 * `revalidate: 30` ist der Ausgleich: legt das zweite Handy etwas auf die
 * Liste, ist das hier höchstens eine halbe Minute lang nicht zu sehen. Eigene
 * Änderungen sind sofort da — `router.refresh()` leert den Client-Cache dieser
 * Route mit.
 */
export type ListState = {
  listId: string | null;
  planned: Record<string, number>;
  error: string | null;
};

export async function getListState(): Promise<ListState> {
  "use cache: private";
  cacheLife({ stale: 300, revalidate: 30, expire: 900 });

  const context = await requireHousehold();
  if (!context.ok) return { listId: null, planned: {}, error: context.error };

  const { supabase, household } = context;
  const list = await getActiveListId(supabase, household.id);
  if (!list.ok) return { listId: null, planned: {}, error: list.error };

  const planned = await listPlannedRecipes(supabase, list.value);
  return {
    listId: list.value,
    planned: planned.ok ? planned.value : {},
    error: null,
  };
}
