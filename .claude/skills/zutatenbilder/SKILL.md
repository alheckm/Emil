---
name: zutatenbilder
description: Fehlende Zutatenbilder für aktuell genutzte Zutaten (Rezepte +
  Einkaufsliste) lokal per mflux generieren und verarbeiten. Nutzen, wenn der
  Nutzer nach fehlenden/neuen Zutatenbildern fragt, "Zutatenbilder
  generieren/auffüllen" sagt, oder wenn Rezepte importiert wurden, die neue
  Zutaten angelegt haben. Auch einschlägig für die Design-Exploration der
  "Marktregal"-Richtung (vollbild/grau/bold-Varianten, siehe unten).
---

# Zutatenbilder — zwei getrennte Modi

Dieser Skill deckt zwei unabhängige Dinge ab, die beide mflux + `subjects.mjs`
nutzen, aber unterschiedliche Ziele und Ausgabeorte haben. Nicht vermischen.

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
