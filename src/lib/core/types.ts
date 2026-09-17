/**
 * Kern-Typen von Emil.
 *
 * Mengen sind durchgängig **Dezimal-Strings**, nicht `number`. Grund: sie werden
 * skaliert, summiert und in Postgres `numeric` gespeichert. Mit `number` würde
 * sich Float-Drift über mehrere Rezepte aufaddieren (0.1 + 0.2 !== 0.3), und
 * genau das fällt beim Einkaufen auf. Gerechnet wird intern mit decimal.js-light,
 * nach außen gehen exakte Strings, die 1:1 nach `numeric` round-trippen.
 */

/**
 * `mass` und `volume` werden innerhalb ihrer Dimension umgerechnet (g ↔ kg).
 * `spoon` und `count` bewusst nicht: „2 EL Tomatenmark" als „30 ml" auf der
 * Einkaufsliste hilft niemandem, und eine Zehe Knoblauch ist kein Stück Zwiebel.
 * Sie summieren nur mit ihrer eigenen Einheit.
 */
export type Dimension = "mass" | "volume" | "spoon" | "count";

export interface Unit {
  /** Kanonischer Code, wie er in der Datenbank steht. */
  code: string;
  /** Anzeigeform. */
  display: string;
  dimension: Dimension;
  /** Faktor in die Basiseinheit der Dimension (g bzw. ml). */
  baseFactor: number;
  /** Kleingeschriebene Schreibweisen, die auf diesen Code zeigen. */
  aliases: string[];
}

export interface ParsedIngredient {
  /** Die Originalzeile, unverändert — die Wahrheit, wenn das Parsen daneben lag. */
  rawText: string;
  /** Dezimal-String oder `null`, wenn die Zeile keine Menge nennt. */
  amount: string | null;
  /** Obergrenze bei Angaben wie „2-3 Zwiebeln"; sonst `null`. */
  amountMax: string | null;
  unitCode: string | null;
  name: string;
  /** Zusatz wie „gewürfelt" oder „zimmerwarm" — beeinflusst den Einkauf nicht. */
  note: string | null;
  /** „etwas", „nach Geschmack", „n. B." — bewusst ohne Menge. */
  toTaste: boolean;
  /**
   * 0…1. Unter 0.8 markiert der Prüf-Screen die Zeile farbig. Das ist in Emil
   * der Ersatz für einen KI-Fallback: nicht raten, sondern fragen.
   */
  confidence: number;
  /** Zwischenüberschrift wie „Für die Sauce", falls die Quelle eine hatte. */
  groupLabel: string | null;
}

export interface ParsedRecipe {
  title: string | null;
  servings: number | null;
  servingsLabel: string | null;
  ingredients: ParsedIngredient[];
  instructions: string[];
}

/** Schwelle, unter der der Prüf-Screen eine Zeile zur Kontrolle markiert. */
export const CONFIDENCE_REVIEW_THRESHOLD = 0.8;
