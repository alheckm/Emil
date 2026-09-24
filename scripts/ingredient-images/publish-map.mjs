/**
 * Schreibt src/lib/core/ingredientImages.ts aus dem, was tatsaechlich unter
 * public/zutaten-marktregal/ liegt: `ingredientImage()` zeigt auf die
 * -bold-Variante (Kreis-Foto in der Einkaufsliste). vollbild/grau liegen mit
 * bereit, sobald die Kachel-Oberflaeche sie braucht.
 *
 * Deckt jeden Namen aus subjects.mjs SUBJECTS ab, dazu jeden Alias-Quellnamen
 * aus aliases.json (z. B. "Gemüsebrühepulver" -> Bilder von "Gemüsebrühe") —
 * nur wenn fuer das aufgeloeste Ziel tatsaechlich eine -bold.webp existiert.
 *
 *    node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON \
 *      --experimental-strip-types scripts/ingredient-images/publish-map.mjs
 */

import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { SUBJECTS } from "./subjects.mjs";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const PUBLIC_DIR = ROOT + "public/zutaten-marktregal/";
const MAP_FILE = ROOT + "src/lib/core/ingredientImages.ts";

const UMLAUTS = { ä: "ae", ö: "oe", ü: "ue", ß: "ss", é: "e", è: "e", ê: "e" };
function slugify(name) {
  let out = name.toLowerCase();
  for (const [k, v] of Object.entries(UMLAUTS)) out = out.replaceAll(k, v);
  return out.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

const aliasFile = JSON.parse(readFileSync(ROOT + "scripts/ingredient-images/aliases.json", "utf8"));
const aliases = aliasFile.aliases ?? {};

let published;
try {
  published = new Set(readdirSync(PUBLIC_DIR));
} catch {
  published = new Set();
}

const names = new Set([...Object.keys(SUBJECTS), ...Object.keys(aliases)]);
const entries = [];
for (const name of [...names].sort((a, b) => a.localeCompare(b, "de"))) {
  const target = aliases[name] ?? name;
  const slug = slugify(target);
  if (published.has(`${slug}-bold.webp`)) entries.push([name, slug]);
}

const body = entries
  .map(([n, s]) => `  ${JSON.stringify(n)}: "${s}",`)
  .join("\n");

writeFileSync(
  MAP_FILE,
  "// Erzeugt von scripts/ingredient-images/publish-map.mjs — nicht von Hand aendern.\n" +
    "// Zutatenname -> Slug unter /zutaten-marktregal/<slug>-bold.webp\n\n" +
    "export const INGREDIENT_IMAGES: Record<string, string> = {\n" +
    `${body}\n` +
    "};\n\n" +
    "export function ingredientImage(name: string): string | null {\n" +
    "  const slug = INGREDIENT_IMAGES[name];\n" +
    "  return slug ? `/zutaten-marktregal/${slug}-bold.webp` : null;\n" +
    "}\n",
  "utf8",
);

console.log(`${entries.length} Zutaten -> ${MAP_FILE.replace(ROOT, "")}`);
