import { describe, expect, it } from "vitest";
import { scaleAmount, scaleIngredients } from "../scale";
import { formatAmount } from "../format";
import { parseIngredient } from "../parseIngredient";

describe("scaleAmount – streng linear, exakt", () => {
  it("4 → 6 Portionen: 500 g werden 750 g", () => {
    expect(scaleAmount("500", 4, 6)).toBe("750");
  });

  it("4 → 3 Portionen: 200 ml werden 150 ml", () => {
    expect(scaleAmount("200", 4, 3)).toBe("150");
  });

  it("4 → 6 Portionen: 1 Ei wird 1,5 — und wird so angezeigt", () => {
    const scaled = scaleAmount("1", 4, 6);
    expect(scaled).toBe("1.5");
    expect(formatAmount(scaled, "Stück").text).toBe("1,5");
  });

  it("lässt mengenlose Zutaten unangetastet", () => {
    expect(scaleAmount(null, 4, 6)).toBeNull();
  });

  it("ist bei gleicher Portionszahl ein reiner Durchlauf", () => {
    expect(scaleAmount("333.3333", 4, 4)).toBe("333.3333");
  });

  it("kommt aus einem Hin- und Zurück exakt bei der Basismenge heraus", () => {
    // Der Grund, warum die Basismenge gespeichert wird und nicht der skalierte
    // Wert: aus 200 → 3 Portionen → zurück auf 4 muss wieder 200 werden.
    const base = "200";
    const three = scaleAmount(base, 4, 3)!;
    const backTo4 = scaleAmount(base, 4, 4)!;
    expect(three).toBe("150");
    expect(backTo4).toBe("200");
  });

  it("rechnet krumme Faktoren ohne früh zu runden", () => {
    // 3 → 4 Portionen bei 200 ml: periodisch, also nicht exakt darstellbar.
    // Entscheidend ist, dass die Rechnung viele Stellen behält und erst die
    // Anzeige auf zwei Dezimalstellen kürzt.
    const scaled = scaleAmount("200", 3, 4)!;
    expect(scaled.startsWith("266.6666666")).toBe(true);
    expect(formatAmount(scaled, "ml").text).toBe("266,67 ml");
  });

  it("verweigert unsinnige Portionszahlen statt zu rechnen", () => {
    expect(scaleAmount("100", 0, 4)).toBe("100");
    expect(scaleAmount("100", 4, 0)).toBe("100");
  });

  it("skaliert eine ganze Liste inklusive Obergrenzen", () => {
    const ingredients = [
      parseIngredient("500 g Rindergulasch"),
      parseIngredient("2-3 Zwiebeln"),
      parseIngredient("Salz und Pfeffer"),
    ];
    const scaled = scaleIngredients(ingredients, 4, 8);
    expect(scaled[0].amount).toBe("1000");
    expect(scaled[1].amount).toBe("4");
    expect(scaled[1].amountMax).toBe("6");
    expect(scaled[2].amount).toBeNull();
  });
});
