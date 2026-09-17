import Decimal from "decimal.js-light";
import type { ParsedIngredient } from "./types";

/**
 * Portionsrechnung: streng linear und exakt, wie abgestimmt.
 *
 * Wichtigste Regel: **immer aus der Basismenge rechnen**, nie aus einem schon
 * skalierten Wert. Verkettet man Operationen, driftet das Ergebnis
 * (1/3 × 3 ergibt 0,9999…), und ein Weg von 4 → 6 → 4 Portionen käme nicht
 * mehr bei der Originalmenge heraus. Gespeichert werden darum Basismenge und
 * Basisportionen; jede Anzeige wird frisch daraus berechnet.
 */

// Reichlich Stellen, damit erst die Anzeige rundet und nicht die Rechnung.
Decimal.config({ precision: 28 });

export function scaleAmount(
  amount: string | null,
  baseServings: number,
  targetServings: number,
): string | null {
  if (amount === null) return null;
  if (!Number.isFinite(baseServings) || baseServings <= 0) return amount;
  if (!Number.isFinite(targetServings) || targetServings <= 0) return amount;
  if (baseServings === targetServings) return amount;
  // Eine einzige Kette aus Multiplikation und Division — kein Zwischenwert.
  return new Decimal(amount).times(targetServings).div(baseServings).toString();
}

/** Skaliert eine ganze Zutatenliste; mengenlose Zeilen bleiben unberührt. */
export function scaleIngredients(
  ingredients: readonly ParsedIngredient[],
  baseServings: number,
  targetServings: number,
): ParsedIngredient[] {
  return ingredients.map((ingredient) => ({
    ...ingredient,
    amount: scaleAmount(ingredient.amount, baseServings, targetServings),
    amountMax: scaleAmount(ingredient.amountMax, baseServings, targetServings),
  }));
}
