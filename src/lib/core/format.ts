import Decimal from "decimal.js-light";
import { UNITS, getUnit } from "./units";
import type { Dimension } from "./types";

/**
 * Anzeige von Mengen: maximal zwei Dezimalstellen, deutsches Komma, keine
 * überflüssigen Nullen. Gerundet wird **nur hier** — der gespeicherte und
 * weitergerechnete Wert bleibt exakt.
 */

/** Von klein nach groß: die Leiter, auf der die Anzeige aufsteigt. */
const LADDERS: Partial<Record<Dimension, string[]>> = {
  mass: ["g", "kg"],
  volume: ["ml", "l"],
};

/** „Stück" schreibt man nicht hin — „2 Zwiebeln" statt „2 Stück Zwiebeln". */
const SILENT_UNITS = new Set(["Stück"]);

export function formatNumber(amount: string, maxDecimals = 2): string {
  const rounded = new Decimal(amount).toDecimalPlaces(maxDecimals);
  // toString() lässt bereits keine Nachkommanullen übrig ("1.50" → "1.5").
  return rounded.toString().replace(".", ",");
}

export interface DisplayAmount {
  /** Zahl in der gewählten Einheit, z. B. „1,5". */
  value: string | null;
  /** Anzeigeform der Einheit, ggf. aufgestiegen („g" → „kg"). */
  unit: string | null;
  /** Fertiger Text, z. B. „1,5 kg" oder „2–3". */
  text: string;
}

/**
 * Wählt die angenehmste Einheit derselben Dimension und formatiert.
 * 1500 g werden „1,5 kg", 250 ml bleiben „250 ml", 0,5 kg werden „500 g".
 */
export function formatAmount(
  amount: string | null,
  unitCode: string | null,
  amountMax: string | null = null,
): DisplayAmount {
  const unit = getUnit(unitCode);

  if (amount === null) {
    const unitLabel = unit && !SILENT_UNITS.has(unit.code) ? unit.display : null;
    return { value: null, unit: unitLabel, text: unitLabel ?? "" };
  }

  let value = new Decimal(amount);
  let display = unit?.display ?? null;

  const ladder = unit ? LADDERS[unit.dimension] : undefined;
  if (unit && ladder) {
    // In die Basiseinheit umrechnen, dann die größte Einheit nehmen,
    // bei der noch mindestens 1 herauskommt.
    const base = value.times(unit.baseFactor);
    let chosen = unit;
    for (const code of ladder) {
      const candidate = UNITS.find((u) => u.code === code);
      if (!candidate) continue;
      if (base.div(candidate.baseFactor).abs().gte(1)) chosen = candidate;
    }
    value = base.div(chosen.baseFactor);
    display = chosen.display;
  }

  if (unit && SILENT_UNITS.has(unit.code)) display = null;

  const main = formatNumber(value.toString());

  if (amountMax !== null) {
    let maxValue = new Decimal(amountMax);
    if (unit && ladder && display) {
      const chosen = UNITS.find((u) => u.display === display);
      if (chosen) maxValue = maxValue.times(unit.baseFactor).div(chosen.baseFactor);
    }
    const range = `${main}–${formatNumber(maxValue.toString())}`;
    return {
      value: range,
      unit: display,
      text: display ? `${range} ${display}` : range,
    };
  }

  return {
    value: main,
    unit: display,
    text: display ? `${main} ${display}` : main,
  };
}

/** Vollständige Zeile inklusive Name, wie sie auf der Liste steht. */
export function formatIngredientLine(
  amount: string | null,
  unitCode: string | null,
  name: string,
  amountMax: string | null = null,
): string {
  const { text } = formatAmount(amount, unitCode, amountMax);
  return text ? `${text} ${name}` : name;
}
