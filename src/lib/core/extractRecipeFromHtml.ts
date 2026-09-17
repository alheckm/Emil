import { parseIngredient } from "./parseIngredient";
import type { ParsedIngredient, ParsedRecipe } from "./types";

/**
 * Zieht ein Rezept aus dem HTML einer Webseite.
 *
 * Hauptweg ist schema.org/Recipe als JSON-LD. Das wurde vor dem Bauen an
 * chefkoch.de geprüft: dort steckt das Rezept in einem `@graph`-Array mit
 * vollständigen Zutaten, `recipeYield: ['4','4 Portionen']` und der Anleitung
 * als `HowToSection`. Die meisten deutschen Rezeptseiten machen es genauso.
 *
 * Bewusst pur gehalten (kein DOM, kein fetch): das Laden der Seite macht
 * src/lib/server/fetchPage.ts. So bleibt die Extraktion testbar und auch für
 * eine spätere native App nutzbar.
 */

export interface ExtractResult {
  recipe: ExtractedRecipe;
  /** Woher die Daten kamen — die Oberfläche warnt bei "microdata". */
  source: "json-ld" | "microdata";
}

const SCRIPT_BLOCK =
  /<script[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;

/** Nur die Entities, die in HTML-escaptem JSON-LD wirklich vorkommen. */
function unescapeHtml(text: string): string {
  return text
    .replace(/&quot;/g, '"')
    .replace(/&#34;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");
}

function hasType(node: unknown, type: string): boolean {
  if (typeof node !== "object" || node === null) return false;
  const raw = (node as Record<string, unknown>)["@type"];
  if (typeof raw === "string") return raw === type;
  if (Array.isArray(raw)) return raw.includes(type);
  return false;
}

/** Läuft durch alles, was in einem JSON-LD-Dokument stecken kann. */
function findRecipeNode(data: unknown): Record<string, unknown> | null {
  if (Array.isArray(data)) {
    for (const item of data) {
      const found = findRecipeNode(item);
      if (found) return found;
    }
    return null;
  }
  if (typeof data !== "object" || data === null) return null;

  if (hasType(data, "Recipe")) return data as Record<string, unknown>;

  // Chefkoch & Co. packen alles in @graph; andere nutzen mainEntity.
  for (const key of ["@graph", "mainEntity", "mainEntityOfPage", "itemListElement"]) {
    const nested = (data as Record<string, unknown>)[key];
    if (nested !== undefined) {
      const found = findRecipeNode(nested);
      if (found) return found;
    }
  }
  return null;
}

function asStringArray(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string");
}

/** `recipeYield` kommt als "4", "4 Portionen" oder ['4','4 Portionen']. */
export function parseYield(value: unknown): {
  servings: number | null;
  label: string | null;
} {
  const candidates = Array.isArray(value) ? value : [value];
  let servings: number | null = null;
  let label: string | null = null;

  for (const candidate of candidates) {
    const text = typeof candidate === "number" ? String(candidate) : candidate;
    if (typeof text !== "string") continue;
    const match = text.match(/(\d+)/);
    if (match && servings === null) servings = Number(match[1]);
    const word = text.match(/\d+\s*([A-Za-zÄÖÜäöüß]+)/);
    if (word && label === null) label = word[1];
  }

  return { servings, label };
}

/** ISO-8601-Dauer („PT1H30M") in Minuten. */
export function parseIsoDuration(value: unknown): number | null {
  if (typeof value !== "string") return null;
  const match = value.match(/^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return null;
  const [, days, hours, minutes] = match;
  const total =
    Number(days ?? 0) * 1440 + Number(hours ?? 0) * 60 + Number(minutes ?? 0);
  return total > 0 ? total : null;
}

/**
 * `recipeInstructions` ist das unordentlichste Feld im Standard: Freitext,
 * Liste von Strings, HowToStep-Objekte oder HowToSection mit verschachtelten
 * Schritten. Alle vier kommen in der Praxis vor.
 */
export function parseInstructions(value: unknown): string[] {
  const steps: string[] = [];

  const walk = (node: unknown): void => {
    if (typeof node === "string") {
      // Freitext mit Zeilenumbrüchen in einzelne Schritte zerlegen.
      for (const part of node.split(/\r?\n+/)) {
        const text = stripTags(part).trim();
        if (text) steps.push(text);
      }
      return;
    }
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    if (typeof node !== "object" || node === null) return;

    const record = node as Record<string, unknown>;
    if (record.itemListElement !== undefined) {
      walk(record.itemListElement);
      return;
    }
    if (typeof record.text === "string") {
      const text = stripTags(record.text).trim();
      if (text) steps.push(text);
      return;
    }
    if (typeof record.name === "string") {
      const text = stripTags(record.name).trim();
      if (text) steps.push(text);
    }
  };

  walk(value);
  return steps;
}

function stripTags(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Sammelt alle Knoten mit `@id` aus dem Dokument.
 *
 * JSON-LD darf innerhalb eines Dokuments per Verweis arbeiten, und Chefkoch tut
 * das: das Rezept enthält nur `image: {"@id": "…#primaryimage"}`, während das
 * ImageObject mit der eigentlichen URL als eigener Knoten im @graph steht. Ohne
 * Auflösung bliebe das Rezeptbild leer — geprüft an der echten Seite.
 */
function indexNodesById(data: unknown, index = new Map<string, Record<string, unknown>>()) {
  if (Array.isArray(data)) {
    for (const item of data) indexNodesById(item, index);
    return index;
  }
  if (typeof data !== "object" || data === null) return index;

  const record = data as Record<string, unknown>;
  const id = record["@id"];
  if (typeof id === "string") {
    // Der reichhaltigere Knoten gewinnt. Nötig, weil ein Verweis wie
    // `image: {"@id": "…#primaryimage"}` selbst ein Knoten mit dieser @id ist:
    // er wird beim Durchlauf zuerst gefunden und würde das echte ImageObject
    // verdecken, das später im @graph steht.
    const existing = index.get(id);
    if (!existing || Object.keys(existing).length < Object.keys(record).length) {
      index.set(id, record);
    }
  }
  for (const value of Object.values(record)) indexNodesById(value, index);
  return index;
}

function firstImage(
  value: unknown,
  index: Map<string, Record<string, unknown>>,
  depth = 0,
): string | null {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = firstImage(item, index, depth);
      if (found) return found;
    }
    return null;
  }
  if (typeof value === "object" && value !== null) {
    const record = value as Record<string, unknown>;
    const url = record.url ?? record.contentUrl;
    if (typeof url === "string") return url;

    // Verweis auflösen; die Tiefenbegrenzung verhindert eine Endlosschleife,
    // falls ein Dokument im Kreis verweist.
    const id = record["@id"];
    if (typeof id === "string" && depth < 3) {
      const target = index.get(id);
      if (target && target !== record) return firstImage(target, index, depth + 1);
    }
  }
  return null;
}

export interface ExtractedRecipe extends ParsedRecipe {
  imageUrl: string | null;
  totalTimeMin: number | null;
}

function recipeFromNode(
  node: Record<string, unknown>,
  index: Map<string, Record<string, unknown>>,
): ExtractedRecipe {
  const { servings, label } = parseYield(node.recipeYield);
  const ingredientLines = asStringArray(node.recipeIngredient);

  const ingredients: ParsedIngredient[] = ingredientLines
    .map((line) => stripTags(line))
    .filter(Boolean)
    .map((line) => parseIngredient(line));

  return {
    title: typeof node.name === "string" ? stripTags(node.name) : null,
    servings,
    servingsLabel: label,
    ingredients,
    instructions: parseInstructions(node.recipeInstructions),
    imageUrl: firstImage(node.image, index),
    totalTimeMin: totalTimeFrom(node),
  };
}

/** `totalTime`, sonst Vorbereitung plus Kochzeit — je nachdem, was dasteht. */
function totalTimeFrom(node: Record<string, unknown>): number | null {
  const total = parseIsoDuration(node.totalTime);
  if (total !== null) return total;
  const sum =
    (parseIsoDuration(node.prepTime) ?? 0) + (parseIsoDuration(node.cookTime) ?? 0);
  return sum > 0 ? sum : null;
}

/**
 * Notfallweg für Seiten ohne JSON-LD: Microdata-Attribute.
 *
 * Bewusst als einfache Regex-Suche und nicht als HTML-Parser — es ist ein
 * Auffangnetz, kein Hauptweg. Verschachtelte Elemente innerhalb einer
 * Zutatenzeile kann das nicht auflösen; das Ergebnis geht ohnehin in den
 * Prüf-Screen, wo du es siehst.
 */
export function extractMicrodataValues(html: string, prop: string): string[] {
  const pattern = new RegExp(
    `<([a-z0-9]+)[^>]*itemprop\\s*=\\s*["']${prop}["'][^>]*>([\\s\\S]*?)<\\/\\1>`,
    "gi",
  );
  const values: string[] = [];
  for (const match of html.matchAll(pattern)) {
    const text = stripTags(unescapeHtml(match[2])).trim();
    if (text) values.push(text);
  }
  return values;
}

export function extractRecipeFromHtml(html: string): ExtractResult | null {
  // 1. JSON-LD — der verlässliche Weg.
  for (const match of html.matchAll(SCRIPT_BLOCK)) {
    const raw = match[1].trim();
    if (!raw) continue;
    for (const candidate of [raw, unescapeHtml(raw)]) {
      try {
        const document = JSON.parse(candidate);
        const node = findRecipeNode(document);
        if (node) {
          return {
            recipe: recipeFromNode(node, indexNodesById(document)),
            source: "json-ld",
          };
        }
      } catch {
        // Eine kaputte oder fremde JSON-LD-Insel ist normal — weitersuchen.
      }
    }
  }

  // 2. Microdata als Auffangnetz.
  const lines = extractMicrodataValues(html, "recipeIngredient").concat(
    extractMicrodataValues(html, "ingredients"),
  );
  if (lines.length > 0) {
    const names = extractMicrodataValues(html, "name");
    const yields = extractMicrodataValues(html, "recipeYield");
    const { servings, label } = parseYield(yields);
    return {
      source: "microdata",
      recipe: {
        title: names[0] ?? null,
        servings,
        servingsLabel: label,
        ingredients: lines.map((line) => parseIngredient(line)),
        instructions: extractMicrodataValues(html, "recipeInstructions"),
        // Bild und Zeit liest der Notfallweg bewusst nicht: über Microdata
        // wären beide unzuverlässig, und im Prüf-Screen trägt man sie
        // schneller nach als man einem falschen Wert hinterherräumt.
        imageUrl: null,
        totalTimeMin: null,
      },
    };
  }

  return null;
}
