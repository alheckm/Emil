---
name: emil-pflege
description: Der eine Aufräum-Einstieg für Emil — zeigt, was gerade Pflege braucht
  (Zutatenbilder, Zutaten/Aliase/Abteilungen, Rezepte, …), und startet auf Wunsch
  die passenden Läufe. Nur von Hand: `/emil-pflege` oder `/emil-pflege <aufgabe>`.
disable-model-invocation: true
---

# Emil pflegen

Einziger Einstiegspunkt für alles, was in Emil regelmäßig aufgeräumt wird. Dieser
Skill hält die Liste der Aufgaben und den Überblick; die eigentliche Arbeit
steckt in den Fach-Skills, auf die er verweist. Er schreibt nichts selbst.

## Ablauf

1. **Überblick holen.** Für jede Aufgabe in der Tabelle die Statusabfrage laufen
   lassen (nur lesen, nie schreiben) und knapp zusammenfassen: eine Zeile pro
   Aufgabe, mit Zahl und „braucht Pflege" / „sauber".
2. **Fragen, was laufen soll** (AskUserQuestion, Mehrfachauswahl, Aufgaben mit
   offenem Bedarf zuerst). Wurde `<aufgabe>` übergeben, diesen Schritt
   überspringen.
3. **Je gewählter Aufgabe den Fach-Skill ausführen** und dessen Regeln
   einhalten. Reihenfolge, wenn mehrere gewählt sind: Zutaten → Zutatenbilder →
   Rezepte (Zutaten zuerst, weil Bilder und Rezept-Zuordnung auf ihnen
   aufbauen).
4. **Abschluss:** pro Aufgabe ein Satz, was sich geändert hat, und was für
   später offen bleibt.

Grundsätze, die für jede Aufgabe gelten:

- Änderungen an Daten gehen als Vorschlag zur Freigabe an den Nutzer, nicht
  unbemerkt in die Datenbank. Ausnahme: Läufe, deren Fach-Skill ausdrücklich
  eigene Sicherungen hat (Rezepte: Snapshot in `recipe_revisions`).
- Schemaänderungen und Stammdaten-Korrekturen als Migration in
  `supabase/migrations/`, danach `npm run sql`, dann nach `main` pushen
  (siehe AGENTS.md).
- Nach jedem Schritt committen und pushen.

## Aufgaben

| Aufgabe | Fach-Skill / Ort | Status |
| --- | --- | --- |
| `bilder` — fehlende Zutatenbilder erzeugen | Skill `zutatenbilder` | aktiv |
| `rezepte` — Tags, Saison, Nährwerte, Mengen, Rezeptbilder | Skill `rezepte-pflegen` (läuft zusätzlich wöchentlich per launchd) | aktiv |
| `zutaten` — Dubletten, Plural/Aliase, Abteilung, Bild-Zuordnung | Plan `docs/plan-zutaten-pflege.md` | **geplant**, noch kein Fach-Skill; bis dahin nur den Überblick zeigen |

### Statusabfragen (nur lesen)

Über das Supabase-MCP (`execute_sql`) oder `scripts/`:

- **bilder:** `node scripts/ingredient-images/find-missing-marktregal.mjs` — Zahl
  der genutzten Zutaten ohne Bild.
- **rezepte:** `node scripts/rezept-pflege/pflege.mjs liste --offen` — Zahl
  der Rezepte mit offener Pflege.
- **zutaten:**
  ```sql
  select
    count(*) filter (where household_id is not null and category_id = 'sonstiges') as eigene_in_sonstiges,
    count(*) filter (where household_id is not null and display_name ~ '[0-9]') as mit_zahl_im_namen,
    count(*) filter (where household_id is not null and display_name ~ '^[a-zäöü]') as kleingeschrieben
  from ingredients;
  ```

## Neue Pflegeaufgabe aufnehmen

Wenn in Emil etwas Neues dazukommt, das regelmäßig aufgeräumt werden muss:

1. Fach-Skill (oder Skript) dafür anlegen — eine Aufgabe, ein Ort.
2. Hier eine Zeile in die Tabelle „Aufgaben" und eine Statusabfrage unter
   „Statusabfragen" ergänzen. Dazu die Position in der Reihenfolge in Schritt 3,
   falls sie von anderen abhängt.
3. Den Fach-Skill nicht zusätzlich beim Modell anmelden, wenn er nur über
   `/emil-pflege` laufen soll (`disable-model-invocation: true`).
