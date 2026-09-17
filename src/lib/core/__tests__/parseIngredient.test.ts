import { describe, expect, it } from "vitest";
import { parseIngredient } from "../parseIngredient";
import { CONFIDENCE_REVIEW_THRESHOLD } from "../types";

/**
 * Die zwölf Zeilen sind KEINE erfundenen Beispiele: sie stammen aus dem
 * JSON-LD von chefkoch.de/rezepte/2275401363075693/Rindergulasch.html,
 * abgerufen während der Planung. Wenn der Parser hier durchfällt, fällt er
 * am ersten echten Rezept durch.
 */
const CHEFKOCH_GULASCH = [
  "15 g Butterschmalz",
  "500 g Rindergulasch",
  "2 große Zwiebel(n) (gewürfelte)",
  "1 Knoblauchzehe(n) (gehackte)",
  "2 Karotte(n) (in Scheiben geschnitten)",
  "2 EL Tomatenmark",
  "200 ml Rotwein",
  "200 ml Rinderbrühe",
  "300 ml Gemüsebrühe",
  "Salz und Pfeffer",
  "Paprikapulver",
  "etwas Saucenbinder (oder kalte Butter)",
];

describe("parseIngredient – echte Chefkoch-Zeilen", () => {
  it("liest Gewicht mit Einheit", () => {
    expect(parseIngredient("15 g Butterschmalz")).toMatchObject({
      amount: "15",
      unitCode: "g",
      name: "Butterschmalz",
      note: null,
      toTaste: false,
    });
  });

  it("liest Volumen mit Einheit", () => {
    expect(parseIngredient("200 ml Rotwein")).toMatchObject({
      amount: "200",
      unitCode: "ml",
      name: "Rotwein",
    });
  });

  it("schiebt Größe und Zubereitung in die Notiz und entfernt den Pluralmarker", () => {
    const parsed = parseIngredient("2 große Zwiebel(n) (gewürfelte)");
    expect(parsed).toMatchObject({
      amount: "2",
      unitCode: "Stück",
      name: "Zwiebel",
    });
    // Reihenfolge ist nicht garantiert, der Inhalt schon.
    expect(parsed.note).toContain("gewürfelte");
    expect(parsed.note).toContain("große");
  });

  it("erkennt Zehe als eigene Einheit, nicht als Stück", () => {
    // „Knoblauchzehe(n)" ist eine Zutat, keine Mengenangabe „Zehe" —
    // der Name muss erhalten bleiben, sonst kauft man Knoblauch-Nichts.
    const parsed = parseIngredient("1 Knoblauchzehe(n) (gehackte)");
    expect(parsed.amount).toBe("1");
    expect(parsed.name).toBe("Knoblauchzehe");
    expect(parsed.note).toContain("gehackte");
  });

  it("behält Löffel als eigene Dimension", () => {
    expect(parseIngredient("2 EL Tomatenmark")).toMatchObject({
      amount: "2",
      unitCode: "EL",
      name: "Tomatenmark",
    });
  });

  it("akzeptiert Zeilen ohne Menge", () => {
    const parsed = parseIngredient("Salz und Pfeffer");
    expect(parsed.amount).toBeNull();
    expect(parsed.unitCode).toBeNull();
    expect(parsed.name).toBe("Salz und Pfeffer");
    expect(parsed.toTaste).toBe(false);
  });

  it("erkennt „etwas“ als bewusst mengenlos", () => {
    const parsed = parseIngredient("etwas Saucenbinder (oder kalte Butter)");
    expect(parsed.toTaste).toBe(true);
    expect(parsed.amount).toBeNull();
    expect(parsed.name).toBe("Saucenbinder");
    expect(parsed.note).toContain("oder kalte Butter");
  });

  it("liefert für alle zwölf Zeilen einen brauchbaren Namen", () => {
    for (const line of CHEFKOCH_GULASCH) {
      const parsed = parseIngredient(line);
      expect(parsed.name, line).not.toBe("");
      expect(parsed.rawText, line).toBe(line);
    }
  });

  it("markiert keine der zwölf Zeilen als unsicher", () => {
    const flagged = CHEFKOCH_GULASCH.filter(
      (line) => parseIngredient(line).confidence < CONFIDENCE_REVIEW_THRESHOLD,
    );
    expect(flagged).toEqual([]);
  });
});

describe("parseIngredient – Schreibweisen aus Kochbüchern", () => {
  it.each([
    ["½ TL Salz", "0.5", "TL", "Salz"],
    ["1 1/2 EL Öl", "1.5", "EL", "Öl"],
    ["1½ kg Kartoffeln", "1.5", "kg", "Kartoffeln"],
    ["0,5 l Milch", "0.5", "l", "Milch"],
    ["1/4 Bund Petersilie", "0.25", "Bund", "Petersilie"],
    ["3 Zehen Knoblauch", "3", "Zehe", "Knoblauch"],
    ["1 Päckchen Backpulver", "1", "Päckchen", "Backpulver"],
    ["ca. 250 g Mehl", "250", "g", "Mehl"],
  ])("%s", (line, amount, unitCode, name) => {
    expect(parseIngredient(line)).toMatchObject({ amount, unitCode, name });
  });

  it("liest Bereiche als Unter- und Obergrenze", () => {
    expect(parseIngredient("2-3 Zwiebeln")).toMatchObject({
      amount: "2",
      amountMax: "3",
      unitCode: "Stück",
      name: "Zwiebeln",
    });
    expect(parseIngredient("2 bis 3 EL Zucker")).toMatchObject({
      amount: "2",
      amountMax: "3",
      unitCode: "EL",
    });
  });

  it("fasst produktbestimmende Wörter NICHT als Notiz auf", () => {
    // Sonst landen getrocknete und frische Tomaten auf einer Einkaufszeile.
    const dried = parseIngredient("100 g getrocknete Tomaten");
    expect(dried.name).toBe("getrocknete Tomaten");
    expect(dried.note).toBeNull();

    const ground = parseIngredient("1 TL gemahlener Kreuzkümmel");
    expect(ground.name).toBe("gemahlener Kreuzkümmel");
  });

  it("erkennt die Schrägstrich-Pluralform von Chefkoch", () => {
    // „3 Zehe/n Knoblauch" kommt auf Chefkoch häufiger vor als „Zehe(n)".
    expect(parseIngredient("3 Zehe/n Knoblauch")).toMatchObject({
      amount: "3",
      unitCode: "Zehe",
      name: "Knoblauch",
    });
    expect(parseIngredient("2 Dose/n Tomaten")).toMatchObject({
      amount: "2",
      unitCode: "Dose",
      name: "Tomaten",
    });
    expect(parseIngredient("2 Paprikaschote/n").name).toBe("Paprikaschote");
  });

  it("zerschneidet keine echten Schrägstriche im Namen", () => {
    // Hier ist „/Pfeffer" keine Pluralendung und muss stehen bleiben.
    expect(parseIngredient("Salz/Pfeffer").name).toBe("Salz/Pfeffer");
  });

  it("erkennt die Einheit auch mit anhängendem Komma", () => {
    // Echte Zeile: „1 EL, gehäuft Tomatenmark".
    const parsed = parseIngredient("1 EL, gehäuft Tomatenmark");
    expect(parsed).toMatchObject({ amount: "1", unitCode: "EL", name: "Tomatenmark" });
    expect(parsed.note).toContain("gehäuft");
  });

  it("entfernt Aufzählungszeichen", () => {
    expect(parseIngredient("• 200 g Sahne").name).toBe("Sahne");
    expect(parseIngredient("- 2 Eier")).toMatchObject({ amount: "2", name: "Eier" });
  });

  it("markiert eine Zeile als unsicher, wenn der Name mit einer Zahl beginnt", () => {
    // „2x 400g Dosen" — hier hat der Parser die Struktur nicht verstanden
    // und soll das zugeben statt zu raten.
    const parsed = parseIngredient("2x 400 g Dosen Tomaten");
    expect(parsed.confidence).toBeLessThan(CONFIDENCE_REVIEW_THRESHOLD);
  });

  it("kommt mit einer leeren Zeile klar", () => {
    const parsed = parseIngredient("   ");
    expect(parsed.name).toBe("");
    expect(parsed.confidence).toBe(0);
  });
});
