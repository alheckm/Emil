import type { SupabaseClient } from "@supabase/supabase-js";
import { buildListItems, type ListItemPayload } from "@/lib/core/mergeList";
import { getRecipe } from "./recipes";
import { dataErrorMessage } from "./errors";
import { fail, ok, type Result } from "./result";

/**
 * Die geteilte Einkaufsliste.
 *
 * Gelesen wird aus der View `shopping_list_entry_totals`: sie rechnet die
 * Herkunftszeilen zur Gesamtmenge zusammen, und sie tut es mit
 * `security_invoker`, läuft also durch dieselbe RLS wie die Tabellen darunter.
 *
 * Geschrieben wird über die Funktionen aus 0005/0009. Abhaken zum Beispiel
 * geht nicht per UPDATE, sondern über `set_entry_checked` — das vergleicht
 * Zeitstempel und ist damit die Stelle, an der später (P6) der Offline-Puffer
 * einhängt, ohne ein neueres Häkchen vom anderen Handy zu überschreiben.
 */

export interface ListSource {
  recipeId: string | null;
  recipeTitle: string | null;
  servings: number | null;
  amount: string | null;
}

export interface ListEntry {
  id: string;
  ingredientId: string;
  name: string;
  /** Einheit, in der `amount` steht — Basiseinheit bei Gewicht und Volumen. */
  mergeUnit: string;
  /** Summe aus Rezepten und Handeintrag; `null`, wenn niemand eine Menge nannte. */
  amount: string | null;
  /** Mindestens eine Quelle ohne Menge („Salz und Pfeffer" neben „1 TL Salz"). */
  hasUnquantified: boolean;
  checked: boolean;
  /** Zeitpunkt des Abhakens; `null` solange offen. Bestimmt die Reihenfolge im „Abgehakt"-Abschnitt. */
  checkedAt: string | null;
  note: string | null;
  isManual: boolean;
  updatedAt: string;
  categoryId: string | null;
  categoryName: string;
  categorySortOrder: number;
  /** Nur eigene Zutaten sind umsortierbar — der globale Seed gehört allen. */
  categoryEditable: boolean;
  sources: ListSource[];
}

export interface Category {
  id: string;
  name: string;
  sortOrder: number;
}

/** Abteilung für alles, was (noch) keine hat. */
const FALLBACK_CATEGORY: Category = {
  id: "sonstiges",
  name: "Sonstiges",
  sortOrder: 999,
};

/** Aktive Liste des Haushalts; legt notfalls eine an. */
export async function getActiveListId(
  supabase: SupabaseClient,
  householdId: string,
): Promise<Result<string>> {
  const { data, error } = await supabase.rpc("active_list_id", {
    p_household_id: householdId,
  });
  return error ? fail(dataErrorMessage(error)) : ok(data as string);
}

interface EntryRow {
  id: string;
  ingredient_id: string;
  merge_unit: string;
  total_amount: string | null;
  has_unquantified: boolean;
  checked: boolean;
  checked_at: string | null;
  note: string | null;
  is_manual: boolean;
  updated_at: string;
  ingredients: {
    display_name: string;
    household_id: string | null;
    category_id: string | null;
    categories: { name: string; sort_order: number } | null;
  } | null;
  shopping_list_sources: {
    recipe_id: string | null;
    servings: number | null;
    amount_base: string | null;
    recipes: { title: string } | null;
  }[];
}

/**
 * Alle Zeilen der Liste, sortiert wie der Weg durch den Supermarkt:
 * Abteilung, dann Name. Das ist die Grundordnung — ListView schiebt
 * Abgehaktes danach ans Ende, ohne diese Reihenfolge sonst anzutasten.
 * Mehr als 20 Abgehakte gibt es serverseitig ohnehin nicht: `set_entry_checked`
 * löscht die ältesten, sobald ein 21. dazukommt (Migration 0016).
 */
export async function listEntries(
  supabase: SupabaseClient,
  listId: string,
): Promise<Result<ListEntry[]>> {
  const { data, error } = await supabase
    .from("shopping_list_entry_totals")
    .select(
      `id, ingredient_id, merge_unit, total_amount::text, has_unquantified,
       checked, checked_at, note, is_manual, updated_at,
       ingredients ( display_name, household_id, category_id,
                     categories ( name, sort_order ) ),
       shopping_list_sources ( recipe_id, servings, amount_base::text,
                               recipes ( title ) )`,
    )
    .eq("list_id", listId);

  if (error) return fail(dataErrorMessage(error));

  const entries = ((data ?? []) as unknown as EntryRow[]).map((row) => ({
    id: row.id,
    ingredientId: row.ingredient_id,
    name: row.ingredients?.display_name ?? "Unbekannte Zutat",
    mergeUnit: row.merge_unit,
    amount: row.total_amount,
    hasUnquantified: row.has_unquantified,
    checked: row.checked,
    checkedAt: row.checked_at,
    note: row.note,
    isManual: row.is_manual,
    updatedAt: row.updated_at,
    categoryId: row.ingredients?.category_id ?? null,
    categoryName: row.ingredients?.categories?.name ?? FALLBACK_CATEGORY.name,
    categorySortOrder:
      row.ingredients?.categories?.sort_order ?? FALLBACK_CATEGORY.sortOrder,
    categoryEditable: row.ingredients?.household_id != null,
    sources: (row.shopping_list_sources ?? []).map((source) => ({
      recipeId: source.recipe_id,
      recipeTitle: source.recipes?.title ?? null,
      servings: source.servings,
      amount: source.amount_base,
    })),
  }));

  entries.sort(
    (a, b) =>
      a.categorySortOrder - b.categorySortOrder ||
      a.name.localeCompare(b.name, "de"),
  );

  return ok(entries);
}

export async function listCategories(
  supabase: SupabaseClient,
): Promise<Result<Category[]>> {
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, sort_order")
    .order("sort_order", { ascending: true });

  if (error) return fail(dataErrorMessage(error));
  return ok(
    (data ?? []).map((row) => ({
      id: row.id as string,
      name: row.name as string,
      sortOrder: row.sort_order as number,
    })),
  );
}

/**
 * Häkchen setzen.
 *
 * `clientUpdatedAt` bleibt in P3 leer und bekommt erst mit dem Offline-Puffer
 * (P6) einen Wert; die Funktion in der Datenbank kann den Vergleich längst.
 */
export async function setEntryChecked(
  supabase: SupabaseClient,
  entryId: string,
  checked: boolean,
  clientUpdatedAt: string | null = null,
): Promise<Result> {
  const { error } = await supabase.rpc("set_entry_checked", {
    p_entry_id: entryId,
    p_checked: checked,
    p_client_updated_at: clientUpdatedAt,
  });
  return error ? fail(dataErrorMessage(error)) : ok(undefined);
}

/**
 * Menge einer Zeile von Hand festlegen — der Mengen-Stepper in der
 * Detailleiste. Gilt für Rezept-, Hand- und gemischte Zeilen gleichermaßen:
 * die Zahl überschreibt die berechnete Summe, ihre Quellen bleiben unter der
 * Haube unverändert liegen.
 */
export async function setEntryAmount(
  supabase: SupabaseClient,
  entryId: string,
  amount: number,
): Promise<Result> {
  const { error } = await supabase.rpc("set_entry_amount", {
    p_entry_id: entryId,
    p_amount: String(amount),
  });
  return error ? fail(dataErrorMessage(error)) : ok(undefined);
}

/** Rezept auflegen. Die Positionen kommen fertig gerechnet aus `buildListItems`. */
export async function addRecipeToList(
  supabase: SupabaseClient,
  listId: string,
  recipeId: string,
  servings: number,
  items: readonly ListItemPayload[],
): Promise<Result> {
  const { error } = await supabase.rpc("add_recipe_to_list", {
    p_list_id: listId,
    p_recipe_id: recipeId,
    p_servings: servings,
    p_items: items,
  });
  return error ? fail(dataErrorMessage(error)) : ok(undefined);
}

export async function removeRecipeFromList(
  supabase: SupabaseClient,
  listId: string,
  recipeId: string,
): Promise<Result> {
  const { error } = await supabase.rpc("remove_recipe_from_list", {
    p_list_id: listId,
    p_recipe_id: recipeId,
  });
  return error ? fail(dataErrorMessage(error)) : ok(undefined);
}

/**
 * Zeile von Hand ergänzen.
 *
 * Zwei Schritte, bewusst getrennt: erst den Namen auf eine Zutat abbilden
 * (`resolve_ingredient` — sonst stünde „Zwiebel" neben der Zwiebel aus dem
 * Rezept), dann die Zeile setzen. `amount` muss bereits in `mergeUnit` stehen;
 * umgerechnet wird in src/lib/core, nicht hier.
 */
export async function addManualEntry(
  supabase: SupabaseClient,
  householdId: string,
  listId: string,
  name: string,
  mergeUnit: string,
  amount: string | null,
  note: string | null = null,
): Promise<Result> {
  const resolved = await supabase.rpc("resolve_ingredient", {
    p_household_id: householdId,
    p_name: name,
  });
  if (resolved.error) return fail(dataErrorMessage(resolved.error));

  const { error } = await supabase.rpc("add_manual_entry", {
    p_list_id: listId,
    p_ingredient_id: resolved.data as string,
    p_merge_unit: mergeUnit,
    p_amount: amount,
    p_note: note,
  });
  return error ? fail(dataErrorMessage(error)) : ok(undefined);
}

/** Ganze Zeile von der Liste nehmen, samt ihrer Herkunft. */
export async function deleteEntry(
  supabase: SupabaseClient,
  entryId: string,
): Promise<Result> {
  const { error } = await supabase
    .from("shopping_list_entries")
    .delete()
    .eq("id", entryId);
  return error ? fail(dataErrorMessage(error)) : ok(undefined);
}

/**
 * Abteilung einer Zutat festlegen — der eine Handgriff, der den Ersatz für
 * eine KI-Kategorisierung darstellt: einmal antippen, und die Zuordnung bleibt.
 *
 * Geht nur bei eigenen Zutaten des Haushalts. Die globalen aus dem Seed sind
 * für alle dieselben; sie hier umzuhängen würde sie für jeden Haushalt
 * umhängen, und genau das verhindert die RLS-Policy aus 0006.
 */
export async function setIngredientCategory(
  supabase: SupabaseClient,
  ingredientId: string,
  categoryId: string,
): Promise<Result> {
  const { error } = await supabase
    .from("ingredients")
    .update({ category_id: categoryId })
    .eq("id", ingredientId);
  return error ? fail(dataErrorMessage(error)) : ok(undefined);
}

/**
 * Welche Rezepte gerade auf der Liste liegen — und mit wie vielen Portionen.
 *
 * Damit die Rezeptübersicht zeigen kann, was schon eingeplant ist, und der
 * Rezept-Screen den Portionswähler auf die eingeplante Zahl stellt statt auf
 * die Basisportionen.
 */
export async function listPlannedRecipes(
  supabase: SupabaseClient,
  listId: string,
): Promise<Result<Record<string, number>>> {
  const { data, error } = await supabase
    .from("shopping_list_sources")
    .select("recipe_id, servings, shopping_list_entries!inner ( list_id )")
    .eq("shopping_list_entries.list_id", listId);

  if (error) return fail(dataErrorMessage(error));

  const planned: Record<string, number> = {};
  for (const row of (data ?? []) as unknown as {
    recipe_id: string | null;
    servings: number;
  }[]) {
    if (row.recipe_id) planned[row.recipe_id] = row.servings;
  }
  return ok(planned);
}

/**
 * Ein geändertes Rezept auf allen Listen neu rechnen.
 *
 * Gegenstück zu `save_recipe`: beim Ändern werden die Zutatenzeilen ersetzt,
 * und die Herkunftszeilen der Liste hängen per Kaskade daran. Hier wird das
 * Rezept frisch gelesen, neu gerechnet und wieder aufgelegt — mit derselben
 * Portionszahl wie zuvor. Gerechnet wird dabei in src/lib/core, nicht in SQL.
 */
export async function refreshRecipeOnLists(
  supabase: SupabaseClient,
  recipeId: string,
  lists: readonly { listId: string; servings: number }[],
): Promise<Result> {
  if (lists.length === 0) return ok(undefined);

  const recipe = await getRecipe(supabase, recipeId);
  if (!recipe.ok) return fail(recipe.error);
  if (!recipe.value) return ok(undefined);

  const lines = recipe.value.ingredients;
  for (const list of lists) {
    const items = buildListItems(lines, recipe.value.baseServings, list.servings);
    const added = await addRecipeToList(
      supabase,
      list.listId,
      recipeId,
      list.servings,
      items,
    );
    if (!added.ok) return added;
  }
  return ok(undefined);
}
