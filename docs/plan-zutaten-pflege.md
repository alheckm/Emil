# Plan: Zutaten-Stammdaten pflegen (Plural, Synonyme, Kategorie, Bild)

Status: umgesetzt (Migration 0029, Skill `zutaten-pflegen`); offen: erster Aufräumlauf

## Befund (geprüft)
- Eingabe → `resolve_ingredient` (supabase/migrations/0028): exakt → Alias → Ähnlichkeit ≥ 0,62 → sonst neue eigene Zutat in „Sonstiges".
- Plural/Singular („Äpfel"/„Apfel") liegt unter der Ähnlichkeitsschwelle, deshalb entstehen Dubletten.
- `ingredient_aliases` gibt es, enthält aber nur eine Handvoll Einträge, per Migration gepflegt.
- Bild: `INGREDIENT_IMAGES` (src/lib/core/ingredientImages.ts) ist nach Anzeigename als String geschlüsselt. Jede Umbenennung, jede Dublette und jeder Plural verliert das Bild.
- Zweite, parallele Alias-Liste: scripts/ingredient-images/aliases.json (nur fürs Bild).
- Aktuell 38 eigene Zutaten, 20 davon in „Sonstiges" (Lachs, Käse, Kuchen, Stückige Tomaten …); Müll wie „300 g Lauch", „Kalbsfond", „Gewürznelke" neben „Lorbeerblätter".

## Lösung in drei Schichten

1. **Eine Quelle der Wahrheit in der DB.** Neue Spalte `ingredients.image_slug` (Bild hängt an der Zutat, nicht am Namen). `ingredient_aliases` bleibt die einzige Synonymliste; `aliases.json` entfällt. Singular und Plural sind einfach zwei Aliase derselben Zutat.
2. **Billige Regeln statt KI beim Eintippen.** In `resolve_ingredient` vor der Ähnlichkeit: Plural-Normalisierung (Endungen -n/-en/-e/-s/-er, Umlautwechsel ä→a, ö→o, ü→u) als SQL-Hilfsfunktion `singular_key()`. Trifft „Äpfel", „Tomaten", „Möhren", „Nüsse" ohne Pflege. Neue Zutat landet nur dann in „Sonstiges", wenn nichts passt.
3. **KI-Aufräumlauf als Skill, auf Zuruf (`/zutaten-pflegen`)**, nicht automatisch. Liest eigene Zutaten + Stamm, schlägt als Liste vor: Dubletten zusammenlegen, Aliase ergänzen (Plural, Zweitnamen), Kategorie, Bildziel (vorhandenes Bild wiederverwenden oder neues generieren, dann Skill `zutatenbilder`). Nichts wird ohne deine Bestätigung geschrieben; Ergebnis als Migration, damit nachvollziehbar und in `setup.sql`.
   - Kandidaten dafür liefert eine Abfrage: eigene Zutaten ohne Bild, in „Sonstiges", mit Zahl im Namen, oder mit ähnlichem Namen wie eine andere.

## Schritte
1. Migration 0029: `image_slug` anlegen und aus der heutigen Map befüllen (Stamm + eigene); `singular_key()`; `resolve_ingredient` erweitern; vorhandene Plural-Aliase im Stamm nachtragen.
2. `shoppingList.ts` (Zeile ~135/161): `image_slug` mitladen; `ListView.tsx:553` nutzt ihn statt `ingredientImage(entry.name)`. `ingredientImages.ts` und `publish-map.mjs` auf Slug-Liste (Dateien in public/zutaten-marktregal) reduzieren.
3. Skill `zutatenbilder` und neuer Pflege-Skill schreiben `image_slug`/Aliase per Migration statt in JSON.
4. Einmaliger Aufräumlauf über die 38 eigenen Zutaten (Vorschlagsliste → deine Freigabe).
5. Tests: `singular_key`-Fälle (Äpfel→Apfel, Tomaten→Tomate, Nüsse→Nuss, Kräuter bleibt stabil), `resolve_ingredient` per SQL-Test, Bildlookup über Slug.

## Akzeptanzkriterien
- „Äpfel", „Apfel", „äpfel", „5 Äpfel" landen auf derselben Zutat, Abteilung Obst & Gemüse, mit Bild, sobald eins existiert.
- Eine Zutat umzubenennen verliert das Bild nicht.
- Neue Zutat ohne Treffer erscheint in der Abfrage „Pflegebedarf" und wird erst nach Freigabe verschoben.
- 164 bestehende Tests plus neue laufen grün.

## Risiken
- Plural-Regeln treffen falsch („Nelke" ↔ „Nelken" ok, „Linse" ↔ „Linsen" ok, aber „Reis"/„Reise" nicht erwünscht): nur auf Wortende, mit Mindestlänge 4, und Ähnlichkeit bleibt als Sicherheitsnetz; Fehltreffer lassen sich per Alias überstimmen.
- Datenmigration der Bild-Zuordnung: Abgleich vor/nach (Zahl Zutaten mit Bild muss gleich bleiben).

## Offene Entscheidung
KI-Lauf: nur auf Zuruf (empfohlen) oder zusätzlich wöchentlich geplant?
