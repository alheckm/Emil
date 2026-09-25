# Rezept-Pflege: wöchentlicher Claude-Lauf

> Umsetzungsplan, 2026-09-20. Stand: Schritt 1–6 gebaut und gegen die echte
> Datenbank getestet (Schema, `steps.ts`, UI-Verdrahtung, `pflege.mjs`,
> `SKILL.md`, `lauf.sh` + Plist). Der launchd-Job ist **noch nicht
> installiert** — das braucht ausdrückliches OK, siehe unten.
>
> **Nachtrag 2026-09-25** (docs/plan-recht.md): `pflege.mjs` liest und schreibt
> jetzt nur noch den einen Haushalt aus `PFLEGE_HOUSEHOLD_ID` (.env.local) —
> vorher hätte der Lauf Rezepte *aller* Haushalte an Claude geschickt, ohne
> dass die Datenschutzerklärung das ankündigt. Die Bilderzeugung läuft über
> lokales mflux statt über den `gemini-image`-MCP-Server, damit keine
> zweite, unangekündigte Weitergabe an Google entsteht.

## Kontext

Rezepte landen über Import, Foto oder Handeingabe in der Datenbank — mit Lücken.
`season_months` ist seit Migration 0013 vorbereitet und **leer**; die
„Saisonal"-Pille in der Rezeptübersicht zeigt deshalb nichts
(`docs/design-system.md` Abschnitt 12 führte das als offenen Punkt). Nährwerte gibt es
im Schema überhaupt nicht. Anleitungen nennen Handgriffe ohne Mengen („Möhren
und Lauch anschwitzen"), obwohl die Mengen eine Zeile höher stehen. Zutatenzeilen
mit niedriger `parse_confidence` bleiben liegen.

Das soll ein regelmäßiger, **lokal auf dem Mac** laufender Claude-Lauf erledigen:
wöchentlich nachts, ohne Rückfrage, direkt in die Datenbank schreibend — aber so,
dass **jeder Originalstand wiederherstellbar** bleibt.

## Architektur

Der Kern der Entscheidung: **Claude urteilt über Inhalte, schreibt aber nie
selbst SQL.**

```
launchd  (So 03:00)
  └─ scripts/rezept-pflege/lauf.sh
       └─ claude -p "/rezepte-pflegen --limit 10"     (headless, enge Werkzeugliste)
            ├─ node pflege.mjs liste --offen     → JSON: Rezepte mit Lücken
            ├─ Claude entscheidet: Tags, Saison, Nährwerte, Mengen in der Anleitung
            ├─ mflux-generate (lokal)            → nur wenn image_path fehlt
            ├─ node pflege.mjs schreibe <id> --datei patch.json
            │     └─ Zod-Prüfung → Snapshot in recipe_revisions → gezieltes UPDATE
            └─ node pflege.mjs bild <id> --datei bild.jpg   → Storage-Upload
```

Warum diese Trennung:

- Der headless-Lauf bekommt **keinen Supabase-Zugriff** — kein ad-hoc-SQL auf der
  Produktionsdatenbank. Die Werkzeugliste erlaubt genau ein Bash-Muster.
- `save_recipe` ist für Anreicherung **unbrauchbar**: es löscht beim Ändern alle
  Zutatenzeilen und legt sie neu an (`supabase/migrations/0009_rezepte_speichern.sql:291`),
  wodurch `shopping_list_sources` per Kaskade mitgeht. Die Pflege schreibt
  stattdessen gezielte `UPDATE`s auf eine Feld-Whitelist.
- Das CLI ist getestet und deterministisch; das Urteil („ist das ein
  Herbstgericht?") bleibt bei Claude.

## Schritt 1 — Schema: `supabase/migrations/0014_rezept_pflege.sql`

- `recipes.nutrition jsonb` — je Portion, Form
  `{"kcal":520,"protein_g":24,"carbs_g":61,"fat_g":18}`, `null` = noch nicht
  geschätzt. CHECK auf `jsonb_typeof(...) = 'object'`.
- `recipes.pflege_stand timestamptz` — Zeitpunkt der letzten Pflege. „Offen" heißt
  `pflege_stand is null or pflege_stand < updated_at`.
- `recipe_revisions` — der Rückweg:
  `id, recipe_id, household_id, vorher jsonb (Rezeptzeile + alle Zutatenzeilen),
  felder text[], lauf_id text, quelle text default 'claude-pflege', created_at`,
  Index auf `(recipe_id, created_at desc)`.
- RLS nach dem Muster aus `0006_rls.sql`: `select` für Haushaltsmitglieder,
  **bewusst keine** insert/update/delete-Policy (nur der Secret Key schreibt).
- `save_recipe` bleibt unangetastet: es kennt die neuen Spalten nicht und fasst
  sie damit auch nicht an.

**Status: erledigt.** Migration angewendet (`rezept_pflege`), `npm run sql` gelaufen.

## Schritt 2 — Mengen in der Anleitung: `src/lib/core/steps.ts`

Gespeichert wird der Verweis `{{z:N}}` mit **N = `position`** der Zutatenzeile,
nicht die ID: `save_recipe` legt die Zeilen beim Speichern neu an, IDs überleben
eine Bearbeitung nicht, Positionen schon.

- `resolveSteps(steps, ingredients, baseServings, servings)` — löst Marker über
  `scaleAmount` + `formatIngredientLine` auf.
- `stripStepMarkers(steps, ingredients, baseServings)` — Klartext auf
  Basisportionen, für das Bearbeiten-Formular.
- `stepMarkerPositions(steps)` — alle referenzierten Positionen, für die
  Prüfung in `pflege.mjs` vor dem Schreiben.
- Unbekannte Position: Marker verschwindet ersatzlos beim Rendern; `pflege.mjs`
  lehnt einen Verweis auf eine nicht vorhandene Position beim Schreiben ab.

**Status: erledigt**, mit Tests (`src/lib/core/__tests__/steps.test.ts`).

## Schritt 3 — Anzeige: Portionszahl teilen

`RecipeIngredientsAndSteps` (vormals `IngredientsSection`,
`src/app/(app)/rezepte/[id]/RecipeActions.tsx`) rendert jetzt Zutaten **und**
Zubereitung aus demselben `servings`-Zustand; `RecipeSteps` ist von `page.tsx`
dorthin gezogen. `RecipeForm.tsx` löst beim Laden mit `stripStepMarkers` auf,
damit im Bearbeiten-Formular nie `{{z:N}}` zu sehen ist.

**Status: erledigt**, im Browser gegen ein Test-Rezept geprüft: Zutaten und
Zubereitung skalieren bei 4 → 6 Portionen identisch, das Formular zeigt Klartext.

## Schritt 4 — Das CLI: `scripts/rezept-pflege/pflege.mjs`

Auth wie `scripts/ingredient-images/find-missing.mjs` (`.env.local` →
`NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SECRET_KEY`, umgeht RLS).

| Befehl | Wirkung |
|---|---|
| `liste [--offen\|--alle] [--limit N]` | JSON: Rezept, Zutatenzeilen mit Position, und was fehlt (`luecken`) |
| `schreibe <id> --datei patch.json [--probe] [--lauf-id ID]` | Zod-Whitelist (`tags`, `season_months`, `nutrition`, `instructions`), Marker-Prüfung, Snapshot, dann `UPDATE` + `pflege_stand`. `--probe` zeigt nur den Unterschied |
| `zutat <id> --datei zuordnung.json [--lauf-id ID]` | setzt je Zeile nur `ingredient_id`/`parse_confidence`, über RPC `resolve_ingredient`. Legt nie Zeilen an und löscht nie welche |
| `bild <id> --datei bild.jpg [--lauf-id ID]` | Upload in Bucket `recipe-images` unter `{household_id}/{recipe_id}/{uuid}.jpg`, dann `image_path` |
| `verlauf <id>` | Revisionen zu einem Rezept auflisten |
| `zurueck <revision-id>` | Spielt den Stand vor dieser Revision zurück — sichert den aktuellen Stand vorher selbst noch einmal |

Jeder Schreibbefehl legt den Snapshot **vor** der Änderung an und bricht mit
Exit-Code 1 ab, wenn etwas nicht stimmt.

**Abweichung vom ursprünglichen Plan:** `steps.ts` wird NICHT importiert — Node
löst relative `.ts`-Importe ohne Dateiendung nicht auf, auch nicht mit
`--experimental-strip-types` (das griff nur bei Skripten wie
`scripts/ingredient-images/find-missing-marktregal.mjs`, weil deren
importierte `.ts`-Module keine weiteren TS-Module importieren).
`pflege.mjs` bildet die Marker-Prüfung darum separat als reines Regex nach,
mit einem Kommentar, dass `src/lib/core/steps.ts` die Quelle der Wahrheit für
das *Auflösen* bleibt.

**Status: erledigt und gegen die echte Datenbank getestet** — `liste`,
`schreibe --probe`, ein echter `schreibe`, `verlauf`, `zutat`, `bild` und
`zurueck` liefen alle gegen das reale Rezept „Linsen-Curry-Suppe mit
Bananenspieß", jede Testschreibung wurde per `zurueck` wieder exakt auf den
Ausgangsstand gebracht.

**Zwei Fehler nachträglich gefunden und behoben** (siehe Commit
"zwei Fehler vor dem ersten scharfen Lauf behoben"): `pflege_stand` wurde
clientseitig gesetzt und lag darum praktisch immer vor dem `updated_at`, das
der Trigger im selben Moment in der Datenbank setzt — „offen" wäre für jedes
bearbeitete Rezept für immer wahr geblieben. Migration
`0015_pflege_stand_touch.sql` behebt das mit einer RPC, die `pflege_stand`
im selben Statement wie den Trigger setzt. Und `zurueck` prüfte nicht, ob die
zu restaurierenden Zutatenzeilen noch existieren — wurde das Rezept
zwischenzeitlich in der App bearbeitet, hätte ein stiller No-op-Update
gedroht. Beides gegen die echte Datenbank nachgetestet, inklusive eines
simulierten Falls für den zweiten Fehler.

## Schritt 5 — Der Skill: `.claude/skills/rezepte-pflegen/SKILL.md`

Ablauf plus die harten Regeln (keine Kochschritte erfinden, Tags klein und an
Bestehendes anlehnen, Saison nur bei wirklich saisonalen Rezepten, Nährwerte
sind Schätzungen, Bild nie ein vorhandenes ersetzen, im Zweifel überspringen).

**Status: erledigt.**

## Schritt 6 — Zeitplan

`scripts/rezept-pflege/lauf.sh` — headless-Aufruf mit enger Werkzeugliste:

```sh
claude -p "/rezepte-pflegen --limit 10" \
  --permission-mode acceptEdits --permission-prompts none \
  --allowedTools "Read,Write,Bash(node scripts/rezept-pflege/pflege.mjs:*),Bash(~/.mflux/venv/bin/mflux-generate:*)"
```

`--permission-prompts none` heißt: alles, was nicht auf der Liste steht, wird
abgelehnt statt zu hängen. Log nach `scripts/rezept-pflege/logs/JJJJ-MM-TT.log`
(gitignored). `PATH` wird im Skript selbst um `/opt/homebrew/bin` ergänzt, weil
launchd mit einem minimalen `PATH` startet.

`scripts/rezept-pflege/de.emil.rezept-pflege.plist` — Installationsanleitung
steht als Kommentar in der Datei selbst. `StartCalendarInterval` Sonntag 03:00.

**Status: Dateien liegen im Repo, `launchctl load` ist NICHT ausgeführt** —
das war für „nach ausdrücklichem OK" vorgesehen. Der Mac muss zur Startzeit
wach sein; alternativ `pmset repeat wakeorpoweron` oder eine andere Startzeit.

## Schritt 7 — Doku

- `docs/design-system.md` Abschnitt 12: Punkt zur Saisonal-Pille aktualisiert
  (verweist jetzt auf diesen Plan statt auf einen offenen Punkt ohne Lösung).
- Dieser Plan liegt unter `docs/plan-rezept-pflege.md`.
- Nach jedem Schritt committet und direkt nach `main` gepusht.

## Noch offen

1. **Ein echter, unbeaufsichtigter `lauf.sh`-Durchlauf** gegen die beiden
   realen Rezepte — bisher wurde nur das CLI selbst durchgetestet, nicht der
   volle Weg über den headless-Claude-Aufruf mit der Werkzeugliste aus Schritt 6.
2. **`launchctl load`** — die eigentliche Automatisierung ist noch nicht
   scharf geschaltet.

Beides bewusst zurückgehalten, bis der Nutzer grünes Licht gibt: der erste
Punkt schreibt echte Änderungen in die Produktionsdatenbank (wenn auch über
`recipe_revisions` rückholbar), der zweite richtet einen wiederkehrenden,
unbeaufsichtigten Systemjob ein.

## Ausdrücklich nicht in diesem Schritt

Die Nährwerte werden gespeichert, aber noch **nirgends angezeigt** — dafür braucht
der Rezept-Screen eine eigene Fläche, und das ist eine Gestaltungsentscheidung mit
eigenem Durchgang durch `docs/design-system.md`.
