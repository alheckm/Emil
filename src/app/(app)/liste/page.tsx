import { Suspense } from "react";
import { cacheLife } from "next/cache";
import { requireHousehold } from "@/lib/server/household";
import { getListState } from "@/lib/server/listState";
import { listCategories, listEntries } from "@/lib/data/shoppingList";
import { Notice, Screen } from "@/components/ui";
import { ListSkeleton } from "@/components/skeletons";
import { ListView } from "./ListView";

export const metadata = { title: "Einkaufsliste" };

/**
 * Die Einkaufsliste.
 *
 * Diese Seite ist der Grund, warum nicht einfach alles zwischengespeichert
 * wird. Eine fünf Minuten alte Liste im Supermarkt ist genau der Fehler, den
 * Emil vermeiden soll — man hakt etwas ab, das jemand anderes längst
 * gestrichen hat, oder legt zweimal dasselbe in den Wagen.
 *
 * Aufgeteilt ist es deshalb so:
 *
 * - **Rahmen und Überschrift** sind statisch und stehen sofort.
 * - **Abteilungen** sind Stammdaten und ändern sich praktisch nie — die dürfen
 *   liegen bleiben.
 * - **Die Zeilen selbst** werden bei jedem Aufruf frisch geholt und strömen
 *   hinter einem Skelett nach. Aktuell *bleiben* sie durch die
 *   Realtime-Meldungen in ListView; ein Häkchen vom anderen Handy darf keinen
 *   Seitenwechsel brauchen, um anzukommen.
 */
export default function ListPage() {
  return (
    <Screen title="Einkaufsliste" titleSize="display">
      <Suspense fallback={<ListSkeleton />}>
        <List />
      </Suspense>
    </Screen>
  );
}

/**
 * Die Abteilungen („Obst & Gemüse“, „Kühlregal“, …).
 *
 * Stammdaten für alle Haushalte gleich, und sie ändern sich nur, wenn jemand
 * eine Migration einspielt. Eine Stunde Frische ist hier großzügig bemessen
 * und spart bei jedem Aufruf der Liste eine Abfrage.
 */
async function loadCategories() {
  "use cache: private";
  cacheLife("hours");

  const context = await requireHousehold();
  if (!context.ok) return [];

  const categories = await listCategories(context.supabase);
  return categories.ok ? categories.value : [];
}

async function List() {
  const context = await requireHousehold();
  if (!context.ok) return <Notice tone="error">{context.error}</Notice>;

  const list = await getListState();
  if (list.error) return <Notice tone="error">{list.error}</Notice>;
  if (!list.listId) {
    return <Notice tone="error">Keine aktive Liste gefunden.</Notice>;
  }

  const [entries, categories] = await Promise.all([
    listEntries(context.supabase, list.listId, context.household.id),
    loadCategories(),
  ]);

  if (!entries.ok) return <Notice tone="error">{entries.error}</Notice>;

  return (
    <ListView
      householdId={context.household.id}
      listId={list.listId}
      entries={entries.value}
      categories={categories}
    />
  );
}
