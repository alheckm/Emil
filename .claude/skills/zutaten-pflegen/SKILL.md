---
name: zutaten-pflegen
description: Zutaten aufräumen — Dubletten (Ein-/Mehrzahl, Schreibvarianten) in den
  Stamm überführen, Synonyme als Aliase ergänzen, Abteilung und Bild-Zuordnung
  korrigieren. Nur von Hand, am besten über `/emil-pflege zutaten`.
disable-model-invocation: true
---

# Zutaten pflegen

Urteilt über Zutaten und schlägt vor; geschrieben wird erst nach Freigabe des
Nutzers, und zwar als Migration in `supabase/migrations/` (nachvollziehbar, in
`setup.sql`). Dieser Skill schreibt nie direkt in die Datenbank.

## Hintergrund

- Eingabe → `resolve_ingredient` (Migration 0029): exakt → Alias → Grundform
  (`singular_key`) → Ähnlichkeit → sonst neue eigene Zutat in „Sonstiges".
- Das Bild hängt an `ingredients.image_slug`, Synonyme stehen in
  `ingredient_aliases`. Mehr gibt es nicht — keine Namenstabellen im Code.
- Stamm-Zutaten (`household_id is null`) gehören allen; eigene Zutaten nur dem
  Haushalt. Zusammengelegt wird immer **in die Stamm-Zutat**, wenn es eine gibt.

## Ablauf

1. `node scripts/zutaten-pflege/kandidaten.mjs` — Liste der eigenen Zutaten mit
   Pflegebedarf (`dublette`, `zahl`, `sonstiges`, `ohne-bild`, `klein`). Nur lesen.
2. Je Kandidat entscheiden und als Vorschlagstabelle zeigen (eine Zeile pro
   Zutat: Befund → Vorschlag):
   - **dublette / zahl** → in die richtige Zutat zusammenlegen („300 g Lauch" →
     „Lauch"); Zeilen in Rezepten und Liste ziehen mit.
   - **Plural / Zweitname** → `ingredient_aliases`-Eintrag auf die Zielzutat,
     nur wenn die Grundform ihn nicht schon abdeckt (z. B. „Eier"/„Ei").
   - **sonstiges** → Abteilung aus `categories` wählen (`category_id` der
     eigenen Zutat; bei Stamm-Zutaten geht es nur je Haushalt über
     `household_ingredient_categories`).
   - **ohne-bild** → vorhandenes Bild wiederverwenden (`image_slug` setzen,
     nur wenn das Foto ununterscheidbar wäre, siehe `aliases.json`-Regel im Skill
     `zutatenbilder`), neues Bild über den Skill `zutatenbilder`, oder bewusst
     keins (Sammelbegriffe wie „Salz und Pfeffer").
   - **klein** → Anzeigename großschreiben, außer es ist ein Adjektiv-Anfang
     („getrocknete Aprikosen" bleibt, wie im Rezept geschrieben).
3. Nutzer bestätigt oder ändert die Tabelle. Nichts ohne Freigabe.
4. Freigegebenes als **eine** Migration `supabase/migrations/00NN_*.sql`
   schreiben, per Supabase-MCP `apply_migration` anwenden, `npm run sql`
   ausführen, committen und nach `main` pushen.
   - Zusammenlegen: Zeilen in `recipe_ingredients` und
     `shopping_list_entries` auf die Zielzutat umhängen (Einträge, die dort
     schon mit gleicher Einheit stehen, nicht überschreiben), `image_slug`
     übernehmen, wenn die Zielzutat keinen hat, dann die eigene Zutat löschen.
     Bei mehr als einer Zeile, die dabei wegfallen würde, vorher nachfragen.
5. `node scripts/zutaten-pflege/kandidaten.mjs` erneut laufen lassen und das
   Ergebnis berichten: was ist erledigt, was bleibt bewusst offen.

## Regeln

- Plural-Regel nicht aufweichen, um einen Einzelfall zu retten: ein Alias ist
  der richtige Weg für Ausnahmen.
- Keine Bilder erfinden: wo kein vorhandenes passt, ist „kein Bild" besser als
  ein falsches.
