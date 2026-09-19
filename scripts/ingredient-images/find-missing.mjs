/**
 * Gleicht die echten Zutaten aus der Datenbank gegen die vorhandenen Bilder ab.
 *
 * Anders als process.py, das nur die feste Liste aus ingredient-seed-data.mjs
 * kennt: hier zaehlt, was tatsaechlich in der `ingredients`-Tabelle liegt —
 * also auch alles, was beim Einfuegen eines Rezepts neu entstanden ist
 * (z. B. "Berglinsen"), fuer die process.py nie ein Bild erzeugen wuerde.
 *
 * Braucht SUPABASE_SECRET_KEY (umgeht RLS, sonst saehe man nur Zutaten des
 * eigenen Haushalts) aus .env.local.
 *
 *    node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON \
 *      --experimental-strip-types scripts/ingredient-images/find-missing.mjs
 */

import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { SUBJECTS } from "./subjects.mjs";
import { INGREDIENT_IMAGES } from "../../src/lib/core/ingredientImages.ts";

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

const { data, error } = await supabase.from("ingredients").select("display_name");
if (error) throw error;

const names = [...new Set(data.map((r) => r.display_name))].sort((a, b) =>
  a.localeCompare(b, "de"),
);

const existingFiles = new Set(readdirSync(ROOT + "public/zutaten"));

const missing = names.filter((name) => {
  const slug = INGREDIENT_IMAGES[name];
  return !(slug && existingFiles.has(`${slug}.webp`));
});

const withSubject = missing.filter((n) => SUBJECTS[n]);
const withoutSubject = missing.filter((n) => !SUBJECTS[n]);

console.log(`${names.length} Zutaten in der Datenbank, ${missing.length} ohne Bild\n`);

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
  console.log("Alle Zutaten aus der Datenbank haben ein Bild.");
}
