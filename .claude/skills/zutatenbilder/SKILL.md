---
name: zutatenbilder
description: Fehlende Zutatenbilder für aktuell genutzte Zutaten (Rezepte +
  Einkaufsliste) lokal per mflux generieren und verarbeiten. Nutzen, wenn der
  Nutzer nach fehlenden/neuen Zutatenbildern fragt, "Zutatenbilder
  generieren/auffüllen" sagt, oder wenn Rezepte importiert wurden, die neue
  Zutaten angelegt haben.
---

# Zutatenbilder auf Bedarf generieren

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
   (mflux, lokal, ~10–15 s Modell laden + ~40 s pro Bild bei 4 Schritten)
   und danach `process.py` auf, das die Rohbilder zu 192-px-WebP-Chips
   zuschneidet und `ingredientImages.ts` neu schreibt.

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
