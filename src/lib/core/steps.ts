import { scaleAmount } from "./scale";
import { formatIngredientLine } from "./format";

/**
 * Mengenverweise in der Zubereitung: `{{z:N}}` steht für die Zutatenzeile mit
 * `position === N`, nicht für ihre ID — `save_recipe` legt Zutatenzeilen bei
 * jeder Bearbeitung neu an, IDs überleben das nicht, Positionen schon (siehe
 * supabase/migrations/0009_rezepte_speichern.sql). Die automatische
 * Rezept-Pflege schreibt diese Verweise, damit „300 g Möhren anschwitzen" in
 * der Anleitung mit dem Portionswähler mitrechnet, statt bei einer anderen
 * Portionszahl der Zutatenliste zu widersprechen.
 */
const MARKER = /\{\{z:(\d+)\}\}/g;

interface StepIngredient {
  position: number;
  amount: string | null;
  amountMax: string | null;
  unitCode: string | null;
  ingredientName: string | null;
  rawText: string;
}

function amountText(
  ingredient: StepIngredient,
  baseServings: number,
  targetServings: number,
): string {
  const name = ingredient.ingredientName ?? ingredient.rawText;
  return formatIngredientLine(
    scaleAmount(ingredient.amount, baseServings, targetServings),
    ingredient.unitCode,
    name,
    scaleAmount(ingredient.amountMax, baseServings, targetServings),
  );
}

/**
 * Löst Mengenverweise für die Anzeige auf — mit der Portionszahl, die der
 * Nutzer gerade eingestellt hat. Ein Verweis auf eine nicht mehr vorhandene
 * Position verschwindet ersatzlos: eine falsche Menge wäre schlimmer als eine
 * fehlende.
 */
export function resolveSteps(
  steps: readonly string[],
  ingredients: readonly StepIngredient[],
  baseServings: number,
  targetServings: number,
): string[] {
  const byPosition = new Map(ingredients.map((i) => [i.position, i]));
  return steps.map((step) =>
    step.replace(MARKER, (match, position) => {
      const ingredient = byPosition.get(Number(position));
      return ingredient
        ? amountText(ingredient, baseServings, targetServings)
        : "";
    }),
  );
}

/**
 * Löst Mengenverweise in Klartext auf Basisportionen auf — fürs
 * Bearbeiten-Formular, das nie `{{z:N}}` zu Gesicht bekommen soll. Speichert
 * der Nutzer den Klartext zurück, gilt das Rezept über `pflege_stand` wieder
 * als offen, und der nächste Pflege-Lauf setzt die Verweise neu.
 */
export function stripStepMarkers(
  steps: readonly string[],
  ingredients: readonly StepIngredient[],
  baseServings: number,
): string[] {
  return resolveSteps(steps, ingredients, baseServings, baseServings);
}
