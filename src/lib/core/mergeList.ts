import Decimal from "decimal.js-light";
import { scaleAmount } from "./scale";
import { getUnit, mergeUnitFor } from "./units";

/**
 * Zusammenfassen der Einkaufsliste.
 *
 * Zusammengerechnet wird nur, was man auch gemeinsam kauft: 500 g + 0,5 kg
 * Zwiebeln sind 1 kg. „2 Zwiebeln" bleibt daneben eine eigene Zeile, weil
 * niemand weiß, wie viel Gramm eine Zwiebel hat — falsch addiert wäre
 * schlimmer als zwei Zeilen.
 */

export interface ListInput {
  ingredientId: string;
  unitCode: string | null;
  /** Bereits auf die gewünschten Portionen skalierte Menge. */
  amount: string | null;
  recipeId: string | null;
  recipeIngredientId: string | null;
  /** Portionen, mit denen das Rezept auf die Liste gelegt wurde. */
  servings: number | null;
}

export interface MergedSource {
  recipeId: string | null;
  recipeIngredientId: string | null;
  servings: number | null;
  amount: string | null;
}

export interface MergedEntry {
  ingredientId: string;
  /** Einheit, in der `amount` angegeben ist (Basiseinheit bei Gewicht/Volumen). */
  mergeUnit: string;
  /** Summe in `mergeUnit`, oder `null`, wenn keine Quelle eine Menge nennt. */
  amount: string | null;
  /**
   * Mindestens eine Quelle hatte keine Menge („Salz und Pfeffer" neben
   * „1 TL Salz"). Die Oberfläche kann das als „+ etwas" kennzeichnen, statt
   * die fehlende Menge stillschweigend zu verschlucken.
   */
  hasUnquantified: boolean;
  sources: MergedSource[];
}

/**
 * Einheit für Positionen ganz ohne Menge („etwas Paprikapulver").
 *
 * Muss mit dem Wert in supabase/migrations/0010_mengenlose_zeilen.sql
 * übereinstimmen — dort steht dieselbe Regel in SQL, weil das Zusammenfassen
 * beim Auflegen auf die Liste in einer Transaktion passieren muss.
 */
export const UNQUANTIFIED_MERGE_UNIT = "ohne";

export function mergeKey(ingredientId: string, unitCode: string | null): string {
  return `${ingredientId}|${mergeUnitFor(unitCode)}`;
}

/** Rechnet eine Menge in die Einheit um, in der zusammengefasst wird. */
export function toMergeAmount(
  amount: string | null,
  unitCode: string | null,
): string | null {
  if (amount === null) return null;
  const unit = getUnit(unitCode);
  if (!unit) return amount;
  const mergeUnit = mergeUnitFor(unitCode);
  if (mergeUnit === unit.code) return amount;
  const target = getUnit(mergeUnit);
  if (!target) return amount;
  return new Decimal(amount).times(unit.baseFactor).div(target.baseFactor).toString();
}

/**
 * Fasst Positionen zu Listenzeilen zusammen. Die Reihenfolge der Eingabe
 * bestimmt die Reihenfolge der Zeilen; nach Supermarkt-Abteilung sortiert
 * die Datenschicht, die die Kategorien kennt.
 */
export function mergeList(inputs: readonly ListInput[]): MergedEntry[] {
  const byKey = new Map<string, MergedEntry>();

  function bucket(ingredientId: string, mergeUnit: string): MergedEntry {
    const key = `${ingredientId}|${mergeUnit}`;
    let entry = byKey.get(key);
    if (!entry) {
      entry = {
        ingredientId,
        mergeUnit,
        amount: null,
        hasUnquantified: false,
        sources: [],
      };
      byKey.set(key, entry);
    }
    return entry;
  }

  function addSource(entry: MergedEntry, input: ListInput, amount: string | null) {
    entry.sources.push({
      recipeId: input.recipeId,
      recipeIngredientId: input.recipeIngredientId,
      servings: input.servings,
      amount,
    });
  }

  // Erster Durchgang: alles mit Menge. Danach steht fest, welche Einheiten-
  // Zeilen es je Zutat gibt.
  const unquantified: ListInput[] = [];
  for (const input of inputs) {
    const converted = toMergeAmount(input.amount, input.unitCode);
    if (converted === null) {
      unquantified.push(input);
      continue;
    }
    const entry = bucket(input.ingredientId, mergeUnitFor(input.unitCode));
    addSource(entry, input, converted);
    entry.amount =
      entry.amount === null
        ? converted
        : new Decimal(entry.amount).plus(converted).toString();
  }

  // Zweiter Durchgang: Positionen ohne Menge hängen sich an eine vorhandene
  // Zeile derselben Zutat. Sonst stünde „etwas Paprikapulver" als zweite Zeile
  // neben „3 EL Paprikapulver", und im Supermarkt kauft man ein Glas davon.
  // Gibt es mehrere Einheiten-Zeilen (Zwiebeln in g und in Stück), entscheidet
  // die Sortierung — Hauptsache reproduzierbar.
  for (const input of unquantified) {
    // Bewusst Zeichenwert-Vergleich statt localeCompare: Postgres sortiert in
    // 0010_mengenlose_zeilen.sql mit `collate "C"`, und localeCompare würde bei
    // „g" gegen „Stück" ein anderes Ergebnis liefern. Dieselbe Regel muss auf
    // beiden Seiten dieselbe Zeile treffen.
    const existing = [...byKey.values()]
      .filter((entry) => entry.ingredientId === input.ingredientId)
      .sort((a, b) => (a.mergeUnit < b.mergeUnit ? -1 : a.mergeUnit > b.mergeUnit ? 1 : 0))[0];

    const entry = existing ?? bucket(input.ingredientId, UNQUANTIFIED_MERGE_UNIT);
    addSource(entry, input, null);
    entry.hasUnquantified = true;
  }

  return [...byKey.values()];
}

/**
 * Entfernt alle Anteile eines Rezepts und rechnet die Zeilen neu.
 * Zeilen ohne Quelle fallen weg — so verschwindet beim Abwählen eines Rezepts
 * genau dessen Anteil und nicht die ganze Zeile.
 */
export function removeRecipe(
  entries: readonly MergedEntry[],
  recipeId: string,
): MergedEntry[] {
  const result: MergedEntry[] = [];
  for (const entry of entries) {
    const sources = entry.sources.filter((s) => s.recipeId !== recipeId);
    if (sources.length === 0) continue;
    let amount: string | null = null;
    let hasUnquantified = false;
    for (const source of sources) {
      if (source.amount === null) {
        hasUnquantified = true;
        continue;
      }
      amount =
        amount === null
          ? source.amount
          : new Decimal(amount).plus(source.amount).toString();
    }
    result.push({ ...entry, amount, hasUnquantified, sources });
  }
  return result;
}

/** Eine Rezeptzeile, so wie sie in der Datenbank steht. */
export interface RecipeLine {
  /** `recipe_ingredients.id` — die Herkunft, die unter der Listenzeile hängt. */
  id: string;
  /** `null`, wenn die Zeile keine Zutat trifft (z. B. eine Zwischenüberschrift). */
  ingredientId: string | null;
  /** Basismenge, unskaliert. */
  amount: string | null;
  unitCode: string | null;
}

/**
 * Position, wie `add_recipe_to_list` sie erwartet.
 *
 * Schlangenschrift, weil das hier kein App-Typ ist, sondern das Format, in dem
 * die Positionen als jsonb in die Datenbank gehen (siehe
 * supabase/migrations/0005_funktionen.sql). Eine Übersetzungsschicht dazwischen
 * wäre eine zweite Stelle, an der sich Feldnamen auseinanderleben können.
 */
export interface ListItemPayload {
  ingredient_id: string;
  merge_unit: string;
  amount_base: string | null;
  recipe_ingredient_id: string;
}

/**
 * Rechnet die Zutaten eines Rezepts auf die gewünschten Portionen um und
 * bringt sie in die Einheit, in der die Einkaufsliste zusammenfasst.
 *
 * Das ist die ganze Rechnung, die beim „Auf die Einkaufsliste" passiert —
 * bewusst hier und nicht in SQL: skalieren und umrechnen sind getestet, und
 * zwei Implementierungen derselben Mengenlehre würden unweigerlich
 * auseinanderlaufen.
 *
 * Zeilen ohne Zutat fallen weg: ohne `ingredient_id` gäbe es nichts, worunter
 * sich etwas zusammenfassen ließe. Zeilen **ohne Menge** bleiben dagegen
 * drin — „Salz und Pfeffer" gehört auf die Liste, nur eben ohne Zahl.
 */
export function buildListItems(
  lines: readonly RecipeLine[],
  baseServings: number,
  targetServings: number,
): ListItemPayload[] {
  const items: ListItemPayload[] = [];

  for (const line of lines) {
    if (!line.ingredientId) continue;
    const scaled = scaleAmount(line.amount, baseServings, targetServings);
    items.push({
      ingredient_id: line.ingredientId,
      merge_unit: mergeUnitFor(line.unitCode),
      amount_base: toMergeAmount(scaled, line.unitCode),
      recipe_ingredient_id: line.id,
    });
  }

  return items;
}
