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

## Mengenverweise in der Anleitung

Ein `{{z:N}}`-Verweis ersetzt die **gesamte** Erwähnung von Menge, Einheit
und Name (`src/lib/core/steps.ts`: `amountText` rendert über
`formatIngredientLine`) — `{{z:1}}` wird zu `150 g Zwiebel`, nicht nur zu
`150 g`. Steht das Wort „Zwiebeln" schon danach im Text, verdoppelt sich der
Name. Der Verweis kommt also **anstelle** der bloßen Namensnennung, nicht
zusätzlich dazu.

**Nur die volle, unveränderte Menge einer Zutatenzeile bekommt einen
Verweis — und nur bei ihrer ersten Erwähnung.** Wird dieselbe Zutat später
im Text noch einmal genannt (z. B. „Zwiebeln darin anschwitzen", nachdem sie
schon geschält wurden), bleibt das eine bloße Wortnennung, kein zweiter
Verweis.

**Das gilt genauso, wenn die Menge schon als Zahl im Text steht, nicht nur
bei einer bloßen Namensnennung.** Bearbeitet jemand ein Rezept in der App,
löst `stripStepMarkers` jeden `{{z:N}}`-Verweis zurück in Klartext auf
(„150 g Zwiebel schälen…") — der nächste Pflege-Lauf sieht dann exakt so
einen Satz, keine bloße Namensnennung mehr. Die Prüfung ist mechanisch:
stimmen Zahl **und** Einheit an dieser Stelle mit `amount`/`unitCode` der
Zutatenzeile überein, ist es die volle Menge — ersetzen, die ganze
Erwähnung (Zahl, Einheit, Name) wird zu `{{z:N}}`. Weichen sie ab, ist es
eine Teilmenge (siehe unten) — unangetastet lassen. Genau dieser Fall ist
der, den der Nutzer gemeldet hat: eine Anleitung, in der „150 g Zwiebeln"
schon richtig dasteht, aber als Text statt als Verweis — das ist keine
neue Zutat zum Nachschlagen, sondern derselbe Fall wie eine bloße
Namensnennung, nur mit Zahl davor.

**Wird nur ein Teil der Menge in einem Schritt verwendet, bleibt die Stelle
unangetastet.** `{{z:N}}` löst sich immer zur vollen gelisteten Menge auf —
ein Verweis an einer Stelle, die nur einen Teil verwendet, würde dort eine
falsche (zu hohe) Menge anzeigen. Das ist keine Lücke, die zu schließen ist,
sondern eine bewusste Aufteilung durch die Originalanleitung.

**Nie eine Zahl erfinden, die nicht schon so im Originaltext oder in der
Zutatenliste steht** — auch keine naheliegend wirkende (z. B. eine
Portionszahl als Spießanzahl). Das fällt unter „keine Kochschritte
erfinden" weiter unten.

**Zutatenzeilen ohne Menge (`amount: null`, z. B. „Salz" nach Geschmack)
bekommen nie einen Verweis** — dafür gibt es keine Zahl zum Auflösen.

Zutaten, die gar nicht in der Zutatenliste stehen (Wasser zum Aufkochen,
Holzspieße, Gewürze aus dem Vorrat), bleiben unverändert im Text, egal
welche Zahl davorsteht.

Beispiel A — bloße Namensnennung, vorher (Zutat 1 = 150 g Zwiebeln, Zutat 3
= 5 EL Öl insgesamt, Zutat 6 = 300 g Rote Linsen):

```
Zwiebeln schälen und würfeln. 3 EL Öl erhitzen, Zwiebeln darin anschwitzen.
700 ml Wasser und Linsen zugeben und köcheln lassen.
```

Richtig gepflegt:

```
{{z:1}} schälen und würfeln. 3 EL Öl erhitzen, Zwiebeln darin anschwitzen.
700 ml Wasser und {{z:6}} zugeben und köcheln lassen.
```

— `Zwiebeln` (erste Erwähnung) wird zu `{{z:1}}`, die zweite Erwähnung
bleibt Text. `3 EL Öl` bleibt unangetastet: 3 ≠ 5, also nur ein Teil der
gelisteten Menge, der Rest wird an anderer Stelle verwendet. `700 ml
Wasser` bleibt unangetastet: Wasser steht nicht in der Zutatenliste.
`Linsen` wird zu `{{z:6}}`, weil hier die volle gelistete Menge gemeint
ist.

Beispiel B — Menge steht schon als Zahl da (der Fall, den `stripStepMarkers`
beim Bearbeiten in der App erzeugt, und der Fall, den der Nutzer gemeldet
hat), gleiche Zutatenliste, vorher:

```
150 g Zwiebel schälen und würfeln. 3 EL Öl erhitzen, Zwiebeln darin
anschwitzen. 700 ml Wasser und 300 g Rote Linsen zugeben und köcheln
lassen.
```

Richtig gepflegt:

```
{{z:1}} schälen und würfeln. 3 EL Öl erhitzen, Zwiebeln darin anschwitzen.
700 ml Wasser und {{z:6}} zugeben und köcheln lassen.
```

— `150 g Zwiebel` stimmt in Zahl und Einheit mit Zutat 1 überein → volle
Erwähnung wird zu `{{z:1}}`. `3 EL Öl` bleibt unangetastet: 3 ≠ 5, also
weiterhin nur ein Teil. `300 g Rote Linsen` stimmt mit Zutat 6 überein →
wird zu `{{z:6}}`.

Falsch (genau der Fehler vom 2026-09-22, der Anlass für diesen Abschnitt
war — dieselbe Ausgangslage wie Beispiel B, aber die Zahlen einfach stehen
gelassen statt durch Verweise zu ersetzen):

```
150 g Zwiebel schälen und würfeln. 3 EL Öl erhitzen, Zwiebeln darin
anschwitzen. 700 ml Wasser und 300 g Rote Linsen zugeben und köcheln
lassen.
```

**`pflege.mjs schreibe` lehnt Anleitungen mit neuen Zahlen außerhalb von
`{{z:N}}` technisch ab** (Vergleich gegen die Zahlen im aktuellen Text vor
dem Patch — jede Zahl, die neu auftaucht oder öfter vorkommt als vorher,
wird abgelehnt). Das fängt das falsche Beispiel oben ab, sobald schon
einmal ein Verweis für dieselbe Menge stand und der neue Patch sie durch
eine Zahl ersetzt oder eine Zahl unverändert lässt, wo eigentlich ein
Verweis hingehört und die Zahl vorher noch nicht da war.

**Wird der Patch von `pflege.mjs schreibe` deswegen abgelehnt: nicht
umformulieren, um daran vorbeizukommen** (kein Ausschreiben als Wort wie
„hundertfünfzig Gramm", keine andere Zahlenschreibweise, kein Weglassen der
Einheit). Entweder die Stelle bekommt einen korrekten `{{z:N}}`-Verweis,
oder sie bleibt unverändert (Teilmenge, siehe oben), oder das ganze Rezept
wird übersprungen und der Grund kommt in die Zusammenfassung.

Trifft eine dieser Situationen auf ein Rezept zu und bleibt unklar, welche
Erwähnung die volle Menge meint: überspringen (siehe „Im Zweifel
überspringen" unten), nicht raten.

## Harte Regeln

- **Nur über `pflege.mjs` schreiben, nie über SQL oder eine andere RPC.**
- **Keine Kochschritte erfinden.** Ergänzt werden ausschließlich Mengen
  (als `{{z:N}}`, nie als Zahl im Text — siehe oben) und sprachliche
  Glättung. Reihenfolge, Handgriffe, Gar- und Ruhezeiten bleiben, wie sie in
  der Originalanleitung stehen.
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
