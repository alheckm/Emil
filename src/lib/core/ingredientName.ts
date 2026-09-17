/**
 * Normalisierte Schreibweise einer Zutat.
 *
 * Diese Funktion muss zeichengenau dasselbe tun wie
 * normalize_ingredient_name() in supabase/migrations/0002_stammdaten.sql —
 * sonst legt die App eine Zutat an, die die Datenbank nicht wiederfindet, und
 * „Zwiebel" steht doppelt auf der Einkaufsliste.
 *
 * Deshalb bewusst minimal: kleinschreiben, Leerraum zusammenziehen, trimmen.
 * Keine Umlaut-Auflösung, keine Singularbildung — das ließe sich in SQL nicht
 * ohne Weiteres gleich halten. Für „Zwiebeln" vs. „Zwiebel" ist die
 * Ähnlichkeitssuche (pg_trgm) zuständig, nicht diese Funktion.
 */
export function normalizeIngredientName(name: string): string {
  return name.toLowerCase().replace(/\s+/g, " ").trim();
}

/** Schwelle der Ähnlichkeitssuche, ab der zwei Namen als dieselbe Zutat gelten. */
export const INGREDIENT_SIMILARITY_THRESHOLD = 0.85;
