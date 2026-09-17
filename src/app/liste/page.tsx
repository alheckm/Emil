import { requireHousehold } from "@/lib/server/household";
import {
  getActiveListId,
  listCategories,
  listEntries,
} from "@/lib/data/shoppingList";
import { Notice, Screen } from "@/components/ui";
import { ListView } from "./ListView";

export const metadata = { title: "Einkaufsliste" };

/**
 * Die Liste wird bei jedem Aufruf frisch geholt — sie liest die Sitzung aus
 * den Cookies und ist damit ohnehin dynamisch. Aktuell *bleibt* sie durch die
 * Realtime-Meldungen in ListView; ein Häkchen vom anderen Handy darf keinen
 * Seitenwechsel brauchen, um anzukommen.
 */
export default async function ListPage() {
  const context = await requireHousehold();
  if (!context.ok) {
    return (
      <Screen title="Einkaufsliste">
        <Notice tone="error">{context.error}</Notice>
      </Screen>
    );
  }

  const { supabase, household } = context;
  const list = await getActiveListId(supabase, household.id);
  if (!list.ok) {
    return (
      <Screen title="Einkaufsliste">
        <Notice tone="error">{list.error}</Notice>
      </Screen>
    );
  }

  const [entries, categories] = await Promise.all([
    listEntries(supabase, list.value),
    listCategories(supabase),
  ]);

  if (!entries.ok) {
    return (
      <Screen title="Einkaufsliste">
        <Notice tone="error">{entries.error}</Notice>
      </Screen>
    );
  }

  return (
    <Screen title="Einkaufsliste" lead={household.name}>
      <ListView
        householdId={household.id}
        listId={list.value}
        entries={entries.value}
        categories={categories.ok ? categories.value : []}
      />
    </Screen>
  );
}
