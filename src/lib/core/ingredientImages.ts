// Erzeugt von scripts/ingredient-images/process.py — nicht von Hand ändern.
// Zutatenname -> Dateiname unter /zutaten/<slug>.webp
//
// Solange die Bilder noch nicht durchgelaufen sind, ist die Tabelle leer und
// `ingredientImage` gibt überall `null` zurück. Die Liste zeigt dann den
// Buchstaben-Platzhalter — die App baut und läuft also auch ohne ein einziges
// Bild, und jeder weitere Lauf von process.py füllt sie nach.

export const INGREDIENT_IMAGES: Record<string, string> = {};

export function ingredientImage(name: string): string | null {
  const slug = INGREDIENT_IMAGES[name];
  return slug ? `/zutaten/${slug}.webp` : null;
}
