/**
 * Erzeugt supabase/seed/0001_units.sql aus src/lib/core/units.ts.
 *
 * Die Einheiten stehen an zwei Orten: in der Kernlogik (rechnet damit) und in
 * der Datenbank (Fremdschlüssel auf recipe_ingredients.unit_code). Von Hand
 * gepflegt würden die beiden auseinanderlaufen, und dann schlägt ein Import mit
 * einer völlig unverständlichen Fremdschlüsselmeldung fehl. Also generiert.
 *
 * Aufruf: npm run seed:units
 */
import { writeFileSync } from "node:fs";
import { UNITS } from "../src/lib/core/units.ts";

const rows = UNITS.map(
  (u) =>
    `  (${sql(u.code)}, ${sql(u.display)}, ${sql(u.dimension)}, ${u.baseFactor})`,
).join(",\n");

function sql(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

const out = `-- AUTOMATISCH ERZEUGT von scripts/generate-units-seed.mjs
-- Nicht von Hand bearbeiten: Quelle ist src/lib/core/units.ts.
-- Neu erzeugen mit: npm run seed:units

insert into units (code, display, dimension, base_factor) values
${rows}
on conflict (code) do update
  set display = excluded.display,
      dimension = excluded.dimension,
      base_factor = excluded.base_factor;
`;

writeFileSync("supabase/seed/0001_units.sql", out);
console.log(`${UNITS.length} Einheiten nach supabase/seed/0001_units.sql geschrieben`);
