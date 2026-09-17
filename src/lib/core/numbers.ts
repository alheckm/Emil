import Decimal from "decimal.js-light";

/**
 * Mengenangaben aus deutschen Rezepten in exakte Dezimal-Strings.
 *
 * Abgedeckt: „500", „0,5", „1/2", „½", „1 1/2", „1½", „2,5".
 * Kochbücher benutzen alle diese Schreibweisen durcheinander, teils in einer Zeile.
 */

const VULGAR_FRACTIONS: Record<string, string> = {
  "½": "1/2",
  "⅓": "1/3",
  "⅔": "2/3",
  "¼": "1/4",
  "¾": "3/4",
  "⅕": "1/5",
  "⅖": "2/5",
  "⅗": "3/5",
  "⅘": "4/5",
  "⅙": "1/6",
  "⅚": "5/6",
  "⅛": "1/8",
  "⅜": "3/8",
  "⅝": "5/8",
  "⅞": "7/8",
};

/**
 * Ersetzt Bruchzeichen durch „a/b" und fügt vor einem direkt angeklebten Bruch
 * ein Leerzeichen ein, damit „1½" wie „1 1/2" gelesen wird.
 */
export function expandVulgarFractions(text: string): string {
  let out = "";
  for (const char of text) {
    const fraction = VULGAR_FRACTIONS[char];
    if (!fraction) {
      out += char;
      continue;
    }
    // „1½" → „1 1/2", aber „½" am Zeilenanfang bleibt ohne führendes Leerzeichen.
    if (/\d$/.test(out)) out += " ";
    out += fraction;
  }
  return out;
}

/**
 * Regex-Fragment für eine Menge — auch gemischte Brüche wie „1 1/2".
 *
 * Die Reihenfolge ist wesentlich: Regex-Alternativen greifen von links, also
 * muss die längste Form zuerst stehen. Stünde `\d+` vorn, würde es aus „1/4"
 * die „1" nehmen und „/4 Bund Petersilie" als Namen übrig lassen.
 */
export const NUMBER_PATTERN =
  "\\d+\\s+\\d+\\s*/\\s*\\d+|\\d+\\s*/\\s*\\d+|\\d+(?:[.,]\\d+)?";

/**
 * Liest eine bereits isolierte Mengenangabe als Dezimal-String.
 * Gibt `null` zurück, wenn nichts Verwertbares drinsteht — Raten wäre hier
 * schlimmer als Aufgeben, weil eine falsche Menge unbemerkt durchgeht.
 */
export function parseAmount(input: string): string | null {
  const text = expandVulgarFractions(input).trim();
  if (!text) return null;

  // Gemischter Bruch: „1 1/2"
  const mixed = text.match(/^(\d+)\s+(\d+)\s*\/\s*(\d+)$/);
  if (mixed) {
    const [, whole, numerator, denominator] = mixed;
    if (Number(denominator) === 0) return null;
    return new Decimal(whole)
      .plus(new Decimal(numerator).div(denominator))
      .toString();
  }

  // Reiner Bruch: „1/2"
  const fraction = text.match(/^(\d+)\s*\/\s*(\d+)$/);
  if (fraction) {
    const [, numerator, denominator] = fraction;
    if (Number(denominator) === 0) return null;
    return new Decimal(numerator).div(denominator).toString();
  }

  // Dezimalzahl, deutsch oder englisch geschrieben
  const decimal = text.match(/^(\d+(?:[.,]\d+)?)$/);
  if (decimal) return new Decimal(decimal[1].replace(",", ".")).toString();

  return null;
}
