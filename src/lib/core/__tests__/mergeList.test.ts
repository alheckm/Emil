import { describe, expect, it } from "vitest";
import {
  UNQUANTIFIED_MERGE_UNIT,
  buildListItems,
  mergeList,
  removeRecipe,
  toMergeAmount,
} from "../mergeList";
import { formatAmount } from "../format";
import type { ListInput } from "../mergeList";

function item(over: Partial<ListInput> & { ingredientId: string }): ListInput {
  return {
    unitCode: null,
    amount: null,
    recipeId: "r1",
    recipeIngredientId: "ri1",
    servings: 4,
    ...over,
  };
}

describe("toMergeAmount", () => {
  it("rechnet auf die Basiseinheit der Dimension um", () => {
    expect(toMergeAmount("0.5", "kg")).toBe("500");
    expect(toMergeAmount("1.5", "l")).toBe("1500");
    expect(toMergeAmount("500", "g")).toBe("500");
  });

  it("lässt Löffel und Stückiges in ihrer eigenen Einheit", () => {
    expect(toMergeAmount("2", "EL")).toBe("2");
    expect(toMergeAmount("3", "Zehe")).toBe("3");
  });
});

describe("mergeList", () => {
  it("addiert dieselbe Zutat über Einheitsgrenzen: 500 g + 0,5 kg = 1 kg", () => {
    const entries = mergeList([
      item({ ingredientId: "zwiebel", unitCode: "g", amount: "500", recipeId: "a" }),
      item({ ingredientId: "zwiebel", unitCode: "kg", amount: "0.5", recipeId: "b" }),
    ]);
    expect(entries).toHaveLength(1);
    expect(entries[0].amount).toBe("1000");
    expect(entries[0].mergeUnit).toBe("g");
    expect(formatAmount(entries[0].amount, entries[0].mergeUnit).text).toBe("1 kg");
    expect(entries[0].sources).toHaveLength(2);
  });

  it("hält Stückzahl und Gewicht derselben Zutat getrennt", () => {
    // Niemand weiß, wie viel Gramm eine Zwiebel hat — zwei Zeilen sind
    // richtig, eine falsch addierte wäre ein stiller Fehler.
    const entries = mergeList([
      item({ ingredientId: "zwiebel", unitCode: "Stück", amount: "2" }),
      item({ ingredientId: "zwiebel", unitCode: "g", amount: "500" }),
    ]);
    expect(entries).toHaveLength(2);
    expect(entries.map((e) => e.mergeUnit).sort()).toEqual(["Stück", "g"]);
  });

  it("hält EL und TL getrennt", () => {
    const entries = mergeList([
      item({ ingredientId: "zucker", unitCode: "EL", amount: "2" }),
      item({ ingredientId: "zucker", unitCode: "TL", amount: "3" }),
    ]);
    expect(entries).toHaveLength(2);
  });

  it("führt drei Rezepte mit Zwiebeln zu einer Zeile zusammen", () => {
    const entries = mergeList([
      item({ ingredientId: "zwiebel", unitCode: "Stück", amount: "2", recipeId: "a" }),
      item({ ingredientId: "zwiebel", unitCode: "Stück", amount: "1", recipeId: "b" }),
      item({ ingredientId: "zwiebel", unitCode: "Stück", amount: "3", recipeId: "c" }),
    ]);
    expect(entries).toHaveLength(1);
    expect(entries[0].amount).toBe("6");
    expect(entries[0].sources.map((s) => s.recipeId)).toEqual(["a", "b", "c"]);
  });

  it("merkt sich eine Zutat ohne Menge neben einer mit Menge", () => {
    const entries = mergeList([
      item({ ingredientId: "salz", unitCode: "TL", amount: "1", recipeId: "a" }),
      item({ ingredientId: "salz", unitCode: "TL", amount: null, recipeId: "b" }),
    ]);
    expect(entries[0].amount).toBe("1");
    expect(entries[0].hasUnquantified).toBe(true);
  });

  it("führt rein mengenlose Zutaten zu einer Zeile ohne Menge", () => {
    const entries = mergeList([
      item({ ingredientId: "pfeffer", recipeId: "a" }),
      item({ ingredientId: "pfeffer", recipeId: "b" }),
    ]);
    expect(entries).toHaveLength(1);
    expect(entries[0].amount).toBeNull();
    expect(entries[0].hasUnquantified).toBe(true);
  });
});

describe("mergeList – Positionen ohne Menge", () => {
  it("hängt „etwas Paprikapulver“ an die Zeile mit 3 EL statt eine zweite zu öffnen", () => {
    // Der Fall, der im echten Durchlauf aufgefallen ist: ein Rezept nennt
    // „Paprikapulver" ohne Menge, zwei andere nennen 2 EL und 1 EL. Im
    // Supermarkt kauft man ein Glas — also eine Zeile.
    const entries = mergeList([
      item({ ingredientId: "paprika", unitCode: null, amount: null, recipeId: "a" }),
      item({ ingredientId: "paprika", unitCode: "EL", amount: "2", recipeId: "b" }),
      item({ ingredientId: "paprika", unitCode: "EL", amount: "1", recipeId: "c" }),
    ]);
    expect(entries).toHaveLength(1);
    expect(entries[0].amount).toBe("3");
    expect(entries[0].mergeUnit).toBe("EL");
    expect(entries[0].hasUnquantified).toBe(true);
    expect(entries[0].sources).toHaveLength(3);
  });

  it("liefert dasselbe Ergebnis, egal in welcher Reihenfolge die Rezepte kommen", () => {
    // Ohne diese Eigenschaft hinge das Ergebnis daran, welches Rezept zuerst
    // auf die Liste gelegt wurde — ein Fehler, der sich nur sporadisch zeigt.
    const mengeZuerst = mergeList([
      item({ ingredientId: "paprika", unitCode: "EL", amount: "2", recipeId: "b" }),
      item({ ingredientId: "paprika", unitCode: null, amount: null, recipeId: "a" }),
    ]);
    const ohneZuerst = mergeList([
      item({ ingredientId: "paprika", unitCode: null, amount: null, recipeId: "a" }),
      item({ ingredientId: "paprika", unitCode: "EL", amount: "2", recipeId: "b" }),
    ]);
    expect(mengeZuerst).toHaveLength(1);
    expect(ohneZuerst).toHaveLength(1);
    expect(mengeZuerst[0].amount).toBe(ohneZuerst[0].amount);
    expect(mengeZuerst[0].mergeUnit).toBe(ohneZuerst[0].mergeUnit);
    expect(mengeZuerst[0].hasUnquantified).toBe(ohneZuerst[0].hasUnquantified);
  });

  it("öffnet eine eigene Zeile, wenn es zu der Zutat gar keine Menge gibt", () => {
    const entries = mergeList([
      item({ ingredientId: "pfeffer", unitCode: null, amount: null, recipeId: "a" }),
      item({ ingredientId: "pfeffer", unitCode: null, amount: null, recipeId: "b" }),
    ]);
    expect(entries).toHaveLength(1);
    expect(entries[0].mergeUnit).toBe(UNQUANTIFIED_MERGE_UNIT);
    expect(entries[0].amount).toBeNull();
    expect(entries[0].hasUnquantified).toBe(true);
  });

  it("wählt bei mehreren Einheiten-Zeilen reproduzierbar dieselbe", () => {
    // Zwiebeln in Gramm und in Stück bleiben zwei Zeilen; „etwas Zwiebel"
    // darf nicht mal hier und mal dort landen.
    const entries = mergeList([
      item({ ingredientId: "zwiebel", unitCode: "g", amount: "500", recipeId: "a" }),
      item({ ingredientId: "zwiebel", unitCode: "Stück", amount: "2", recipeId: "b" }),
      item({ ingredientId: "zwiebel", unitCode: null, amount: null, recipeId: "c" }),
    ]);
    expect(entries).toHaveLength(2);
    const withFlag = entries.filter((e) => e.hasUnquantified);
    expect(withFlag).toHaveLength(1);
    expect(withFlag[0].mergeUnit).toBe("Stück");
  });
});

describe("removeRecipe", () => {
  it("zieht nur den Anteil des entfernten Rezepts ab", () => {
    const entries = mergeList([
      item({ ingredientId: "zwiebel", unitCode: "Stück", amount: "2", recipeId: "a" }),
      item({ ingredientId: "zwiebel", unitCode: "Stück", amount: "3", recipeId: "b" }),
    ]);
    const after = removeRecipe(entries, "a");
    expect(after).toHaveLength(1);
    expect(after[0].amount).toBe("3");
    expect(after[0].sources).toHaveLength(1);
  });

  it("entfernt die Zeile, wenn keine Quelle übrig ist", () => {
    const entries = mergeList([
      item({ ingredientId: "lorbeer", unitCode: "Blatt", amount: "2", recipeId: "a" }),
    ]);
    expect(removeRecipe(entries, "a")).toEqual([]);
  });
});

describe("buildListItems", () => {
  const lines = [
    { id: "ri1", ingredientId: "zwiebel", amount: "2", unitCode: "Stück" },
    { id: "ri2", ingredientId: "butter", amount: "0.25", unitCode: "kg" },
    { id: "ri3", ingredientId: "salz", amount: null, unitCode: null },
    { id: "ri4", ingredientId: null, amount: "1", unitCode: "Bund" },
  ];

  it("skaliert auf die gewünschten Portionen und rechnet in die Merge-Einheit", () => {
    const items = buildListItems(lines, 4, 6);
    expect(items).toEqual([
      {
        ingredient_id: "zwiebel",
        merge_unit: "Stück",
        amount_base: "3",
        recipe_ingredient_id: "ri1",
      },
      {
        ingredient_id: "butter",
        merge_unit: "g",
        amount_base: "375",
        recipe_ingredient_id: "ri2",
      },
      {
        ingredient_id: "salz",
        merge_unit: "Stück",
        amount_base: null,
        recipe_ingredient_id: "ri3",
      },
    ]);
  });

  it("nimmt Zeilen ohne Menge mit — „Salz und Pfeffer“ gehört auf die Liste", () => {
    const items = buildListItems(lines, 4, 4);
    expect(items.map((i) => i.ingredient_id)).toContain("salz");
  });

  it("lässt Zeilen ohne Zutat weg: darunter ließe sich nichts zusammenfassen", () => {
    expect(buildListItems(lines, 4, 4)).toHaveLength(3);
  });

  it("kommt über 4 → 6 → 4 Portionen wieder bei der Basismenge heraus", () => {
    const sechs = buildListItems(lines, 4, 6);
    const zurueck = buildListItems(
      sechs.map((item, index) => ({
        id: item.recipe_ingredient_id,
        ingredientId: item.ingredient_id,
        amount: item.amount_base,
        unitCode: index === 1 ? "g" : lines[index].unitCode,
      })),
      6,
      4,
    );
    expect(zurueck[0].amount_base).toBe("2");
    expect(zurueck[1].amount_base).toBe("250");
  });
});
