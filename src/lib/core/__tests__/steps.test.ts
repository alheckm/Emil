import { describe, expect, it } from "vitest";
import { resolveSteps, stripStepMarkers } from "../steps";

const ingredients = [
  {
    position: 1,
    amount: "300",
    amountMax: null,
    unitCode: "g",
    ingredientName: "Möhren",
    rawText: "300 g Möhren",
  },
  {
    position: 2,
    amount: "400",
    amountMax: null,
    unitCode: "g",
    ingredientName: "Lauch",
    rawText: "400 g Lauch",
  },
  {
    position: 3,
    amount: null,
    amountMax: null,
    unitCode: null,
    ingredientName: null,
    rawText: "Salz",
  },
];

describe("resolveSteps", () => {
  it("setzt Mengen in Basisportionen ein", () => {
    const steps = ["{{z:1}} und {{z:2}} anschwitzen."];
    expect(resolveSteps(steps, ingredients, 4, 4)).toEqual([
      "300 g Möhren und 400 g Lauch anschwitzen.",
    ]);
  });

  it("skaliert die Mengen mit der Zielportionszahl", () => {
    const steps = ["{{z:1}} und {{z:2}} anschwitzen."];
    expect(resolveSteps(steps, ingredients, 4, 6)).toEqual([
      "450 g Möhren und 600 g Lauch anschwitzen.",
    ]);
  });

  it("lässt Schritte ohne Verweis unangetastet", () => {
    expect(resolveSteps(["Den Ofen vorheizen."], ingredients, 4, 6)).toEqual([
      "Den Ofen vorheizen.",
    ]);
  });

  it("löst mengenlose Zutaten auf den Namen auf", () => {
    expect(resolveSteps(["{{z:3}} dazugeben."], ingredients, 4, 6)).toEqual([
      "Salz dazugeben.",
    ]);
  });

  it("lässt einen Verweis auf eine unbekannte Position leer verschwinden", () => {
    expect(resolveSteps(["{{z:9}} anschwitzen."], ingredients, 4, 6)).toEqual(
      [" anschwitzen."],
    );
  });
});

describe("stripStepMarkers", () => {
  it("löst immer auf Basisportionen auf, unabhängig vom Anzeigezustand", () => {
    const steps = ["{{z:1}} und {{z:2}} anschwitzen."];
    expect(stripStepMarkers(steps, ingredients, 4)).toEqual([
      "300 g Möhren und 400 g Lauch anschwitzen.",
    ]);
  });
});
