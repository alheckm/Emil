import { describe, expect, it } from "vitest";
import { parseRecipeText } from "../parseRecipeText";

/** Wie man ein Kochbuch abtippt: Titel, Portionen, Liste, Anleitung. */
const PLAIN = `Rindergulasch

Für 4 Portionen

15 g Butterschmalz
500 g Rindergulasch
2 große Zwiebeln
2 EL Tomatenmark
200 ml Rotwein
Salz und Pfeffer

Zubereitung
Butterschmalz in einem Topf erhitzen und das Fleisch darin scharf anbraten.
Zwiebeln zugeben und glasig dünsten, dann Tomatenmark kurz mitrösten.
Mit Rotwein ablöschen und zugedeckt 90 Minuten schmoren lassen.`;

/** Mit Zwischenüberschriften, wie bei Kuchen und Braten üblich. */
const GROUPED = `Zwiebelkuchen
Zutaten für 12 Stück

Für den Teig:
500 g Mehl
1 Päckchen Trockenhefe
250 ml lauwarme Milch

Für den Belag:
1 kg Zwiebeln
200 g Speckwürfel
3 Eier

Zubereitung
Mehl mit Hefe und Milch zu einem glatten Teig verkneten und gehen lassen.`;

/** Aus einer App kopiert: Aufzählungszeichen, numerierte Schritte. */
const BULLETS = `Ofengemüse
Für 2 Personen
• 2 Paprika
• 1 Zucchini
• 3 EL Olivenöl
• etwas Rosmarin

Zubereitung
1. Den Ofen auf 200 Grad Umluft vorheizen und ein Blech mit Backpapier belegen.
2. Das Gemüse in mundgerechte Stücke schneiden und mit dem Öl vermengen.`;

describe("parseRecipeText", () => {
  it("liest Titel, Portionen, Zutaten und Anleitung aus einfachem Text", () => {
    const recipe = parseRecipeText(PLAIN);
    expect(recipe.title).toBe("Rindergulasch");
    expect(recipe.servings).toBe(4);
    expect(recipe.servingsLabel).toBe("Portionen");
    expect(recipe.ingredients).toHaveLength(6);
    expect(recipe.ingredients[0]).toMatchObject({
      amount: "15",
      unitCode: "g",
      name: "Butterschmalz",
    });
    expect(recipe.ingredients[5].name).toBe("Salz und Pfeffer");
    expect(recipe.instructions).toHaveLength(3);
    expect(recipe.instructions[0]).toMatch(/^Butterschmalz in einem Topf/);
  });

  it("behält Zwischenüberschriften als Gruppe", () => {
    const recipe = parseRecipeText(GROUPED);
    expect(recipe.title).toBe("Zwiebelkuchen");
    expect(recipe.servings).toBe(12);
    expect(recipe.servingsLabel).toBe("Stück");
    expect(recipe.ingredients).toHaveLength(6);

    const groups = recipe.ingredients.map((i) => i.groupLabel);
    expect(groups.slice(0, 3)).toEqual(["Für den Teig", "Für den Teig", "Für den Teig"]);
    expect(groups.slice(3)).toEqual(["Für den Belag", "Für den Belag", "Für den Belag"]);

    // Eine Zwischenüberschrift darf nie als Zutat durchrutschen.
    expect(recipe.ingredients.map((i) => i.name)).not.toContain("Für den Teig");
  });

  it("kommt mit Aufzählungszeichen und numerierten Schritten klar", () => {
    const recipe = parseRecipeText(BULLETS);
    expect(recipe.title).toBe("Ofengemüse");
    expect(recipe.servings).toBe(2);
    expect(recipe.servingsLabel).toBe("Personen");
    expect(recipe.ingredients.map((i) => i.name)).toEqual([
      "Paprika",
      "Zucchini",
      "Olivenöl",
      "Rosmarin",
    ]);
    expect(recipe.ingredients[3].toTaste).toBe(true);
    expect(recipe.instructions).toHaveLength(2);
    // Die Nummerierung gehört nicht in den Text des Schritts.
    expect(recipe.instructions[0]).toMatch(/^Den Ofen auf 200 Grad/);
  });

  it("liefert bei leerer Eingabe einen leeren Entwurf statt zu werfen", () => {
    const recipe = parseRecipeText("   \n\n  ");
    expect(recipe).toMatchObject({
      title: null,
      servings: null,
      ingredients: [],
      instructions: [],
    });
  });

  it("kommt auch ohne Portionsangabe und ohne Überschriften durch", () => {
    const recipe = parseRecipeText("Pfannkuchen\n3 Eier\n250 ml Milch\n200 g Mehl");
    expect(recipe.title).toBe("Pfannkuchen");
    expect(recipe.servings).toBeNull();
    expect(recipe.ingredients).toHaveLength(3);
  });
});
