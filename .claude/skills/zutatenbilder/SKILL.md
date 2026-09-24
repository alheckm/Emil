---
name: zutatenbilder
description: Fehlende Zutatenbilder für aktuell genutzte Zutaten (Rezepte +
  Einkaufsliste) lokal per mflux generieren und verarbeiten. Nutzen, wenn der
  Nutzer nach fehlenden/neuen Zutatenbildern fragt, "Zutatenbilder
  generieren/auffüllen" sagt, oder wenn Rezepte importiert wurden, die neue
  Zutaten angelegt haben. Auch einschlägig für die Design-Exploration der
  "Marktregal"-Richtung (vollbild/grau/bold-Varianten) und den automatisierten
  Marktregal-Produktionslauf (siehe unten, Modus 2/3).
---

# Zutatenbilder — drei getrennte Modi

Dieser Skill deckt drei unabhängige Dinge ab, die alle mflux + `subjects.mjs`
nutzen, aber unterschiedliche Ziele, Ausgabeorte und Lebenszyklen haben.
Nicht vermischen.

## Modus 1: Produktion, auf Bedarf

Erzeugt Fotos für Zutaten **nur auf Bedarf** — nicht im Voraus für alle ~350
möglichen Zutaten, sondern nur für die, die gerade tatsächlich in einem Rezept
oder auf der Einkaufsliste stehen und noch kein Bild haben.

## Ausführen

```
npm run zutatenbilder
```

Das ist `find-missing.mjs --scope=used --generate` (siehe
`scripts/ingredient-images/find-missing.mjs`). Ablauf:

1. Fragt die Datenbank: welche Zutaten stehen aktuell in `recipe_ingredients`
   oder `shopping_list_entries`?
2. Vergleicht das mit `src/lib/core/ingredientImages.ts` — was hat noch kein
   Bild?
3. Für die fehlenden mit Bildmotiv in `subjects.mjs`: ruft `generate.py`
   (mflux, lokal, ~10–15 s Modell laden + ~60–100 s pro Bild bei 4 Schritten,
   768×1024 Hochformat) und danach `process.py` auf, das die Rohbilder zu
   192-px-WebP-Chips zuschneidet und `ingredientImages.ts` neu schreibt.

Braucht `SUPABASE_SECRET_KEY` in `.env.local` (umgeht RLS) und die lokale
mflux-Installation unter `~/.mflux/venv`.

## Danach

- Kurz stichprobenhaft prüfen (z. B. mit dem Read-Tool ein, zwei neue
  `public/zutaten/<slug>.webp` ansehen): flacher Pastellgrund in der
  Eigenfarbe der Zutat, echter dunkler Schatten, Motiv gut erkennbar.
- Zutaten ohne Bildmotiv (`SUBJECTS` in `subjects.mjs` fehlt der Name) werden
  nur aufgelistet, nicht generiert — dafür fehlt ein englisches Motiv in
  `subjects.mjs` (siehe Kommentar dort), das jemand von Hand ergänzen muss.
- Ergebnis committen und pushen (siehe Nutzer-Vorgabe: nach jedem
  Arbeitsschritt direkt nach `main`).

## Hintergrund, falls sich das Ergebnis komisch anfühlt

- Jede Zutat hat eine feste Pastell-Farbkategorie in `COLORS` (`subjects.mjs`)
  — dieselbe Kategorie ergibt denselben Hintergrundton (Tomate und Erdbeeren
  beide Rot). Bewusst *Eigenfarbe*, nicht Komplementärfarbe — das war schon
  einmal zur Diskussion und wurde verworfen.
- `process.py` färbt den Hintergrund **nicht** nach dem Zuschnitt um. Eine
  frühere Version tat das und hat dabei den Schlagschatten weggebügelt (er
  ist ja per Definition dunkler als der Hintergrund). Der Pastellgrund und der
  Schatten müssen also schon im Rohbild aus `generate.py` stimmen — das klappt
  auch mit den schnellen 4 Schritten zuverlässig (siehe Kommentar bei `STEPS`
  in `generate.py`), mehr Schritte bringen kaum etwas.

## Modus 2: Design-Exploration ("Marktregal"-Richtung)

Für die noch nicht im echten App-Code umgesetzte Redesign-Richtung aus
`DESIGN.md` (echte Zutatenfotografie in quadratischen Kacheln statt Pastell-
Kreis-Chips). Erzeugt zu einzelnen, namentlich angegebenen Zutaten drei
Bildvarianten zum Vergleich — **nicht** auf Bedarf für alle Zutaten, sondern
gezielt für die, die gerade zur Diskussion stehen.

```
~/.mflux/venv/bin/python scripts/ingredient-images/design-variants.py --names "Erdbeeren,Brot"
```

Namen exakt wie die Schlüssel in `subjects.mjs` `SUBJECTS` (meist Plural bei
zählbaren Zutaten: "Erdbeeren", nicht "Erdbeere"). Siehe
`scripts/ingredient-images/design-variants.py` für die volle Herleitung;
kurz:

1. **vollbild** — Motiv füllt den ganzen Rahmen bis zum Rand, kein Hinter-
   grund sichtbar (Kachel-Kandidat).
2. **grau** — Motiv freigestellt auf hellgrauem Studio-Grund (`#E8E8E8`, das
   Feld der Marktregal-Richtung).
3. **bold** — Motiv freigestellt auf kräftigem Farbgrund, automatisch aus
   genau vier Tönen gewählt (`scripts/ingredient-images/design-palette.json`),
   passend zur Eigenfarben-Kategorie der Zutat (`subjects.mjs` `COLORS`).

Ergebnis liegt unter `design/ingredients_directions/<slug>-{vollbild,grau,
bold}.png` — ein reiner Design-Ordner, komplett getrennt von
`public/zutaten/`. Nichts hier fließt automatisch in die Produktions-
Pipeline; `subjects.mjs` wird nur lesend genutzt (Motivtext + Farbkategorie),
`palette.json`/`buildPrompt`/`process.py` bleiben unberührt.

**Danach prüfen:** vollbild — Zutat trotz Extrem-Crop erkennbar, wirklich
kein Hintergrund an den Rändern sichtbar (bei Einzelstücken wie Brot der
kritische Fall, bei Haufen-Zutaten wie Beeren einfacher). grau/bold — Farbe
trifft die Zielfamilie (Eckpixel mit PIL/`~/.mflux/venv/bin/python`
gegenprüfen lohnt sich, das Modell driftet bei bold-Farben gern Richtung der
Eigenfarbe des Motivs, z. B. grüner Lauch → Teal statt gedecktes Salbeigrün —
die Negativ-Constraints in `design-palette.json` federn das ab, aber nicht
narrensicher).

## Modus 3: Produktion — Marktregal-Assets automatisiert auffüllen

Der Deploy-Pipeline-Lauf: sorgt dafür, dass über die Zeit so gut wie keine
Zutat mehr ohne vollständiges vollbild/grau/bold-Set dasteht — für dieselbe
Marktregal-Richtung wie Modus 2, aber als wiederholbarer, auf Vollständigkeit
zielender Lauf statt einer Handvoll benannter Vergleichsbilder. Ergebnis
landet als WebP unter `public/zutaten-marktregal/` — parallel zu, nicht
anstelle von, der Pastell-Chip-Produktion aus Modus 1. Die Marktregal-Kachel-
Oberfläche selbst ist noch nicht gebaut (`DESIGN.md`); dieser Lauf sorgt nur
dafür, dass die Assets schon bereitstehen, wenn sie kommt.

### Scope: "durably used", nicht nur "gerade aktiv"

`find-missing-marktregal.mjs` fragt nicht wie Modus 1 nach Zutaten, die
gerade in `recipe_ingredients`/`shopping_list_entries` stehen, sondern nach
allen Zutaten mit gesetzter `household_id` in der `ingredients`-Tabelle
(union mit den gerade aktiven globalen Seed-Zutaten). Grund:
`set_entry_checked` (`supabase/migrations/0016_abgehaktes_begrenzen.sql`)
löscht abgehakte Einkaufslisten-Zeilen, sobald mehr als 20 pro Liste abgehakt
sind — eine nur von Hand hinzugefügte Zutat kann so aus der Liste
verschwinden, bevor ein Lauf sie je sieht. Die `ingredients`-Zeile selbst
bleibt dabei aber stehen (wird nie gelöscht), das ist der verlässliche
Ledger. Die reinen ~350 globalen Seed-Zutaten, die noch nie ein Haushalt
angefasst hat, bleiben trotzdem außen vor — kein Vorrats-Rendering.

### Ablauf

```
npm run zutatenbilder:marktregal
```

1. Liefert zwei Listen: **bereit** (hat Bildmotiv in `subjects.mjs`, direkt
   oder über `aliases.json`) und **braucht Agenten-Entscheidung** (noch
   keines von beidem).
2. Für jeden Namen in "braucht Agenten-Entscheidung" triffst *du* (der
   Agent, der diesen Skill ausführt) eine von drei Entscheidungen — das ist
   der Teil, der sich nicht deterministisch skripten lässt:
   - **Alias** (`aliases.json` → `aliases`): nur wenn das Foto
     *ununterscheidbar* wäre, nicht bloß "verwandt". Nutzers eigenes
     Beispiel: `"Gemüsebrühepulver": "Gemüsebrühe"`. Falsch waere z. B.
     `"Tomatenmark": "Tomate"` — Paste sieht anders aus als die Frucht.
     Pulver/Flüssigkeit/Paste sind fast immer eigene Fotos.
   - **Skip** (`aliases.json` → `skipped`, mit Begründung): Test-Fixtures,
     Sammelkategorien, mehrdeutige Freitext-Kombinationen (z. B. "Salz und
     Pfeffer" — keine eindeutige Zuordnung ohne die andere Zutat falsch
     darzustellen). Ohne Eintrag wird derselbe Name bei jedem Lauf neu
     geprüft.
   - **Neues Motiv**: `SUBJECTS`- *und* `COLORS`-Eintrag in `subjects.mjs`
     ergänzen (beides Pflicht — ohne `COLORS`-Eintrag greift der
     `"yellow"`-Default in `colorFor()`, und das kollidiert mit Gold =
     `--accent`). Bei Gefäß-Zutaten (Pulver, Öl, Sauce) `BOWL()`/`JAR()`/
     `GLASS()` aus `subjects.mjs` verwenden, sonst rendert das Modell einen
     Haufen Staub im Nichts.
   - **Nebenwirkung, nicht übersehen:** neue `SUBJECTS`/`COLORS`-Einträge
     wirken sich auch auf Modus 1 aus — `hexFor()`/`buildPrompt()` lesen
     dieselbe Datei, die Pastell-Chip-Pipeline generiert diese Zutaten beim
     nächsten Lauf also automatisch mit.
3. `find-missing-marktregal.mjs` erneut laufen lassen — "braucht Agenten-
   Entscheidung" muss jetzt leer sein.
4. Generieren + veröffentlichen:
   ```
   ~/.mflux/venv/bin/python scripts/ingredient-images/generate-marktregal.py \
     --names "<komma-getrennte bereit-Liste aus Schritt 1/3>"
   ```
   Löst Aliase intern auf (Alias-Quellname oder Zielname funktionieren
   beide), dedupliziert, verwendet vorhandene Rohbilder aus
   `design/ingredients_directions/` oder `raw-marktregal/` wieder, generiert
   den Rest per mflux (`raw-marktregal/`, gitignored) und veröffentlicht als
   WebP unter `public/zutaten-marktregal/`. Keine Größenanpassung, kein
   Zuschnitt — provisorisch, bis die Kachel-UI existiert und die tatsächlich
   gebrauchte Größe/Form festlegt.
5. Idempotenz-Check: `find-missing-marktregal.mjs` ein drittes Mal — jetzt
   "Alle durably-used Zutaten haben vollständige Marktregal-Assets."
6. Committen und pushen (`public/zutaten-marktregal/*.webp`, geänderte
   `subjects.mjs`, geänderte `aliases.json`, nie `raw-marktregal/`).

### Automatisierung

Läuft heute nur, wenn du diesen Skill ausführst — kein Cronjob. mflux läuft
lokal auf diesem Mac; ein Cloud-Schedule (`/schedule`) könnte den Lauf zwar
zeitgesteuert *anstoßen*, aber die Bildgenerierung selbst nicht ausführen,
da sie nicht in der Cloud verfügbar ist. Wer eine wirklich unbeaufsichtigte
Wiederholung will, braucht einen lokalen Trigger (z. B. `launchd`/`cron` auf
diesem Mac, der eine Claude-Code-Session mit diesem Skill anstößt) — das ist
hier bewusst nicht eingerichtet, weil unklar war, wie oft/ob gewünscht.
