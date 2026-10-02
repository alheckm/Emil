import { describe, expect, it } from "vitest";
import { derivedTags, normalizeTags } from "../recipeTags";

describe("normalizeTags", () => {
  it("behält nur bekannte Schlagwörter, klein geschrieben und in fester Reihenfolge", () => {
    expect(normalizeTags(["Snack", "Sonntagsessen", "Proteinreich"])).toEqual([
      "proteinreich",
      "snack",
    ]);
  });

  it('macht aus altem „Vegetarisch" das neue Schlüsselwort', () => {
    expect(normalizeTags(["Vegetarisch"])).toEqual(["vegetarisch"]);
  });

  it('lässt „vegan" auch „vegetarisch" bedeuten', () => {
    expect(normalizeTags(["vegan"])).toEqual(["vegan", "vegetarisch"]);
  });

  it("entfernt Doppelte und Leerraum", () => {
    expect(normalizeTags([" snack ", "snack"])).toEqual(["snack"]);
  });

  it('nimmt „saisonal" und „≤ 30 Min" nicht an — die sind abgeleitet', () => {
    expect(normalizeTags(["saisonal", "≤ 30 Min"])).toEqual([]);
  });
});

describe("derivedTags", () => {
  it("quick: genau 30 Minuten zählen, unbekannte Zeit nicht", () => {
    expect(derivedTags({ totalTimeMin: 30, seasonMonths: [] }, 5).quick).toBe(true);
    expect(derivedTags({ totalTimeMin: 31, seasonMonths: [] }, 5).quick).toBe(false);
    expect(derivedTags({ totalTimeMin: null, seasonMonths: [] }, 5).quick).toBe(false);
  });

  it("seasonal: nur im Monat der Saison", () => {
    expect(derivedTags({ totalTimeMin: null, seasonMonths: [9, 10] }, 10).seasonal).toBe(true);
    expect(derivedTags({ totalTimeMin: null, seasonMonths: [9, 10] }, 11).seasonal).toBe(false);
  });
});
