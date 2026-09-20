import { NUMBER_PATTERN, expandVulgarFractions, parseAmount } from "./numbers";
import type { ParsedIngredient } from "./types";
import { IMPLICIT_COUNT_UNIT, MAX_UNIT_WORDS, findUnit } from "./units";

/**
 * Zerlegt eine Zutatenzeile in Menge, Einheit, Name und Notiz.
 *
 * Getestet gegen echte Chefkoch-Zeilen. Die Zeile bleibt als `rawText` erhalten:
 * wenn das Parsen daneben liegt, ist das Original die Wahrheit, und der
 * Prüf-Screen zeigt es an.
 */

/** Aufzählungszeichen am Zeilenanfang. */
const BULLETS = /^[\s\-–—•*·‣▢□☐▪]+/;

/**
 * Wörter, die eine Menge relativieren, ohne sie zu ändern. Werden entfernt,
 * ohne die Zeile als unsicher zu markieren.
 */
const VAGUE_QUANTIFIERS = /^(?:ca\.?|etwa|circa|gut|knapp|rund)\s+/i;

/** Angaben, die bewusst keine Menge haben. */
const TO_TASTE_PATTERNS = [
  /^etwas\s+/i,
  /^ein\s+wenig\s+/i,
  /^ein\s+paar\s+/i,
  /^reichlich\s+/i,
  /^evtl\.?\s+/i,
  /^eventuell\s+/i,
  /\bnach\s+(?:geschmack|belieben|bedarf)\b/i,
  /\bn\.\s?b\.\b/i,
  /\bje\s+nach\s+geschmack\b/i,
];

/**
 * Zusätze, die nur beschreiben, was du zu Hause damit machst — sie wandern in
 * die Notiz, damit sie das Zusammenfassen auf der Einkaufsliste nicht verhindern.
 */
const PREP_WORDS = [
  "groß", "große", "großer", "großes", "grosse", "grosser", "grosses",
  "klein", "kleine", "kleiner", "kleines",
  "mittelgroß", "mittelgroße", "mittelgroßer", "mittelgroßes",
  "gehackt", "gehackte", "gehackter", "gehacktes",
  "gewürfelt", "gewürfelte", "gewürfelter", "gewürfeltes",
  "gerieben", "geriebene", "geriebener", "geriebenes",
  "geschnitten", "geschnittene", "geschnittener", "geschnittenes",
  "geschält", "geschälte", "geschälter", "geschältes",
  "entkernt", "entkernte", "entkernter", "entkerntes",
  "gewaschen", "gewaschene", "gewaschener", "gewaschenes",
  "zerdrückt", "zerdrückte", "zerdrückter", "zerdrücktes",
  "zimmerwarm", "weich", "weiche", "weicher", "weiches",
  "fein", "feine", "feiner", "feines", "grob", "grobe", "grober", "grobes",
  // Löffel-Zusätze: ändern nichts am Einkauf, nur an der Dosierung.
  "gehäuft", "gehäufte", "gehäufter", "gehäuftes", "gestrichen", "gestrichene",
];

/**
 * Wörter, die ausdrücklich NICHT in die Notiz wandern: sie bezeichnen ein
 * anderes Produkt. „getrocknete Tomaten" und „Tomaten" darf die Einkaufsliste
 * nicht zusammenfassen — das wäre ein stiller Einkauf-Fehler.
 */
const PRODUCT_DEFINING = [
  "getrocknet", "gemahlen", "geräuchert", "gesalzen", "ungesalzen", "frisch",
  "tiefgekühlt", "gefroren", "gekocht", "roh", "eingelegt", "kandiert",
];

const PREP_SET = new Set(PREP_WORDS);

function isPrepWord(word: string): boolean {
  const lower = word.toLowerCase().replace(/[,;]$/, "");
  if (PRODUCT_DEFINING.some((p) => lower.startsWith(p))) return false;
  return PREP_SET.has(lower);
}

export function parseIngredient(
  rawText: string,
  groupLabel: string | null = null,
): ParsedIngredient {
  const result: ParsedIngredient = {
    rawText: rawText.trim(),
    amount: null,
    amountMax: null,
    unitCode: null,
    name: "",
    note: null,
    toTaste: false,
    confidence: 0,
    groupLabel,
  };

  let working = rawText.replace(BULLETS, "").replace(/\s+/g, " ").trim();
  if (!working) return result;

  const notes: string[] = [];

  // 1. Pluralmarker direkt am Wort entfernen: „Zwiebel(n)" → „Zwiebel".
  //    Muss vor der Klammer-Auswertung laufen, sonst landet „n" als Notiz.
  working = working.replace(
    /([A-Za-zÄÖÜäöüß])\((?:n|e|en|s|er|nen|innen)\)/g,
    "$1",
  );

  // Dieselbe Sache mit Schrägstrich: „Zehe/n", „Dose/n", „Paprikaschote/n".
  // Auf Chefkoch die häufigere Schreibweise von beiden. Nur echte
  // Pluralendungen werden abgeschnitten, damit „Salz/Pfeffer" heil bleibt.
  working = working.replace(
    /([A-Za-zÄÖÜäöüß])\/(?:n|e|en|s|er|nen|innen)\b/g,
    "$1",
  );

  // 2. Echte Klammerzusätze herausziehen: „(gewürfelte)", „(oder kalte Butter)".
  working = working
    .replace(/\(([^)]*)\)/g, (_match, inner: string) => {
      const text = inner.trim();
      if (text) notes.push(text);
      return " ";
    })
    .replace(/\s+/g, " ")
    .trim();

  // 3. „nach Geschmack" & Co. erkennen und die Markierung entfernen.
  for (const pattern of TO_TASTE_PATTERNS) {
    if (pattern.test(working)) {
      result.toTaste = true;
      working = working.replace(pattern, " ").replace(/\s+/g, " ").trim();
    }
  }

  working = expandVulgarFractions(working).replace(/\s+/g, " ").trim();
  working = working.replace(VAGUE_QUANTIFIERS, "").trim();

  // 4. Menge: erst Bereich („2-3", „2 bis 3"), dann Einzelwert.
  const rangeMatch = working.match(
    new RegExp(`^(${NUMBER_PATTERN})\\s*(?:-|–|—|bis)\\s*(${NUMBER_PATTERN})\\b`),
  );
  if (rangeMatch) {
    const low = parseAmount(rangeMatch[1]);
    const high = parseAmount(rangeMatch[2]);
    if (low && high) {
      result.amount = low;
      result.amountMax = high;
      working = working.slice(rangeMatch[0].length).trim();
    }
  }

  if (result.amount === null) {
    const single = working.match(new RegExp(`^(${NUMBER_PATTERN})\\b`));
    if (single) {
      const value = parseAmount(single[1]);
      if (value) {
        result.amount = value;
        working = working.slice(single[0].length).trim();
      }
    }
  }

  // 5. Einheit: von der längsten Mehrwort-Schreibweise zur kürzesten.
  const words = working.split(" ").filter(Boolean);
  for (let take = Math.min(MAX_UNIT_WORDS, words.length); take >= 1; take--) {
    const unit = findUnit(words.slice(0, take).join(" "));
    if (unit) {
      result.unitCode = unit.code;
      working = words.slice(take).join(" ");
      break;
    }
  }

  // Menge ohne Einheit heißt Stückzahl — „2 Zwiebeln" sind 2 Stück.
  if (result.amount !== null && result.unitCode === null) {
    result.unitCode = IMPLICIT_COUNT_UNIT;
  }

  // 6. Vorbereitungswörter in die Notiz verschieben (vorne und hinten).
  const nameWords = working.split(" ").filter(Boolean);
  while (nameWords.length > 1 && isPrepWord(nameWords[0])) {
    notes.push(nameWords.shift()!.replace(/[,;]$/, ""));
  }
  while (nameWords.length > 1 && isPrepWord(nameWords[nameWords.length - 1])) {
    notes.push(nameWords.pop()!.replace(/[,;]$/, ""));
  }

  result.name = nameWords
    .join(" ")
    .replace(/^[,;:\s]+|[,;:\s]+$/g, "")
    .trim();
  result.note = notes.length ? notes.join(", ") : null;
  result.confidence = scoreConfidence(result);
  return result;
}

/**
 * Zerlegt die Freitext-Eingabe im „Etwas ergänzen"-Feld der Einkaufsliste.
 *
 * Anders als {@link parseIngredient} steht die Menge hier am Ende, nicht am
 * Anfang: „Erdbeeren 3", „Schmand 150 ml", „Tomaten 500g" — mit und ohne
 * Leerzeichen zwischen Zahl und Einheit. Der faule Quantifizierer vor dem
 * Zahlenmuster sorgt dafür, dass bei mehreren Zahlen im Text (z. B. einer
 * Zahl im Produktnamen) die *letzte* als Menge gilt, weil das Muster ohnehin
 * bis zum Zeilenende passen muss.
 *
 * Erkennt der Rest hinter der Zahl keine bekannte Einheit, gilt die ganze
 * Eingabe als Name — lieber unverändert übernehmen als eine Zahl mitten im
 * Produktnamen falsch abtrennen.
 */
const QUICK_ADD_PATTERN = new RegExp(
  `^(.*?)\\s*(${NUMBER_PATTERN})\\s*([A-Za-zÄÖÜäöüß]+)?$`,
);

export function parseQuickAdd(rawText: string): {
  name: string;
  amount: string | null;
  unitCode: string | null;
} {
  const trimmed = rawText.replace(/\s+/g, " ").trim();
  const fallback = { name: trimmed, amount: null, unitCode: null };
  if (!trimmed) return fallback;

  const match = trimmed.match(QUICK_ADD_PATTERN);
  if (!match) return fallback;

  const [, namePart, amountPart, unitPart] = match;
  const amount = parseAmount(amountPart);
  if (amount === null) return fallback;

  let unitCode: string | null = null;
  if (unitPart) {
    const unit = findUnit(unitPart);
    // Unbekanntes Wort hinter der Zahl ist keine Einheit — dann eher gar
    // nicht parsen, als der Zahl fälschlich eine Einheit anzudichten.
    if (!unit) return fallback;
    unitCode = unit.code;
  }

  const name = namePart.trim();
  if (!name) return fallback;

  return { name, amount, unitCode };
}

/**
 * Wie sicher ist das Ergebnis? Unter 0.8 markiert der Prüf-Screen die Zeile.
 * Lieber eine Zeile zu viel markieren als eine falsche Menge durchlassen.
 */
function scoreConfidence(parsed: ParsedIngredient): number {
  if (!parsed.name) return 0;
  // Ein Name, der mit einer Zahl anfängt, heißt: die Menge wurde nicht erkannt.
  if (/^\d/.test(parsed.name)) return 0.3;
  // Doppelpunkt deutet auf eine Überschrift, die als Zutat gelesen wurde.
  if (parsed.name.includes(":")) return 0.3;
  if (parsed.name.length > 60) return 0.4;

  if (parsed.amount !== null) {
    // Gewicht/Volumen mit Einheit ist der eindeutige Normalfall.
    return parsed.unitCode === IMPLICIT_COUNT_UNIT ? 0.9 : 1;
  }
  // Bewusst mengenlos („Salz und Pfeffer", „etwas Öl") — das ist kein Fehler.
  return parsed.toTaste ? 0.9 : 0.85;
}
