/**
 * Fügt Migrationen und Seeds in der richtigen Reihenfolge zu supabase/setup.sql
 * zusammen — damit im Supabase-SQL-Editor ein einziges Einfügen genügt statt
 * acht einzelner, bei denen man eine vergessen oder vertauschen kann.
 *
 * Erzeugt, nicht gepflegt: Quelle sind die Dateien in migrations/ und seed/.
 */
import { readFileSync, readdirSync, writeFileSync } from "node:fs";

const parts = [];
const add = (dir) => {
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()) {
    parts.push(
      `-- ===================================================================\n` +
        `-- ${dir}/${file}\n` +
        `-- ===================================================================\n\n` +
        readFileSync(`${dir}/${file}`, "utf8").trimEnd(),
    );
  }
};
add("supabase/migrations");
add("supabase/seed");

writeFileSync(
  "supabase/setup.sql",
  `-- AUTOMATISCH ERZEUGT von scripts/build-setup-sql.mjs — nicht bearbeiten.\n` +
    `-- Neu erzeugen mit: npm run sql\n--\n` +
    `-- Einmalig im Supabase-SQL-Editor ausführen (Region Frankfurt).\n` +
    `-- Läuft als eine Transaktion: entweder steht danach alles, oder nichts.\n\n` +
    `begin;\n\n${parts.join("\n\n")}\n\ncommit;\n`,
);
console.log(`supabase/setup.sql geschrieben (${parts.length} Dateien)`);
