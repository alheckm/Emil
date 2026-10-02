import { describe, expect, it } from "vitest";
import { ingredientImageUrl } from "../ingredientImages";

describe("ingredientImageUrl", () => {
  it("baut den Pfad aus dem Slug der Zutat", () => {
    expect(ingredientImageUrl("moehre")).toBe("/zutaten-marktregal/moehre-bold.webp");
  });

  it("liefert nichts, solange die Zutat kein Bild hat", () => {
    expect(ingredientImageUrl(null)).toBeNull();
    expect(ingredientImageUrl(undefined)).toBeNull();
    expect(ingredientImageUrl("")).toBeNull();
  });
});
