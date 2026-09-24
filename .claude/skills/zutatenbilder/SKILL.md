---
name: zutatenbilder
description: Fehlende Zutatenbilder für aktuell genutzte Zutaten (Rezepte +
  Einkaufsliste) lokal per mflux generieren und verarbeiten — die
  "Marktregal"-Bildfamilie (vollbild/grau/bold), von der die App aktuell die
  -bold-Variante als Foto-Kreis in der Einkaufsliste zeigt. Nutzen, wenn der
  Nutzer nach fehlenden/neuen Zutatenbildern fragt, "Zutatenbilder
  generieren/auffüllen" sagt, oder wenn Rezepte importiert wurden, die neue
  Zutaten angelegt haben. Auch einschlägig für die Design-Exploration
  einzelner Zutaten (siehe Modus 2 unten).
---

# Zutatenbilder — zwei Modi

Dieser Skill deckt zwei Dinge ab, die beide mflux + `subjects.mjs` nutzen,
aber unterschiedliche Ziele, Ausgabeorte und Lebenszyklen haben. Nicht
vermischen.

**Historie:** Bis 2026-09-24 gab es eine zweite, ältere Bildfamilie —
Pastell-Chip-Kreise (`process.py`, `public/zutaten/`), die einzige Variante
pro Zutat mit fest eingebranntem Pastellhintergrund. Auf Nutzerwunsch komplett
abgelöst durch die Marktregal-Bildfamilie unten: Bilder gelöscht, Skripte
(`generate.py`, `process.py`, `find-missing.mjs`, `palette.json`) entfernt.
Falls du in Git-Historie oder alten Notizen auf `process.py`/`COVER`/
Pastell-Chips triffst: das ist erledigte Vergangenheit, keine Anleitung.

## Modus 1: Produktion, auf Bedarf

Erzeugt zu jeder Zutat drei Bildvarianten — vollbild/grau/bold — und
veröffentlicht sie unter `public/zutaten-marktregal/`. Die App
(`ingredientImage()`, `src/lib/core/ingredientImages.ts`) nutzt aktuell nur
**-bold** als runder Foto-Kreis in der Einkaufsliste (`ListView.tsx`,
`object-cover` croppt das hochkant generierte Bild per CSS). vollbild/grau
werden mitgeneriert, weil sie für eine spätere Kachel-Oberfläche vorgesehen
sind (`DESIGN.md`), aber noch nicht konsumiert werden — nicht wundern, wenn
nur die -bold-Datei irgendwo im App-Code auftaucht.

### Scope: "durably used", nicht nur "gerade aktiv"

`find-missing-marktregal.mjs` fragt nicht nach Zutaten, die gerade in
`recipe_ingredients`/`shopping_list_entries` stehen, sondern nach allen
Zutaten mit gesetzter `household_id` in der `ingredients`-Tabelle (union mit
den gerade aktiven globalen Seed-Zutaten). Grund: `set_entry_checked`
(`supabase/migrations/0016_abgehaktes_begrenzen.sql`) löscht abgehakte
Einkaufslisten-Zeilen, sobald mehr als 20 pro Liste abgehakt sind — eine nur
von Hand hinzugefügte Zutat kann so aus der Liste verschwinden, bevor ein Lauf
sie je sieht. Die `ingredients`-Zeile selbst bleibt dabei aber stehen (wird
nie gelöscht), das ist der verlässliche Ledger. Die reinen ~350 globalen
Seed-Zutaten, die noch nie ein Haushalt angefasst hat, bleiben trotzdem außen
vor — kein Vorrats-Rendering.

### Ausführen

```
npm run zutatenbilder
```

Das ist `find-missing-marktregal.mjs --generate`. Ablauf:

1. Fragt die Datenbank nach dem oben beschriebenen Scope, vergleicht das mit
   `public/zutaten-marktregal/` und liefert zwei Listen: **bereit** (hat
   Bildmotiv in `subjects.mjs`, direkt oder über `aliases.json`) und
   **braucht Agenten-Entscheidung** (noch keines von beidem — siehe unten).
2. Ist die "braucht Agenten-Entscheidung"-Liste NICHT leer, generiert das
   Skript trotzdem für den Rest, bricht aber nicht ab — behandle diese Liste
   danach von Hand (Schritt "Agenten-Entscheidung" unten) und lauf den Befehl
   erneut, um auch diese Zutaten mitzunehmen.
3. Für die restlichen ("bereit"): ruft `generate-marktregal.py` auf —
   verwendet vorhandene Rohbilder aus `design/ingredients_directions/` oder
   `raw-marktregal/` wieder, generiert den Rest per mflux (lokal, ~10–15 s
   Modell laden + ~60–100 s pro Bild bei 4 Schritten, 768×1024 Hochformat,
   landet gitignored in `raw-marktregal/`), skaliert auf max. 640 px lange
   Kante und veröffentlicht als WebP unter `public/zutaten-marktregal/` — pro
   Bild sofort committet + gepusht (nicht erst am Batch-Ende).
4. Schreibt danach `src/lib/core/ingredientImages.ts` neu
   (`publish-map.mjs`) und committet + pusht das ebenfalls.

Braucht `SUPABASE_SECRET_KEY` in `.env.local` (umgeht RLS) und die lokale
mflux-Installation unter `~/.mflux/venv`.

Nur listen, ohne zu generieren: `npm run zutatenbilder:check`.

### Agenten-Entscheidung (für Zutaten ohne Bildmotiv)

Für jeden Namen in "braucht Agenten-Entscheidung" triffst *du* (der Agent,
der diesen Skill ausführt) eine von drei Entscheidungen — das ist der Teil,
der sich nicht deterministisch skripten lässt:

- **Alias** (`aliases.json` → `aliases`): nur wenn das Foto
  *ununterscheidbar* wäre, nicht bloß "verwandt". Beispiel:
  `"Gemüsebrühepulver": "Gemüsebrühe"`. Falsch wäre z. B.
  `"Tomatenmark": "Tomate"` — Paste sieht anders aus als die Frucht.
  Pulver/Flüssigkeit/Paste sind fast immer eigene Fotos.
- **Skip** (`aliases.json` → `skipped`, mit Begründung): Test-Fixtures,
  Sammelkategorien, mehrdeutige Freitext-Kombinationen (z. B. "Salz und
  Pfeffer" — keine eindeutige Zuordnung ohne die andere Zutat falsch
  darzustellen). Ohne Eintrag wird derselbe Name bei jedem Lauf neu geprüft.
- **Neues Motiv**: `SUBJECTS`- *und* `COLORS`-Eintrag in `subjects.mjs`
  ergänzen (beides Pflicht — ohne `COLORS`-Eintrag greift der
  `"yellow"`-Default in `colorFor()`, und das kollidiert mit Gold =
  `--accent`). Bei Gefäß-Zutaten (Pulver, Öl, Sauce) `BOWL()`/`JAR()`/
  `GLASS()` aus `subjects.mjs` verwenden, sonst rendert das Modell einen
  Haufen Staub im Nichts.

Danach `npm run zutatenbilder` erneut laufen lassen, bis "braucht
Agenten-Entscheidung" leer ist (`npm run zutatenbilder:check` zum reinen
Prüfen).

### Danach

- Kurz stichprobenhaft prüfen (z. B. mit dem Read-Tool ein, zwei neue
  `public/zutaten-marktregal/<slug>-bold.webp` ansehen): freigestelltes
  Studiofoto auf kräftigem Farbgrund passend zur Zutatenkategorie, echter
  Kontaktschatten, Motiv mittig mit Rand oben/unten.
- Alles committen und pushen (siehe Nutzer-Vorgabe: nach jedem Arbeitsschritt
  direkt nach `main`) — `generate-marktregal.py` und `publish-map.mjs` tun
  das im `--generate`-Lauf bereits selbst pro Bild bzw. am Ende.

## Modus 2: Design-Exploration

Für einzelne, namentlich angegebene Zutaten drei Bildvarianten zum Vergleich
erzeugen — **nicht** auf Bedarf für alle Zutaten, sondern gezielt für die,
die gerade zur Diskussion stehen (z. B. bevor ein neues Motiv in
`subjects.mjs` aufgenommen wird, oder um eine Prompt-Änderung zu testen).

```
~/.mflux/venv/bin/python scripts/ingredient-images/design-variants.py --names "Erdbeeren,Brot"
```

Namen exakt wie die Schlüssel in `subjects.mjs` `SUBJECTS` (meist Plural bei
zählbaren Zutaten: "Erdbeeren", nicht "Erdbeere"). Siehe
`scripts/ingredient-images/design-variants.py` für die volle Herleitung;
kurz:

1. **vollbild** — Motiv füllt den ganzen Rahmen bis zum Rand, kein Hinter-
   grund sichtbar (Kachel-Kandidat für die spätere Kachel-Oberfläche).
2. **grau** — Motiv freigestellt auf hellgrauem Studio-Grund (`#E8E8E8`).
3. **bold** — Motiv freigestellt auf kräftigem Farbgrund, automatisch aus
   genau vier Tönen gewählt (`scripts/ingredient-images/design-palette.json`),
   passend zur Eigenfarben-Kategorie der Zutat (`subjects.mjs` `COLORS`) —
   das ist dieselbe Prompt-Logik wie in Modus 1, nur nicht veröffentlicht.

Ergebnis liegt unter `design/ingredients_directions/<slug>-{vollbild,grau,
bold}.png` — ein reiner Design-Ordner, getrennt von
`public/zutaten-marktregal/`. Fließt nicht automatisch in die
Produktions-Pipeline, wird von `generate-marktregal.py` aber als Rohbild
wiederverwendet, falls dort schon ein passender Name liegt (spart einen
mflux-Lauf).

**Danach prüfen:** vollbild — Zutat trotz Extrem-Crop erkennbar, wirklich
kein Hintergrund an den Rändern sichtbar (bei Einzelstücken wie Brot der
kritische Fall, bei Haufen-Zutaten wie Beeren einfacher). grau/bold — Farbe
trifft die Zielfamilie (Eckpixel mit PIL/`~/.mflux/venv/bin/python`
gegenprüfen lohnt sich, das Modell driftet bei bold-Farben gern Richtung der
Eigenfarbe des Motivs, z. B. grüner Lauch → Teal statt gedecktes Salbeigrün —
die Negativ-Constraints in `design-palette.json` federn das ab, aber nicht
narrensicher).

## Automatisierung

Läuft heute nur, wenn du diesen Skill ausführst — kein Cronjob. mflux läuft
lokal auf diesem Mac; ein Cloud-Schedule (`/schedule`) könnte den Lauf zwar
zeitgesteuert *anstoßen*, aber die Bildgenerierung selbst nicht ausführen, da
sie nicht in der Cloud verfügbar ist. Wer eine wirklich unbeaufsichtigte
Wiederholung will, braucht einen lokalen Trigger (z. B. `launchd`/`cron` auf
diesem Mac, der eine Claude-Code-Session mit diesem Skill anstößt) — das ist
hier bewusst nicht eingerichtet, weil unklar war, wie oft/ob gewünscht.
