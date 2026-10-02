/**
 * Die Schlagwörter eines Rezepts sind eine feste Liste, kein Freitext.
 *
 * Gespeichert wird der Schlüssel (klein geschrieben), angezeigt die Beschriftung.
 * „Saisonal" und „≤ 30 Min" stehen bewusst nicht hier: sie folgen aus anderen
 * Angaben (`seasonMonths`, `totalTimeMin`) und werden beim Anzeigen berechnet,
 * nie von Hand vergeben (siehe `derivedTags`).
 */

export const RECIPE_TAGS = ["vegan", "vegetarisch", "proteinreich", "snack"] as const;

export type RecipeTag = (typeof RECIPE_TAGS)[number];

export const RECIPE_TAG_LABELS: Record<RecipeTag, string> = {
  vegan: "Vegan",
  vegetarisch: "Vegetarisch",
  proteinreich: "Proteinreich",
  snack: "Snack",
};

/** Schwelle für „proteinreich": Gramm Protein je Portion. */
export const PROTEIN_RICH_MIN_G = 20;

export const QUICK_MAX_MINUTES = 30;

/**
 * Macht aus beliebigem Eingang eine gültige Schlagwortliste: nur Bekanntes,
 * ohne Doppelte, in fester Reihenfolge. „vegan" schließt „vegetarisch" ein —
 * so findet der Filter „Vegetarisch" auch die veganen Rezepte.
 */
export function normalizeTags(raw: readonly string[]): RecipeTag[] {
  const wanted = new Set(raw.map((tag) => tag.trim().toLocaleLowerCase("de")));
  if (wanted.has("vegan")) wanted.add("vegetarisch");
  return RECIPE_TAGS.filter((tag) => wanted.has(tag));
}

export interface DerivedTags {
  /** Gesamtzeit bekannt und höchstens 30 Minuten. */
  quick: boolean;
  /** Der angegebene Monat (1–12) liegt in der Saison des Rezepts. */
  seasonal: boolean;
}

export function derivedTags(
  recipe: { totalTimeMin: number | null; seasonMonths: readonly number[] },
  month: number,
): DerivedTags {
  return {
    quick: recipe.totalTimeMin !== null && recipe.totalTimeMin <= QUICK_MAX_MINUTES,
    seasonal: recipe.seasonMonths.includes(month),
  };
}
