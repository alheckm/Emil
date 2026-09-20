---
name: rezepte-pflegen
description: Automatische Rezept-Pflege — bestimmt Tags, Saison, Nährwerte,
  ergänzt Mengen in der Anleitung, bessert unsichere Zutaten-Zuordnungen nach
  und erzeugt fehlende Rezeptbilder. Läuft wöchentlich headless per launchd
  (siehe scripts/rezept-pflege/lauf.sh), lässt sich aber auch von Hand
  starten: `/rezepte-pflegen [--limit N] [--alle]`.
---

# Rezepte pflegen

Dieser Lauf urteilt über Inhalte, schreibt aber **nie selbst SQL**. Jeder
Zugriff auf die Datenbank läuft über `scripts/rezept-pflege/pflege.mjs` — das
Skript prüft die Form, legt vor jeder Änderung einen Snapshot in
`recipe_revisions` an und schreibt erst danach. Siehe
`docs/plan-rezept-pflege.md` für den Hintergrund.

## Ablauf

1. `node scripts/rezept-pflege/pflege.mjs liste --offen --limit <N aus dem
   Argument, sonst 10>` (mit `--alle` statt `--offen`, wenn ausdrücklich ein
   kompletter Neudurchlauf verlangt wurde). Das liefert je Rezept: Titel,
   Zutatenzeilen mit `position`, aktuelle Anleitung, und unter `luecken`,
   was konkret fehlt.
2. Für jedes Rezept in der Liste: die Lücken einzeln schließen (siehe unten),
   ein `patch.json` in eine temporäre Datei schreiben, dann
   `node scripts/rezept-pflege/pflege.mjs schreibe <id> --datei patch.json
   --lauf-id <ein fester Wert für diesen ganzen Lauf, z. B. das Datum>`.
   Erst `--probe` anhängen und den Unterschied lesen, wenn eine Änderung groß
   oder unsicher wirkt (z. B. eine stark umformulierte Anleitung) — sonst
   direkt schreiben.
3. Unsichere Zutatenzeilen (`luecken` nennt die Positionen) über
   `zutat <id> --datei zuordnung.json` nachbessern:
   `[{"position": 3, "name": "Möhren"}]` — der bessere Name, den
   `resolve_ingredient` dann selbst auf eine kanonische Zutat abbildet.
4. Fehlt `imagePath`: ein Foto erzeugen (siehe unten) und mit
   `bild <id> --datei pfad.jpg` setzen.
5. Am Ende eine kurze Zusammenfassung ausgeben (wie viele Rezepte bearbeitet,
   was übersprungen wurde und warum) — das landet im Log des launchd-Laufs.

## Was in `patch.json` darf

Nur diese vier Felder, alle optional, mindestens eines gesetzt:

```json
{
  "tags": ["italienisch", "vegetarisch"],
  "season_months": [9, 10, 11],
  "nutrition": { "kcal": 480, "protein_g": 22, "carbs_g": 58, "fat_g": 14 },
  "instructions": ["{{z:1}} und {{z:2}} anschwitzen.", "Den Ofen vorheizen."]
}
```

`pflege.mjs` lehnt jedes andere Feld und jeden `{{z:N}}`-Verweis auf eine
nicht vorhandene Position ab.

## Harte Regeln

- **Nur über `pflege.mjs` schreiben, nie über SQL oder eine andere RPC.**
- **Keine Kochschritte erfinden.** Ergänzt werden ausschließlich Mengen
  (als `{{z:N}}`, nie als Zahl im Text — siehe `src/lib/core/steps.ts`) und
  sprachliche Glättung. Reihenfolge, Handgriffe, Gar- und Ruhezeiten bleiben,
  wie sie in der Originalanleitung stehen.
- **Tags: Küche, Ernährungsform, Anlass — höchstens fünf, klein geschrieben.**
  Vor dem Vergeben neuer Tags an vorhandene anlehnen — `liste --alle` zeigt
  die Tags aller Rezepte im Haushalt, das ist die verfügbare Übersicht.
- **`season_months` nur bei wirklich saisonalen Rezepten.** Ein Gericht, das
  ganzjährig passt (die meisten Suppen, Pastagerichte, Currys), bleibt leer —
  sonst wird der „Saisonal"-Filter in der App wertlos.
- **Nährwerte sind Schätzungen je Portion** (bezogen auf `baseServings`),
  keine Laboranalyse. Plausibel schätzen, nicht auf die Nachkommastelle.
- **Bild nur erzeugen, wenn `imagePath` fehlt.** Niemals ein vorhandenes Bild
  ersetzen — das ist immer ein Foto, das ein Mensch ausgesucht hat.
- **Im Zweifel überspringen.** Ein Rezept, bei dem etwas unklar bleibt
  (z. B. eine Zutatenzeile, die sich keiner Menge zuordnen lässt), wird
  ausgelassen und der Grund kommt in die Zusammenfassung — nicht raten.

## Rezeptbild erzeugen

Nur wenn `imagePath` fehlt, per `mcp__gemini-image__generate_image`:
fotorealistisch, das fertig angerichtete Gericht von oben, natürliches Licht,
ruhiger, unaufdringlicher Hintergrund — passend zu den echten Fotos, die
schon in der App liegen. `output_path` unter `scripts/rezept-pflege/tmp/<slug>.jpg`
legen (das Verzeichnis ist gitignored, dort darf Erzeugtes liegen bleiben —
die Werkzeugliste des headless-Laufs erlaubt kein `rm`), danach
`node scripts/rezept-pflege/pflege.mjs bild <id> --datei <output_path>`.
