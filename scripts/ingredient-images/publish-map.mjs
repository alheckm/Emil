/**
 * Setzt `ingredients.image_slug` aus dem, was tatsaechlich unter
 * public/zutaten-marktregal/ liegt: die App zeigt die -bold-Variante als
 * Kreis-Foto in der Einkaufsliste. vollbild/grau liegen mit bereit, sobald die
 * Kachel-Oberflaeche sie braucht.
 *
 * Deckt jeden Namen aus subjects.mjs SUBJECTS ab, dazu jeden Alias-Quellnamen
 * aus aliases.json (z. B. "Gemüsebrühepulver" -> Bilder von "Gemüsebrühe") —
 * nur wenn fuer das aufgeloeste Ziel tatsaechlich eine -bold.webp existiert.
 * Zutaten werden ueber ihre Grundform gefunden ("Wacholderbeere" trifft auch
 * "Wacholderbeeren"), Gross-/Kleinschreibung zaehlt nicht. Ein vorhandener
 * Slug wird nicht ueberschrieben. Schreibt mit dem Service-Key aus .env.local.
 *
 *    node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON \
 *      --experimental-strip-types scripts/ingredient-images/publish-map.mjs [--dry]
 */

import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { SUBJECTS } from "./subjects.mjs";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const PUBLIC_DIR = ROOT + "public/zutaten-marktregal/";
const DRY = process.argv.includes("--dry");

function loadEnv(file) {
  const env = {};
  for (const line of readFileSync(file, "utf8").split("\n")) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].trim();
  }
  return env;
}

// Wie singular_key() in supabase/migrations/0029: Umlaute auf, dann ein
// angehaengtes "n", dann ein "e" weg; unter fuenf Buchstaben unveraendert.
function singularKey(name) {
  const t = name
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
    .replace(/ä/g, "a")
    .replace(/ö/g, "o")
    .replace(/ü/g, "u")
    .replace(/ß/g, "s");
  return t.length >= 5 ? t.replace(/n$/, "").replace(/e$/, "") : t;
}

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


const env = loadEnv(ROOT + ".env.local");
const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SECRET_KEY,
  { auth: { persistSession: false } },
);

const { data: zutaten, error } = await supabase
  .from("ingredients")
  .select("id, display_name, image_slug");
if (error) throw new Error(error.message);

const slugByKey = new Map(entries.map(([name, slug]) => [singularKey(name), slug]));
const updates = zutaten.filter((z) => !z.image_slug && slugByKey.has(singularKey(z.display_name)));

console.log(`${entries.length} Zutaten mit Bild, ${updates.length} Zeilen bekommen einen Slug${DRY ? " (Trockenlauf)" : ""}.`);
for (const z of updates) {
  const slug = slugByKey.get(singularKey(z.display_name));
  console.log(`  ${z.display_name} -> ${slug}`);
  if (DRY) continue;
  const { error: updateError } = await supabase
    .from("ingredients")
    .update({ image_slug: slug })
    .eq("id", z.id);
  if (updateError) throw new Error(updateError.message);
}
