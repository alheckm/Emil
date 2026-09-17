import type { SupabaseClient } from "@supabase/supabase-js";
import { dataErrorMessage } from "./errors";
import { fail, ok, type Result } from "./result";

/**
 * Rezepte lesen und schreiben.
 *
 * Zwei Dinge sind hier nicht Geschmackssache:
 *
 * - **Mengen werden als Text geholt** (`amount::text`). PostgREST gibt
 *   `numeric` sonst als JSON-Zahl zurück, und damit wäre die Genauigkeit weg,
 *   die 0004 und src/lib/core mühsam durchhalten. Der Umweg über Text hält den
 *   Wert exakt bis in die Rechnung.
 * - **Geschrieben wird über `save_recipe`**, nicht über Einzel-Inserts.
 *   Ein Rezept ohne seine Zutatenzeilen ist kein halbes Rezept, sondern Müll;
 *   die Transaktionsgrenze gehört deshalb in die Datenbank.
 */

export interface RecipeSummary {
  id: string;
  title: string;
  baseServings: number;
  servingsLabel: string;
  totalTimeMin: number | null;
  tags: string[];
  imagePath: string | null;
  sourceUrl: string | null;
  createdAt: string;
}

export interface RecipeIngredient {
  id: string;
  position: number;
  groupLabel: string | null;
  /** Die Originalzeile — die Wahrheit, wenn das Parsen daneben lag. */
  rawText: string;
  amount: string | null;
  amountMax: string | null;
  unitCode: string | null;
  ingredientId: string | null;
  /** Anzeigename der kanonisierten Zutat; `null`, wenn keine zugeordnet ist. */
  ingredientName: string | null;
  note: string | null;
  toTaste: boolean;
  confidence: number;
}

export interface Recipe extends RecipeSummary {
  sourceType: RecipeSource;
  notes: string | null;
  instructions: string[];
  ingredients: RecipeIngredient[];
}

/** Eine Zutatenzeile, wie sie aus dem Formular kommt. */
/**
 * Woher ein Rezept stammt. Entspricht dem CHECK auf recipes.source_type;
 * als eigener Typ, damit die Oberfläche nicht casten muss.
 */
export type RecipeSource = "manual" | "url" | "paste" | "photo";

export interface RecipeIngredientInput {
  name: string;
  amount: string | null;
  amountMax: string | null;
  unitCode: string | null;
  note: string | null;
  toTaste: boolean;
  groupLabel: string | null;
  rawText: string;
  confidence: number;
}

export interface RecipeInput {
  /** Gesetzt = ändern, leer = neu anlegen. */
  id?: string | null;
  title: string;
  baseServings: number;
  servingsLabel: string;
  totalTimeMin: number | null;
  instructions: string[];
  notes: string | null;
  tags: string[];
  sourceType?: RecipeSource;
  sourceUrl?: string | null;
  ingredients: RecipeIngredientInput[];
}

/**
 * Ergebnis von `save_recipe`.
 *
 * `lists` ist der Grund, warum die Funktion mehr als eine ID zurückgibt: beim
 * Ändern werden die Zutatenzeilen ersetzt, und die Herkunftszeilen der
 * Einkaufsliste hängen per Kaskade daran. Wer das Rezept ändert, muss es
 * anschließend mit `addRecipeToList` frisch gerechnet wieder auflegen — sonst
 * fehlt es im Supermarkt.
 */
export interface SavedRecipe {
  recipeId: string;
  lists: { listId: string; servings: number }[];
}

const SUMMARY_COLUMNS =
  "id, title, base_servings, servings_label, total_time_min, tags, " +
  "image_path, source_url, created_at";

interface SummaryRow {
  id: string;
  title: string;
  base_servings: number;
  servings_label: string;
  total_time_min: number | null;
  tags: string[] | null;
  image_path: string | null;
  source_url: string | null;
  created_at: string;
}

function toSummary(row: SummaryRow): RecipeSummary {
  return {
    id: row.id,
    title: row.title,
    baseServings: row.base_servings,
    servingsLabel: row.servings_label,
    totalTimeMin: row.total_time_min,
    tags: row.tags ?? [],
    imagePath: row.image_path,
    sourceUrl: row.source_url,
    createdAt: row.created_at,
  };
}

export async function listRecipes(
  supabase: SupabaseClient,
  householdId: string,
): Promise<Result<RecipeSummary[]>> {
  const { data, error } = await supabase
    .from("recipes")
    .select(SUMMARY_COLUMNS)
    .eq("household_id", householdId)
    .order("title", { ascending: true });

  if (error) return fail(dataErrorMessage(error));
  return ok(((data ?? []) as unknown as SummaryRow[]).map(toSummary));
}

/**
 * Rezepte suchen — über Titel UND Zutaten.
 *
 * Läuft über die Datenbankfunktion `search_recipes`, weil „Zwiebel" auch
 * Rezepte finden soll, deren Titel das Wort nicht enthält. Im Client wäre das
 * ein Mehrfachabruf über zwei Tabellen.
 */
export async function searchRecipes(
  supabase: SupabaseClient,
  householdId: string,
  query: string | null,
  tag: string | null,
): Promise<Result<RecipeSummary[]>> {
  const { data, error } = await supabase.rpc("search_recipes", {
    p_household_id: householdId,
    p_query: query?.trim() || null,
    p_tag: tag?.trim() || null,
  });
  if (error) return fail(dataErrorMessage(error));
  return ok(((data ?? []) as SummaryRow[]).map(toSummary));
}

/** Vergebene Schlagwörter mit Anzahl, für die Filterleiste. */
export async function listHouseholdTags(
  supabase: SupabaseClient,
  householdId: string,
): Promise<Result<{ tag: string; count: number }[]>> {
  const { data, error } = await supabase.rpc("household_tags", {
    p_household_id: householdId,
  });
  if (error) return fail(dataErrorMessage(error));
  return ok(
    ((data ?? []) as { tag: string; anzahl: number }[]).map((row) => ({
      tag: row.tag,
      count: Number(row.anzahl),
    })),
  );
}

export async function getRecipe(
  supabase: SupabaseClient,
  recipeId: string,
): Promise<Result<Recipe | null>> {
  const { data, error } = await supabase
    .from("recipes")
    .select(
      `${SUMMARY_COLUMNS}, source_type, notes, instructions,
       recipe_ingredients (
         id, position, group_label, raw_text, amount::text, amount_max::text,
         unit_code, ingredient_id, note, to_taste, parse_confidence::text,
         ingredients ( display_name )
       )`,
    )
    .eq("id", recipeId)
    .maybeSingle();

  if (error) return fail(dataErrorMessage(error));
  if (!data) return ok(null);

  const row = data as unknown as SummaryRow & {
    source_type: string;
    notes: string | null;
    instructions: unknown;
    recipe_ingredients: {
      id: string;
      position: number;
      group_label: string | null;
      raw_text: string;
      amount: string | null;
      amount_max: string | null;
      unit_code: string | null;
      ingredient_id: string | null;
      note: string | null;
      to_taste: boolean;
      parse_confidence: string | null;
      ingredients: { display_name: string } | null;
    }[];
  };

  return ok({
    ...toSummary(row),
    sourceType: row.source_type as RecipeSource,
    notes: row.notes,
    instructions: Array.isArray(row.instructions)
      ? row.instructions.filter((step): step is string => typeof step === "string")
      : [],
    ingredients: [...(row.recipe_ingredients ?? [])]
      .sort((a, b) => a.position - b.position)
      .map((line) => ({
        id: line.id,
        position: line.position,
        groupLabel: line.group_label,
        rawText: line.raw_text,
        amount: line.amount,
        amountMax: line.amount_max,
        unitCode: line.unit_code,
        ingredientId: line.ingredient_id,
        ingredientName: line.ingredients?.display_name ?? null,
        note: line.note,
        toTaste: line.to_taste,
        confidence: Number(line.parse_confidence ?? 1),
      })),
  });
}

export async function saveRecipe(
  supabase: SupabaseClient,
  householdId: string,
  input: RecipeInput,
): Promise<Result<SavedRecipe>> {
  const { data, error } = await supabase.rpc("save_recipe", {
    p_household_id: householdId,
    p_recipe: {
      id: input.id ?? null,
      title: input.title,
      source_type: input.sourceType ?? "manual",
      source_url: input.sourceUrl ?? null,
      base_servings: input.baseServings,
      servings_label: input.servingsLabel,
      total_time_min: input.totalTimeMin,
      instructions: input.instructions,
      notes: input.notes,
      tags: input.tags,
    },
    p_ingredients: input.ingredients.map((line) => ({
      name: line.name,
      amount: line.amount,
      amount_max: line.amountMax,
      unit_code: line.unitCode,
      note: line.note,
      to_taste: line.toTaste,
      group_label: line.groupLabel,
      raw_text: line.rawText,
      parse_confidence: line.confidence,
    })),
  });

  if (error) return fail(dataErrorMessage(error));

  const result = data as {
    recipe_id: string;
    lists: { list_id: string; servings: number }[] | null;
  };

  return ok({
    recipeId: result.recipe_id,
    lists: (result.lists ?? []).map((entry) => ({
      listId: entry.list_id,
      servings: entry.servings,
    })),
  });
}

/**
 * Rezept löschen.
 *
 * Ganz gewöhnliches DELETE — die Zutatenzeilen hängen per Kaskade daran.
 *
 * Wichtig für den Aufrufer: **vorher** `removeRecipeFromList` rufen. Die
 * Herkunftszeilen der Einkaufsliste verschwinden zwar mit der Kaskade, aber
 * eine dadurch leer gewordene Listenzeile bliebe ohne Menge stehen. Das
 * Aufräumen steckt in `remove_recipe_from_list`, nicht in der Kaskade.
 */
export async function deleteRecipe(
  supabase: SupabaseClient,
  recipeId: string,
): Promise<Result> {
  const { error } = await supabase.from("recipes").delete().eq("id", recipeId);
  return error ? fail(dataErrorMessage(error)) : ok(undefined);
}
