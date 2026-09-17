import { describe, expect, it } from "vitest";
import { extractJsonObject, parseDraftJson } from "../draftSchema";
import { CONFIDENCE_REVIEW_THRESHOLD } from "../types";

const GOOD = `{
  "title": "Rindergulasch, klassisch",
  "servings": 4,
  "servings_label": "Portionen",
  "ingredients": [
    { "amount": 15, "unit": "g", "name": "Butterschmalz" },
    { "amount": 2, "unit": "Stück", "name": "Zwiebel", "note": "groß, gewürfelt" },
    { "amount": 2, "unit": "EL", "name": "Tomatenmark" },
    { "name": "Salz und Pfeffer" }
  ],
  "instructions": ["Butterschmalz erhitzen.", "Fleisch anbraten."]
}`;

describe("extractJsonObject – was aus claude.ai wirklich kommt", () => {
  it("nimmt reines JSON", () => {
    expect(extractJsonObject('{"a":1}')).toBe('{"a":1}');
  });

  it("schält einen ```json-Block heraus", () => {
    expect(extractJsonObject('```json\n{"a":1}\n```')).toBe('{"a":1}');
  });

  it("schält einen Block ohne Sprachangabe heraus", () => {
    expect(extractJsonObject('```\n{"a":1}\n```')).toBe('{"a":1}');
  });

  it("überliest einen Satz davor und danach", () => {
    expect(extractJsonObject('Hier ist das Rezept:\n{"a":1}\nViel Erfolg!')).toBe(
      '{"a":1}',
    );
  });

  it("gibt null zurück, wenn gar kein Objekt drin ist", () => {
    expect(extractJsonObject("nur Text")).toBeNull();
    expect(extractJsonObject("")).toBeNull();
  });
});

describe("parseDraftJson", () => {
  it("liest ein vollständiges Rezept", () => {
    const result = parseDraftJson(GOOD);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.recipe.title).toBe("Rindergulasch, klassisch");
    expect(result.recipe.servings).toBe(4);
    expect(result.recipe.ingredients).toHaveLength(4);
    expect(result.recipe.ingredients[0]).toMatchObject({
      amount: "15",
      unitCode: "g",
      name: "Butterschmalz",
    });
    expect(result.recipe.ingredients[3]).toMatchObject({
      amount: null,
      unitCode: null,
      name: "Salz und Pfeffer",
    });
    expect(result.recipe.instructions).toHaveLength(2);
  });

  it("funktioniert auch mit Code-Fence und Vorsatz", () => {
    const result = parseDraftJson("Hier ist das Rezept:\n```json\n" + GOOD + "\n```");
    expect(result.ok).toBe(true);
  });

  it("akzeptiert Mengen als Text, inklusive Bruch und Komma", () => {
    const result = parseDraftJson(`{
      "title": "Test", "ingredients": [
        { "amount": "1/2", "unit": "TL", "name": "Salz" },
        { "amount": "1,5", "unit": "kg", "name": "Kartoffeln" }
      ]}`);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.recipe.ingredients[0].amount).toBe("0.5");
    expect(result.recipe.ingredients[1].amount).toBe("1.5");
  });

  it("markiert eine unbekannte Einheit statt sie zu verlieren", () => {
    const result = parseDraftJson(
      '{"title":"T","ingredients":[{"amount":1,"unit":"Schuss","name":"Weißwein"}]}',
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const ingredient = result.recipe.ingredients[0];
    expect(ingredient.name).toBe("Schuss Weißwein");
    expect(ingredient.confidence).toBeLessThan(CONFIDENCE_REVIEW_THRESHOLD);
  });

  it("markiert eine angekündigte, aber unlesbare Menge", () => {
    const result = parseDraftJson(
      '{"title":"T","ingredients":[{"amount":"eine Handvoll","name":"Nüsse"}]}',
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.recipe.ingredients[0].amount).toBeNull();
    expect(result.recipe.ingredients[0].confidence).toBeLessThan(
      CONFIDENCE_REVIEW_THRESHOLD,
    );
  });

  it("nennt fehlenden Titel und fehlende Zutaten beim Namen", () => {
    const result = parseDraftJson('{"ingredients":[]}');
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.join(" ")).toContain("title");
    expect(result.errors.join(" ")).toContain("keine Zutaten");
  });

  it("sagt bei einer Zutat ohne Namen, welche Zutat gemeint ist", () => {
    const result = parseDraftJson(
      '{"title":"T","ingredients":[{"amount":1,"unit":"g","name":"Mehl"},{"amount":2}]}',
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.some((e) => e.startsWith("Zutat 2:"))).toBe(true);
  });

  it("erklärt kaputtes JSON verständlich statt zu werfen", () => {
    const result = parseDraftJson('{"title":"T", "ingredients":[}');
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors[0]).toContain("beschädigt");
  });

  it("erklärt es auch, wenn gar kein JSON eingefügt wurde", () => {
    const result = parseDraftJson("Rindergulasch mit 500 g Fleisch");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors[0]).toContain("kein JSON-Objekt");
  });
});
