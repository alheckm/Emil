import { describe, expect, it } from "vitest";
import { formatAmount, formatIngredientLine, formatNumber } from "../format";

describe("formatNumber", () => {
  it.each([
    ["750", "750"],
    ["1.5", "1,5"],
    ["0.5", "0,5"],
    ["266.6666666666666666", "266,67"],
    ["1.005", "1,01"],
    ["1.50", "1,5"],
    ["0.333333", "0,33"],
    ["1000", "1000"],
  ])("%s → %s", (input, expected) => {
    expect(formatNumber(input)).toBe(expected);
  });
});

describe("formatAmount – Einheit steigt auf, wenn es lesbarer ist", () => {
  it.each([
    ["1000", "g", "1 kg"],
    ["1500", "g", "1,5 kg"],
    ["750", "g", "750 g"],
    ["0.5", "kg", "500 g"],
    ["1500", "ml", "1,5 l"],
    ["250", "ml", "250 ml"],
    ["2", "EL", "2 EL"],
    ["0.5", "TL", "0,5 TL"],
    ["3", "Zehe", "3 Zehe"],
  ])("%s %s → %s", (amount, unit, expected) => {
    expect(formatAmount(amount, unit).text).toBe(expected);
  });

  it("schreibt „Stück“ nicht hin", () => {
    expect(formatAmount("2", "Stück").text).toBe("2");
    expect(formatIngredientLine("2", "Stück", "Zwiebeln")).toBe("2 Zwiebeln");
  });

  it("zeigt Bereiche als Spanne", () => {
    expect(formatAmount("2", "Stück", "3").text).toBe("2–3");
    expect(formatAmount("2", "EL", "3").text).toBe("2–3 EL");
  });

  it("zeigt mengenlose Zutaten nur mit Namen", () => {
    expect(formatAmount(null, null).text).toBe("");
    expect(formatIngredientLine(null, null, "Salz und Pfeffer")).toBe(
      "Salz und Pfeffer",
    );
  });
});
