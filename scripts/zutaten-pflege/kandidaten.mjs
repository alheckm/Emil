/**
 * Pflegebedarf bei Zutaten — nur lesen, schreibt nichts.
 *
 * Listet eigene Zutaten des Haushalts, die Aufmerksamkeit brauchen:
 *   dublette   gleiche Grundform wie eine andere Zutat (Stamm oder eigene)
 *   zahl       Zahl im Namen ("300 g Lauch") — meist ein Importfehler
 *   sonstiges  liegt noch in "Sonstiges"
 *   ohne-bild  kein image_slug, wird aber genutzt (Liste oder Rezept)
 *   klein      beginnt mit Kleinbuchstaben
 *
 *    node scripts/zutaten-pflege/kandidaten.mjs [--json]
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const env = {};
for (const line of readFileSync(ROOT + ".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim();
}
const householdId = env.PFLEGE_HOUSEHOLD_ID;
if (!householdId) throw new Error("PFLEGE_HOUSEHOLD_ID fehlt in .env.local");

// Wie singular_key() in supabase/migrations/0029.
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

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
  auth: { persistSession: false },
});

const [zutaten, entries, rezeptZeilen] = await Promise.all([
  supabase
    .from("ingredients")
    .select("id, display_name, name_norm, category_id, image_slug, household_id")
    .or(`household_id.is.null,household_id.eq.${householdId}`),
  supabase.from("shopping_list_entries").select("ingredient_id"),
  supabase.from("recipe_ingredients").select("ingredient_id"),
]);
for (const r of [zutaten, entries, rezeptZeilen]) if (r.error) throw new Error(r.error.message);

const genutzt = new Set(
  [...entries.data, ...rezeptZeilen.data].map((r) => r.ingredient_id).filter(Boolean),
);
const nachKey = new Map();
for (const z of zutaten.data) {
  const key = singularKey(z.name_norm);
  nachKey.set(key, [...(nachKey.get(key) ?? []), z]);
}

const kandidaten = [];
for (const z of zutaten.data.filter((x) => x.household_id)) {
  const gruende = [];
  const gleich = (nachKey.get(singularKey(z.name_norm)) ?? []).filter((x) => x.id !== z.id);
  if (gleich.length) gruende.push(`dublette:${gleich.map((x) => x.display_name).join("|")}`);
  if (/\d/.test(z.display_name)) gruende.push("zahl");
  if (z.category_id === "sonstiges") gruende.push("sonstiges");
  if (!z.image_slug && genutzt.has(z.id)) gruende.push("ohne-bild");
  if (/^[a-zäöü]/.test(z.display_name)) gruende.push("klein");
  if (gruende.length) {
    kandidaten.push({ id: z.id, name: z.display_name, kategorie: z.category_id, gruende });
  }
}

if (process.argv.includes("--json")) {
  console.log(JSON.stringify(kandidaten, null, 2));
} else {
  console.log(`${kandidaten.length} eigene Zutaten brauchen Pflege (von ${zutaten.data.filter((x) => x.household_id).length}).`);
  for (const k of kandidaten) console.log(`  ${k.name} [${k.kategorie}] — ${k.gruende.join(", ")}`);
}
