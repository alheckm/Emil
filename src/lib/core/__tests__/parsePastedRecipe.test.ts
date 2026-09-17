import { describe, expect, it } from "vitest";
import { parsePastedRecipe } from "../parsePastedRecipe";

const JSON_DRAFT = `{
  "title": "Rindergulasch",
  "servings": 4,
  "ingredients": [
    { "amount": 500, "unit": "g", "name": "Rindergulasch" },
    { "name": "Salz und Pfeffer" }
  ]
}`;

const PLAIN_TEXT = `Pfannkuchen
Für 4 Portionen
3 Eier
250 ml Milch
200 g Mehl`;

describe("parsePastedRecipe", () => {
  it("erkennt JSON und meldet den Weg", () => {
    const result = parsePastedRecipe(JSON_DRAFT);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.via).toBe("json");
    expect(result.recipe.title).toBe("Rindergulasch");
    expect(result.recipe.ingredients).toHaveLength(2);
  });

  it("erkennt JSON auch im Code-Block mit Vorsatz", () => {
    const result = parsePastedRecipe("Hier ist es:\n```json\n" + JSON_DRAFT + "\n```");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.via).toBe("json");
  });

  it("liest freien Rezepttext", () => {
    const result = parsePastedRecipe(PLAIN_TEXT);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.via).toBe("text");
    expect(result.recipe.servings).toBe(4);
    expect(result.recipe.ingredients).toHaveLength(3);
  });

  it("meldet bei kaputtem JSON den JSON-Fehler, nicht „keine Zutaten“", () => {
    // Der eigentliche Zweck der Weichenstellung: ein Tippfehler im JSON darf
    // nicht als Textproblem durchgereicht werden.
    const result = parsePastedRecipe('{"title":"T", "ingredients":[}');
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors[0]).toContain("beschädigt");
  });

  it("benennt eine unvollständige Zutat im JSON", () => {
    const result = parsePastedRecipe(
      '{"title":"T","ingredients":[{"amount":1,"unit":"g","name":"Mehl"},{"amount":2}]}',
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.some((e) => e.startsWith("Zutat 2:"))).toBe(true);
  });

  it("weist Text ohne erkennbare Zutaten zurück", () => {
    const result = parsePastedRecipe(
      "Das war ein schöner Abend und das Essen hat allen gut geschmeckt.",
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors[0]).toContain("keine Zutatenliste");
  });

  it("weist leere Eingabe zurück", () => {
    expect(parsePastedRecipe("   ").ok).toBe(false);
  });
});
