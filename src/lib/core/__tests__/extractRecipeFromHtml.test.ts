import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  extractRecipeFromHtml,
  parseInstructions,
  parseIsoDuration,
  parseYield,
} from "../extractRecipeFromHtml";
import { CONFIDENCE_REVIEW_THRESHOLD } from "../types";

const chefkochHtml = readFileSync(
  new URL("./fixtures/chefkoch-rindergulasch.html", import.meta.url),
  "utf8",
);

describe("extractRecipeFromHtml – echte Chefkoch-Seite", () => {
  it("findet das Rezept im @graph-Array", () => {
    const result = extractRecipeFromHtml(chefkochHtml);
    expect(result).not.toBeNull();
    expect(result!.source).toBe("json-ld");
  });

  it("liest Titel, Portionen und alle zwölf Zutaten", () => {
    const { recipe } = extractRecipeFromHtml(chefkochHtml)!;
    expect(recipe.title).toContain("Rindergulasch");
    expect(recipe.servings).toBe(4);
    expect(recipe.servingsLabel).toBe("Portionen");
    expect(recipe.ingredients).toHaveLength(12);
  });

  it("zerlegt die Zutaten in Menge, Einheit und Name", () => {
    const { recipe } = extractRecipeFromHtml(chefkochHtml)!;
    const byName = new Map(recipe.ingredients.map((i) => [i.name, i]));

    expect(byName.get("Butterschmalz")).toMatchObject({ amount: "15", unitCode: "g" });
    expect(byName.get("Rindergulasch")).toMatchObject({ amount: "500", unitCode: "g" });
    expect(byName.get("Rotwein")).toMatchObject({ amount: "200", unitCode: "ml" });
    expect(byName.get("Tomatenmark")).toMatchObject({ amount: "2", unitCode: "EL" });
    expect(byName.get("Zwiebel")).toMatchObject({ amount: "2", unitCode: "Stück" });
    expect(byName.get("Salz und Pfeffer")).toMatchObject({ amount: null });
  });

  it("liest die Anleitung aus der HowToSection", () => {
    const { recipe } = extractRecipeFromHtml(chefkochHtml)!;
    expect(recipe.instructions.length).toBeGreaterThan(0);
    expect(recipe.instructions.join(" ")).toContain("Butterschmalz");
  });

  it("löst den @id-Verweis auf das Rezeptbild auf", () => {
    // Chefkoch liefert im Rezept nur `image: {"@id": "…#primaryimage"}`; die
    // URL steht in einem eigenen ImageObject-Knoten im @graph. Ohne Auflösung
    // bliebe jedes importierte Rezept ohne Bild.
    const { recipe } = extractRecipeFromHtml(chefkochHtml)!;
    expect(recipe.imageUrl).toMatch(/^https:\/\/img\.chefkoch-cdn\.de\//);
  });

  it("liest die Gesamtzeit (PT2H20M = 140 Minuten)", () => {
    const { recipe } = extractRecipeFromHtml(chefkochHtml)!;
    expect(recipe.totalTimeMin).toBe(140);
  });

  it("markiert keine der zwölf Zeilen zur Nachkontrolle", () => {
    // Das ist der eigentliche Anspruch: ein Chefkoch-Import soll ohne
    // Nacharbeit durchlaufen.
    const { recipe } = extractRecipeFromHtml(chefkochHtml)!;
    const flagged = recipe.ingredients.filter(
      (i) => i.confidence < CONFIDENCE_REVIEW_THRESHOLD,
    );
    expect(flagged.map((i) => i.rawText)).toEqual([]);
  });
});

describe("parseYield", () => {
  it.each([
    [["4", "4 Portionen"], 4, "Portionen"],
    ["4 Portionen", 4, "Portionen"],
    ["12 Stück", 12, "Stück"],
    [4, 4, null],
    [undefined, null, null],
    ["nach Belieben", null, null],
  ])("%j → %s %s", (input, servings, label) => {
    expect(parseYield(input)).toEqual({ servings, label });
  });
});

describe("parseIsoDuration", () => {
  it.each([
    ["PT1H30M", 90],
    ["PT45M", 45],
    ["PT2H", 120],
    ["P1DT2H", 1560],
    ["PT0M", null],
    ["Unsinn", null],
  ])("%s → %s", (input, expected) => {
    expect(parseIsoDuration(input)).toBe(expected);
  });
});

describe("parseInstructions – alle vier Formen, die vorkommen", () => {
  it("Freitext mit Zeilenumbrüchen", () => {
    expect(parseInstructions("Schritt eins.\nSchritt zwei.")).toEqual([
      "Schritt eins.",
      "Schritt zwei.",
    ]);
  });

  it("Liste von Strings", () => {
    expect(parseInstructions(["Eins", "Zwei"])).toEqual(["Eins", "Zwei"]);
  });

  it("HowToStep-Objekte", () => {
    expect(
      parseInstructions([
        { "@type": "HowToStep", text: "Eins" },
        { "@type": "HowToStep", text: "Zwei" },
      ]),
    ).toEqual(["Eins", "Zwei"]);
  });

  it("HowToSection mit verschachtelten Schritten", () => {
    expect(
      parseInstructions([
        {
          "@type": "HowToSection",
          name: "Zubereitung",
          itemListElement: [{ "@type": "HowToStep", text: "Eins" }],
        },
      ]),
    ).toEqual(["Eins"]);
  });

  it("entfernt HTML aus dem Anleitungstext", () => {
    expect(parseInstructions("<p>Zwiebeln <b>fein</b> würfeln.</p>")).toEqual([
      "Zwiebeln fein würfeln.",
    ]);
  });
});

describe("extractRecipeFromHtml – Randfälle", () => {
  it("gibt null zurück, wenn die Seite kein Rezept enthält", () => {
    expect(extractRecipeFromHtml("<html><body>Nur Text</body></html>")).toBeNull();
  });

  it("überspringt eine kaputte JSON-LD-Insel und nimmt die nächste", () => {
    const html =
      '<script type="application/ld+json">{kaputt</script>' +
      '<script type="application/ld+json">' +
      '{"@type":"Recipe","name":"Test","recipeIngredient":["200 g Mehl"]}' +
      "</script>";
    const result = extractRecipeFromHtml(html)!;
    expect(result.recipe.title).toBe("Test");
    expect(result.recipe.ingredients).toHaveLength(1);
  });

  it("versteht HTML-escaptes JSON-LD", () => {
    const html =
      '<script type="application/ld+json">' +
      "{&quot;@type&quot;:&quot;Recipe&quot;,&quot;name&quot;:&quot;Test&quot;," +
      "&quot;recipeIngredient&quot;:[&quot;1 EL Öl&quot;]}" +
      "</script>";
    const result = extractRecipeFromHtml(html)!;
    expect(result.recipe.ingredients[0]).toMatchObject({ amount: "1", unitCode: "EL" });
  });

  it("fällt auf Microdata zurück und sagt es", () => {
    const html = `<div itemscope itemtype="http://schema.org/Recipe">
      <h1 itemprop="name">Pfannkuchen</h1>
      <span itemprop="recipeYield">4 Portionen</span>
      <li itemprop="recipeIngredient">250 ml Milch</li>
      <li itemprop="recipeIngredient">200 g Mehl</li>
    </div>`;
    const result = extractRecipeFromHtml(html)!;
    expect(result.source).toBe("microdata");
    expect(result.recipe.title).toBe("Pfannkuchen");
    expect(result.recipe.servings).toBe(4);
    expect(result.recipe.ingredients).toHaveLength(2);
  });
});
