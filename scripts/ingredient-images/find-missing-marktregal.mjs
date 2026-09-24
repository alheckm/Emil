/**
 * Gleicht die "durably used" Zutaten der Datenbank gegen die vorhandenen
 * Marktregal-Assets (public/zutaten-marktregal/) ab — der Produktions-
 * Einstieg des zutatenbilder-Skills (`npm run zutatenbilder`).
 *
 * `--generate`: ruft nach dem Abgleich automatisch generate-marktregal.py
 * fuer alle Zutaten mit vorhandenem Bildmotiv auf (vollbild/grau/bold, die
 * App nutzt aktuell nur -bold) und schreibt danach publish-map.mjs neu, damit
 * ingredientImage() die frischen Bilder sofort findet. Zutaten ohne Bildmotiv
 * ("braucht Agenten-Entscheidung") werden dabei NICHT generiert — die
 * Alias/Skip/Neues-Motiv-Entscheidung bleibt Aufgabe des Agenten, der den
 * Skill ausfuehrt (siehe SKILL.md), das laesst sich nicht skripten.
 *
 * Scope: "durably used", nicht bloss "aktuell in Rezept/Liste". Grund:
 * `set_entry_checked` (supabase/migrations/0016_abgehaktes_begrenzen.sql)
 * loescht abgehakte shopping_list_entries-Zeilen, sobald mehr als 20 pro
 * Liste abgehakt sind — eine nur-von-Hand hinzugefuegte Zutat kann so aus
 * der Liste verschwinden, bevor ein Generierungs-Lauf sie je sieht. Die
 * `ingredients`-Tabelle selbst wird davon NICHT beruehrt: resolve_ingredient
 * legt dort beim ersten Gebrauch dauerhaft eine Zeile an (household_id
 * gesetzt), die nie durch das Abhaken-Aufraeumen verschwindet. Scope ist
 * deshalb: jede Zutat mit gesetzter household_id (= irgendwann tatsaechlich
 * gebraucht) UNION alles, was JETZT in Rezept oder Liste steht (deckt
 * aktive globale Seed-Zutaten ab, die keine household_id haben). Die reinen
 * ~350 Seed-Zutaten, die nie ein Haushalt angefasst hat, bleiben aussen vor
 * — kein Vorrats-Rendering auf Vorrat.
 *
 * Alias/Skip-Entscheidungen stehen in aliases.json (siehe dort) — das ist
 * Aufgabe des Agenten (zutatenbilder-Skill, Modus 3), nicht dieses Skripts:
 * dieses Skript listet nur, was noch offen ist.
 *
 *    node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON \
 *      --experimental-strip-types scripts/ingredient-images/find-missing-marktregal.mjs
 */

import { readFileSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";
import { SUBJECTS } from "./subjects.mjs";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));

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

const UMLAUTS = { ä: "ae", ö: "oe", ü: "ue", ß: "ss", é: "e", è: "e", ê: "e" };
function slugify(name) {
  let out = name.toLowerCase();
  for (const [k, v] of Object.entries(UMLAUTS)) out = out.replaceAll(k, v);
  return out.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

async function currentlyUsedNames() {
  const [{ data: fromRecipes, error: e1 }, { data: fromList, error: e2 }] = await Promise.all([
    supabase.from("recipe_ingredients").select("ingredient_id").not("ingredient_id", "is", null),
    supabase.from("shopping_list_entries").select("ingredient_id"),
  ]);
  if (e1) throw e1;
  if (e2) throw e2;
  const ids = [...new Set([...fromRecipes, ...fromList].map((r) => r.ingredient_id))];
  if (ids.length === 0) return [];
  const { data, error } = await supabase.from("ingredients").select("display_name").in("id", ids);
  if (error) throw error;
  return data.map((r) => r.display_name);
}

async function householdOwnNames() {
  const { data, error } = await supabase
    .from("ingredients")
    .select("display_name")
    .not("household_id", "is", null);
  if (error) throw error;
  return data.map((r) => r.display_name);
}

const [current, householdOwn] = await Promise.all([currentlyUsedNames(), householdOwnNames()]);
const names = [...new Set([...current, ...householdOwn])].sort((a, b) => a.localeCompare(b, "de"));

const aliasFile = JSON.parse(readFileSync(ROOT + "scripts/ingredient-images/aliases.json", "utf8"));
const aliases = aliasFile.aliases ?? {};
const skipped = new Set(Object.keys(aliasFile.skipped ?? {}));

let publicFiles;
try {
  publicFiles = new Set(readdirSync(ROOT + "public/zutaten-marktregal"));
} catch {
  publicFiles = new Set();
}

function hasAllVariants(name) {
  const slug = slugify(name);
  return ["vollbild", "grau", "bold"].every((v) => publicFiles.has(`${slug}-${v}.webp`));
}

const missing = names.filter((name) => {
  if (skipped.has(name)) return false;
  const target = aliases[name] ?? name;
  return !hasAllVariants(target);
});

const withSubject = missing.filter((n) => SUBJECTS[aliases[n] ?? n]);
const withoutSubject = missing.filter((n) => !SUBJECTS[aliases[n] ?? n]);

console.log(`${names.length} Zutaten durably used, ${missing.length} ohne vollstaendige Marktregal-Assets\n`);

if (withSubject.length) {
  console.log(`Bereit zum Generieren — Bildmotiv vorhanden (${withSubject.length}):`);
  for (const n of withSubject) console.log(`  - ${n}`);
}

if (withoutSubject.length) {
  console.log(
    `\nBrauchen zuerst eine Agenten-Entscheidung — Alias, Skip, oder neues Motiv in subjects.mjs (${withoutSubject.length}):`,
  );
  for (const n of withoutSubject) console.log(`  - ${n}`);
}

if (!missing.length) {
  console.log("Alle durably-used Zutaten haben vollstaendige Marktregal-Assets.");
}

if (process.argv.includes("--generate") && withSubject.length) {
  console.log(`\ngeneriere ${withSubject.length} Zutat(en) …`);
  const python = homedir() + "/.mflux/venv/bin/python";
  const names = withSubject.map((n) => aliases[n] ?? n).join(",");
  const run = spawnSync(python, ["generate-marktregal.py", "--names", names], {
    cwd: ROOT + "scripts/ingredient-images",
    stdio: "inherit",
  });
  if (run.status !== 0) {
    console.error("\ngenerate-marktregal.py fehlgeschlagen");
    process.exit(run.status ?? 1);
  }
  const map = spawnSync(
    "node",
    ["--disable-warning=MODULE_TYPELESS_PACKAGE_JSON", "--experimental-strip-types", "publish-map.mjs"],
    { cwd: ROOT + "scripts/ingredient-images", stdio: "inherit" },
  );
  if (map.status !== 0) process.exit(map.status ?? 1);

  const rel = "src/lib/core/ingredientImages.ts";
  spawnSync("git", ["add", "--", rel], { cwd: ROOT });
  const staged = spawnSync("git", ["diff", "--cached", "--name-only", "--", rel], { cwd: ROOT });
  if (staged.stdout.toString().trim()) {
    spawnSync("git", ["commit", "-m", "ingredientImages.ts: neue Marktregal-Bilder aufgenommen", "--", rel], {
      cwd: ROOT,
      stdio: "inherit",
    });
    spawnSync("git", ["push"], { cwd: ROOT, stdio: "inherit" });
  }
}
