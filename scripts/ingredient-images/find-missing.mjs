/**
 * Gleicht die echten Zutaten aus der Datenbank gegen die vorhandenen Bilder ab.
 *
 * Anders als process.py, das nur verarbeitet, was schon als Rohbild vorliegt:
 * hier zaehlt, was tatsaechlich in der `ingredients`-Tabelle liegt — also
 * auch alles, was beim Einfuegen eines Rezepts neu entstanden ist (z. B.
 * "Berglinsen"), fuer die process.py sonst nie ein Bild erzeugen wuerde.
 *
 * Zwei Modi (--scope):
 *   all   (Default) — jede Zutat, die es je gab (globaler Seed + haushalts-
 *          eigene). Fuer einen vollstaendigen Bestandsabgleich.
 *   used  — nur Zutaten, die JETZT in einem Rezept oder auf der Einkaufsliste
 *          stehen. Das ist der laufende Betrieb: Bilder entstehen nicht auf
 *          Vorrat fuer alle 350+ moeglichen Zutaten, sondern erst, wenn eine
 *          Zutat tatsaechlich gebraucht wird.
 *
 * Mit --generate wird fuer die fehlenden (und mit einem Bildmotiv versehenen)
 * Zutaten direkt generate.py + process.py angestossen — der volle Weg von
 * "was fehlt" bis "Bild liegt unter public/zutaten".
 *
 * Braucht SUPABASE_SECRET_KEY (umgeht RLS, sonst saehe man nur Zutaten des
 * eigenen Haushalts) aus .env.local.
 *
 *    node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON \
 *      --experimental-strip-types scripts/ingredient-images/find-missing.mjs \
 *      [--scope=all|used] [--generate]
 */

import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { SUBJECTS } from "./subjects.mjs";
import { INGREDIENT_IMAGES } from "../../src/lib/core/ingredientImages.ts";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const args = process.argv.slice(2);
const scope = args.includes("--scope=used") ? "used" : "all";
const shouldGenerate = args.includes("--generate");

function loadEnv(path) {
  const env = {};
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].trim();
  }
  return env;
}

const env = loadEnv(ROOT + ".env.local");
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SECRET_KEY;
if (!url || !key) {
  console.error("NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SECRET_KEY fehlen in .env.local");
  process.exit(1);
}

const supabase = createClient(url, key);

/** Jede Zutat, die es je gab — globaler Seed + haushaltseigene. */
async function allIngredientNames() {
  const { data, error } = await supabase.from("ingredients").select("display_name");
  if (error) throw error;
  return [...new Set(data.map((r) => r.display_name))];
}

/** Nur Zutaten, die JETZT in einem Rezept oder auf der Einkaufsliste stehen. */
async function usedIngredientNames() {
  const [{ data: fromRecipes, error: e1 }, { data: fromList, error: e2 }] = await Promise.all([
    supabase.from("recipe_ingredients").select("ingredient_id").not("ingredient_id", "is", null),
    supabase.from("shopping_list_entries").select("ingredient_id"),
  ]);
  if (e1) throw e1;
  if (e2) throw e2;

  const ids = [...new Set([...fromRecipes, ...fromList].map((r) => r.ingredient_id))];
  if (ids.length === 0) return [];

  const { data: named, error: e3 } = await supabase
    .from("ingredients")
    .select("display_name")
    .in("id", ids);
  if (e3) throw e3;
  return [...new Set(named.map((r) => r.display_name))];
}

const names = (scope === "used" ? await usedIngredientNames() : await allIngredientNames()).sort(
  (a, b) => a.localeCompare(b, "de"),
);

const existingFiles = new Set(readdirSync(ROOT + "public/zutaten"));

const missing = names.filter((name) => {
  const slug = INGREDIENT_IMAGES[name];
  return !(slug && existingFiles.has(`${slug}.webp`));
});

const withSubject = missing.filter((n) => SUBJECTS[n]);
const withoutSubject = missing.filter((n) => !SUBJECTS[n]);

const scopeLabel = scope === "used" ? "aktuell in Rezept/Liste verwendet" : "in der Datenbank";
console.log(`${names.length} Zutaten ${scopeLabel}, ${missing.length} ohne Bild\n`);

if (withSubject.length) {
  console.log(`Bereit zum Generieren — Bildmotiv vorhanden (${withSubject.length}):`);
  for (const n of withSubject) console.log(`  - ${n}`);
}

if (withoutSubject.length) {
  console.log(
    `\nBrauchen zuerst ein Bildmotiv in subjects.mjs, bevor generate.py sie erzeugen kann (${withoutSubject.length}):`,
  );
  for (const n of withoutSubject) console.log(`  - ${n}`);
}

if (!missing.length) {
  console.log("Alle Zutaten haben ein Bild.");
}

if (shouldGenerate && withSubject.length) {
  const PY = `${process.env.HOME}/.mflux/venv/bin/python`;
  console.log(`\nGeneriere ${withSubject.length} Bild(er) …\n`);
  execFileSync(PY, [ROOT + "scripts/ingredient-images/generate.py", "--names", withSubject.join(",")], {
    stdio: "inherit",
  });
  execFileSync(PY, [ROOT + "scripts/ingredient-images/process.py"], { stdio: "inherit" });
} else if (shouldGenerate && !withSubject.length) {
  console.log("\nNichts zu generieren — keine fehlende Zutat hat ein Bildmotiv.");
}
