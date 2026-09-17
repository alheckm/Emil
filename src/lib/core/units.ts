import type { Dimension, Unit } from "./types";

/**
 * Einheiten-Tabelle für deutsche Rezepte.
 *
 * Die Dimension entscheidet, was auf der Einkaufsliste zusammengerechnet wird:
 * `mass` und `volume` rechnen um (500 g + 0,5 kg = 1 kg), `spoon` und `count`
 * summieren nur mit ihrer eigenen Einheit. Deshalb sind „Päckchen" und
 * „Packung" getrennt (ein Päckchen Backpulver ist keine Packung Mehl) und
 * „Zehe" ist nicht „Stück".
 */
export const UNITS: readonly Unit[] = [
  // Gewicht — Basis Gramm
  { code: "g", display: "g", dimension: "mass", baseFactor: 1, aliases: ["g", "gr", "gramm"] },
  { code: "kg", display: "kg", dimension: "mass", baseFactor: 1000, aliases: ["kg", "kilo", "kilogramm"] },
  { code: "mg", display: "mg", dimension: "mass", baseFactor: 0.001, aliases: ["mg", "milligramm"] },
  { code: "Pfund", display: "Pfund", dimension: "mass", baseFactor: 500, aliases: ["pfund", "pfd"] },

  // Volumen — Basis Milliliter
  { code: "ml", display: "ml", dimension: "volume", baseFactor: 1, aliases: ["ml", "milliliter"] },
  { code: "cl", display: "cl", dimension: "volume", baseFactor: 10, aliases: ["cl", "zentiliter"] },
  { code: "dl", display: "dl", dimension: "volume", baseFactor: 100, aliases: ["dl", "deziliter"] },
  { code: "l", display: "l", dimension: "volume", baseFactor: 1000, aliases: ["l", "ltr", "liter"] },

  // Löffel & Prisen — absichtlich nicht in ml umgerechnet
  { code: "EL", display: "EL", dimension: "spoon", baseFactor: 1, aliases: ["el", "essl", "esslöffel", "esslöffeln", "tbsp"] },
  { code: "TL", display: "TL", dimension: "spoon", baseFactor: 1, aliases: ["tl", "teel", "teelöffel", "teelöffeln", "tsp"] },
  { code: "Prise", display: "Prise", dimension: "spoon", baseFactor: 1, aliases: ["prise", "prisen"] },
  { code: "Msp", display: "Msp.", dimension: "spoon", baseFactor: 1, aliases: ["msp", "messerspitze", "messerspitzen"] },
  { code: "Tropfen", display: "Tropfen", dimension: "spoon", baseFactor: 1, aliases: ["tropfen"] },

  // Stückige Einheiten — jede für sich
  { code: "Stück", display: "Stück", dimension: "count", baseFactor: 1, aliases: ["stück", "stücke", "stk", "st", "stueck"] },
  { code: "Zehe", display: "Zehe", dimension: "count", baseFactor: 1, aliases: ["zehe", "zehen"] },
  { code: "Bund", display: "Bund", dimension: "count", baseFactor: 1, aliases: ["bund", "bd"] },
  { code: "Dose", display: "Dose", dimension: "count", baseFactor: 1, aliases: ["dose", "dosen"] },
  { code: "Packung", display: "Packung", dimension: "count", baseFactor: 1, aliases: ["packung", "packungen", "pkg"] },
  { code: "Päckchen", display: "Päckchen", dimension: "count", baseFactor: 1, aliases: ["päckchen", "paeckchen", "pck", "pckg"] },
  { code: "Scheibe", display: "Scheibe", dimension: "count", baseFactor: 1, aliases: ["scheibe", "scheiben"] },
  { code: "Stange", display: "Stange", dimension: "count", baseFactor: 1, aliases: ["stange", "stangen"] },
  { code: "Zweig", display: "Zweig", dimension: "count", baseFactor: 1, aliases: ["zweig", "zweige"] },
  { code: "Blatt", display: "Blatt", dimension: "count", baseFactor: 1, aliases: ["blatt", "blätter", "blaetter"] },
  { code: "Becher", display: "Becher", dimension: "count", baseFactor: 1, aliases: ["becher"] },
  { code: "Glas", display: "Glas", dimension: "count", baseFactor: 1, aliases: ["glas", "gläser", "glaeser"] },
  { code: "Tasse", display: "Tasse", dimension: "count", baseFactor: 1, aliases: ["tasse", "tassen"] },
  { code: "Würfel", display: "Würfel", dimension: "count", baseFactor: 1, aliases: ["würfel", "wuerfel"] },
  { code: "Kugel", display: "Kugel", dimension: "count", baseFactor: 1, aliases: ["kugel", "kugeln"] },
  { code: "Kopf", display: "Kopf", dimension: "count", baseFactor: 1, aliases: ["kopf", "köpfe"] },
  { code: "Knolle", display: "Knolle", dimension: "count", baseFactor: 1, aliases: ["knolle", "knollen"] },
  { code: "Handvoll", display: "Handvoll", dimension: "count", baseFactor: 1, aliases: ["handvoll", "hand voll"] },
] as const;

/** Einheit ohne Angabe: „2 Zwiebeln" wird als 2 Stück geführt. */
export const IMPLICIT_COUNT_UNIT = "Stück";

const BY_CODE = new Map<string, Unit>(UNITS.map((u) => [u.code, u]));

const BY_ALIAS = new Map<string, Unit>();
for (const unit of UNITS) {
  BY_ALIAS.set(unit.code.toLowerCase(), unit);
  for (const alias of unit.aliases) BY_ALIAS.set(alias, unit);
}

/** Längster Alias in Wörtern — begrenzt, wie weit der Parser nach vorn schaut. */
export const MAX_UNIT_WORDS = Math.max(
  ...UNITS.flatMap((u) => u.aliases.map((a) => a.split(" ").length)),
);

export function getUnit(code: string | null): Unit | null {
  if (!code) return null;
  return BY_CODE.get(code) ?? null;
}

/** Sucht eine Einheit anhand einer Schreibweise aus dem Rezepttext. */
export function findUnit(token: string): Unit | null {
  // Anhängende Satzzeichen mit abstreifen: Rezeptseiten schreiben „1 EL,
  // gehäuft Tomatenmark", und ohne das bliebe „EL," unerkannt und die Menge
  // stünde als Stückzahl da.
  const normalized = token
    .toLowerCase()
    .replace(/[.,;:]+$/, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!normalized) return null;
  return BY_ALIAS.get(normalized) ?? null;
}

/** Basiseinheit der Dimension, in der gerechnet und gespeichert wird. */
export function baseUnitFor(dimension: Dimension): string | null {
  if (dimension === "mass") return "g";
  if (dimension === "volume") return "ml";
  return null;
}

/**
 * Einheit, unter der auf der Einkaufsliste zusammengefasst wird.
 *
 * Gewicht und Volumen landen auf ihrer Basiseinheit, alles andere behält den
 * eigenen Code — dadurch bleiben „2 Zwiebeln" und „500 g Zwiebeln" zwei Zeilen
 * derselben Zutat statt einer falsch addierten.
 */
export function mergeUnitFor(unitCode: string | null): string {
  const unit = getUnit(unitCode ?? IMPLICIT_COUNT_UNIT);
  if (!unit) return unitCode ?? IMPLICIT_COUNT_UNIT;
  return baseUnitFor(unit.dimension) ?? unit.code;
}
