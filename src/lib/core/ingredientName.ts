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

/**
 * Schwelle der Ähnlichkeitssuche, ab der zwei Namen als dieselbe Zutat gelten.
 *
 * Muss mit `resolve_ingredient` in 0012_zutaten_treffer.sql übereinstimmen.
 * Der Wert ist gemessen, nicht geschätzt: deutsche Plurale liegen bei 0,667
 * (Tomate/Tomaten) bis 0,824 (Wacholderbeere/-beeren), während Paare, die
 * nicht zusammenfallen dürfen, bei höchstens 0,333 liegen (Mehl/Mandelmehl).
 * Mit den ursprünglichen 0,85 legte jeder Plural eine zweite Zutat an — und
 * damit eine zweite Zeile auf der Einkaufsliste.
 */
export const INGREDIENT_SIMILARITY_THRESHOLD = 0.62;
