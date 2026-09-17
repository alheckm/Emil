import { extractJsonObject, parseDraftJson } from "./draftSchema";
import { parseRecipeText } from "./parseRecipeText";
import type { ParsedRecipe } from "./types";

/**
 * Eingefügten Text in einen Rezeptentwurf verwandeln.
 *
 * Zwei Wege in einem Feld: das JSON aus claude.ai (verlässlich, weil
 * strukturiert) und einfach hingeworfener Rezepttext (Heuristik). Welcher
 * gemeint ist, entscheidet sich daran, ob überhaupt ein JSON-Objekt im Text
 * steckt — und nicht daran, ob das Parsen klappt. Sonst bekäme man bei einem
 * Tippfehler im JSON die nutzlose Meldung „keine Zutaten erkannt" statt der
 * hilfreichen, welche Zutat kaputt ist.
 *
 * Liegt in core und nicht in der Oberfläche, damit genau diese Entscheidung
 * getestet werden kann — sie ist der Teil, der schiefgehen kann.
 */

export type PasteResult =
  | { ok: true; recipe: ParsedRecipe; via: "json" | "text" }
  | { ok: false; errors: string[] };

export function parsePastedRecipe(input: string): PasteResult {
  const text = input.trim();
  if (!text) {
    return { ok: false, errors: ["Bitte den Rezepttext oder das JSON einfügen."] };
  }

  if (extractJsonObject(text)) {
    const result = parseDraftJson(text);
    return result.ok
      ? { ok: true, recipe: result.recipe, via: "json" }
      : { ok: false, errors: result.errors };
  }

  const recipe = parseRecipeText(text);
  if (recipe.ingredients.length === 0) {
    return {
      ok: false,
      errors: [
        "In dem Text war keine Zutatenliste zu erkennen. Am zuverlässigsten " +
          "ist der Weg über den Prompt und das JSON.",
      ],
    };
  }
  return { ok: true, recipe, via: "text" };
}
