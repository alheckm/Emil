import { parseIngredient } from "./parseIngredient";
import type { ParsedIngredient, ParsedRecipe } from "./types";

/**
 * Liest einen eingefügten Rezepttext (Kochbuch abgetippt, aus einer App
 * kopiert, aus claude.ai zurückkopiert) in einen Entwurf.
 *
 * Das ist bewusst Heuristik und nicht Magie: was hier unklar bleibt, landet im
 * Prüf-Screen zur Korrektur. Für verlässliche Struktur gibt es den JSON-Weg
 * (siehe `draftSchema.ts` und `importPrompt.ts`).
 */

const SERVINGS_PATTERN =
  /(?:^|\b)(?:zutaten\s+)?f(?:ü|ue)r\s+(?:ca\.?\s+)?(\d+)(?:\s*[-–]\s*\d+)?\s*(portionen|portion|personen|person|st(?:ü|ue)ck|gl(?:ä|ae)ser|muffins|pers\.?)/i;

const INGREDIENTS_HEADING = /^(zutaten|ingredients)\b[:\s]*$/i;
const INSTRUCTIONS_HEADING =
  /^(zubereitung|anleitung|schritte|vorgehen|so geht'?s|so wird'?s gemacht|arbeitsschritte)\b[:\s]*$/i;

/** „Für die Sauce:" — Zwischenüberschrift, keine Zutat. */
const GROUP_HEADING = /^(.{2,40}):\s*$/;

const BULLET_OR_STEP = /^(?:[-–—•*·‣▢□☐▪]\s*|\d{1,2}[.)]\s+)/;

function normalizeServingsLabel(raw: string): string {
  const lower = raw.toLowerCase().replace(/\.$/, "");
  if (lower.startsWith("person") || lower.startsWith("pers")) return "Personen";
  if (lower.startsWith("portion")) return "Portionen";
  if (lower.startsWith("gl")) return "Gläser";
  if (lower.startsWith("st")) return "Stück";
  if (lower.startsWith("muffin")) return "Muffins";
  return "Portionen";
}

/**
 * Sieht die Zeile nach Anleitung aus? Zutatenzeilen sind kurz und nennen eine
 * Menge; Anleitungen sind Sätze. Die Grenze bei 60 Zeichen ist gesetzt, nicht
 * gemessen — Fehlgriffe korrigierst du im Prüf-Screen.
 */
function looksLikeInstruction(line: string): boolean {
  if (line.length > 60) return true;
  const words = line.split(/\s+/).length;
  return /[.!?]$/.test(line) && words > 8;
}

export function parseRecipeText(input: string): ParsedRecipe {
  const recipe: ParsedRecipe = {
    title: null,
    servings: null,
    servingsLabel: null,
    ingredients: [],
    instructions: [],
  };

  const lines = input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length === 0) return recipe;

  let mode: "head" | "ingredients" | "instructions" = "head";
  let groupLabel: string | null = null;
  const ingredients: ParsedIngredient[] = [];

  for (const line of lines) {
    // Portionsangabe kann überall stehen und ist nie eine Zutat.
    const servingsMatch = line.match(SERVINGS_PATTERN);
    if (servingsMatch && recipe.servings === null) {
      recipe.servings = Number(servingsMatch[1]);
      recipe.servingsLabel = normalizeServingsLabel(servingsMatch[2]);
      // Stand die Angabe allein auf der Zeile, ist sie damit abgearbeitet.
      if (line.replace(SERVINGS_PATTERN, "").replace(/[:\s]/g, "") === "") {
        if (mode === "head") mode = "ingredients";
        continue;
      }
    }

    if (INGREDIENTS_HEADING.test(line)) {
      mode = "ingredients";
      groupLabel = null;
      continue;
    }

    if (INSTRUCTIONS_HEADING.test(line)) {
      mode = "instructions";
      continue;
    }

    if (mode === "head") {
      // Erste brauchbare Zeile ist der Titel.
      if (recipe.title === null && !BULLET_OR_STEP.test(line)) {
        recipe.title = line.replace(/:$/, "");
        continue;
      }
      mode = "ingredients";
    }

    if (mode === "ingredients") {
      const group = line.match(GROUP_HEADING);
      if (group && !/\d/.test(group[1])) {
        groupLabel = group[1].trim();
        continue;
      }
      if (looksLikeInstruction(line)) {
        // Ohne „Zubereitung"-Überschrift erkennen wir den Wechsel am Satzbau.
        mode = "instructions";
        recipe.instructions.push(line.replace(BULLET_OR_STEP, ""));
        continue;
      }
      ingredients.push(parseIngredient(line, groupLabel));
      continue;
    }

    recipe.instructions.push(line.replace(BULLET_OR_STEP, ""));
  }

  recipe.ingredients = ingredients;
  return recipe;
}
