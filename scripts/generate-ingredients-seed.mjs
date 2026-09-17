/**
 * Erzeugt supabase/seed/0002_stammdaten.sql.
 *
 * Bricht ab, wenn eine Zutat doppelt vorkommt: auf ingredients liegt ein
 * eindeutiger Index über name_norm für globale Einträge, und ein Duplikat
 * würde den Seed erst beim Einspielen mit einer kryptischen Meldung stoppen.
 */
import { writeFileSync } from "node:fs";
import { CATEGORIES, INGREDIENTS } from "./ingredient-seed-data.mjs";

const sql = (v) => `'${String(v).replace(/'/g, "''")}'`;
const norm = (v) => v.toLowerCase().replace(/\s+/g, " ").trim();

const seen = new Map();
const rows = [];
for (const [categoryId, names] of Object.entries(INGREDIENTS)) {
  if (!CATEGORIES.some((c) => c.id === categoryId)) {
    throw new Error(`Unbekannte Abteilung: ${categoryId}`);
  }
  for (const name of names) {
    const key = norm(name);
    if (seen.has(key)) {
      throw new Error(
        `Zutat doppelt: „${name}" steht in ${seen.get(key)} und ${categoryId}`,
      );
    }
    seen.set(key, categoryId);
    rows.push(`  (${sql(name)}, ${sql(categoryId)})`);
  }
}

const out = `-- AUTOMATISCH ERZEUGT von scripts/generate-ingredients-seed.mjs
-- Nicht von Hand bearbeiten: Quelle ist scripts/ingredient-seed-data.mjs.
-- Neu erzeugen mit: npm run seed:stammdaten

insert into categories (id, name, sort_order) values
${CATEGORIES.map((c) => `  (${sql(c.id)}, ${sql(c.name)}, ${c.sortOrder})`).join(",\n")}
on conflict (id) do update
  set name = excluded.name, sort_order = excluded.sort_order;

-- name_norm entsteht über die Funktion der Datenbank selbst, damit sie nicht von
-- der TypeScript-Seite abweichen kann.
insert into ingredients (household_id, name_norm, display_name, category_id)
select null, normalize_ingredient_name(t.name), t.name, t.category_id
from (values
${rows.join(",\n")}
) as t (name, category_id)
on conflict (name_norm) where household_id is null do update
  set category_id = excluded.category_id,
      display_name = excluded.display_name;
`;

writeFileSync("supabase/seed/0002_stammdaten.sql", out);
console.log(
  `${CATEGORIES.length} Abteilungen und ${rows.length} Zutaten nach ` +
    `supabase/seed/0002_stammdaten.sql geschrieben`,
);
