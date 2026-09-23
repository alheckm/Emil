# Emil-Redesign „Maison Augé" — Handoff für Session-Neustart

Stand: 2026-09-23. Entstanden über `/app-art-director`. Kompletter Verlauf nur
in der abgebrochenen Chat-Session — diese Datei ist die Rettung des Stands.

## Kontext / Entscheidung

Nutzer bat: „diesen Stil für unsere Seite übernehmen" mit Link zu
https://www.awwwards.com/sites/maison-auge → https://maisonauge.com/
(Branding-Agentur-Website, editorial/brutalistisch). Das ist eine **bewusste,
explizite Abweichung** von der bisherigen `docs/design-system.md`-Vorgabe
(altes System: Fliederblau/Karten). Nutzer hat dies ausdrücklich bestätigt
("Komplett neue Richtung entwickeln", "bewusst gegen die aktuelle
AGENTS.md-Vorgabe").

## Entschiedene Tokens (final, iteriert und vom Nutzer bestätigt)

- **Grund (bg):** `#FEF5F9` (Blush-Weiß, 1:1 von maisonauge.com computed style)
- **Tinte (text):** `#222A36` (Navy-Anthrazit)
- **Soft-Fläche (Kacheln, Select):** `#F3EFEC`
- **Taupe (dekorativ, sparsam):** `#DCCBC3`
- **Muted (Captions/Meta):** `#B99C8E`
- **Haarlinie (border):** `#E4D9D3`
- **Danger:** `#A2283A` „Editorial Crimson" (Tint `#F5DEE1`) — nach Vergleich
  von 4 Kandidaten A–D gewählt, siehe Artefakt unten.
- **Accent:** fällt bewusst mit `--text` zusammen — kein separater
  Markenton, CTAs sind Navy-Flächen (Unterschied zum alten Gold-Akzent-System).
- **Radius:** überall **0px** (das Signature-Element dieser Richtung, bewusst
  gegen `rounded-lg`-Standard). Einzige Ausnahme: native Segmented Control
  behält 8px (Systemcontrol, nicht neu gezeichnet).
- **Schrift:** **Hanken Grotesk** (SIL OFL, frei), Option A von drei
  verglichenen Kandidaten (B=Archivo, C=Schibsted Grotesk verworfen).
  Fließtext bewusst NICHT in Versalien/800 (das war ein Fehler in einer
  Zwischenversion, wurde korrigiert) — normale Groß-/Kleinschreibung, 400,
  ~15-16px, für echte Lesbarkeit bei Rezept-Fließtext.
- Original-Referenz nutzt PP Neue Montreal Bold (Pangram Pangram, kostenpflichtig
  ab 40$) — nicht lizenziert, Hanken Grotesk ist der gewählte freie Ersatz.

## Signature-Elemente

- Vertikal gestapeltes Etikett (ein Buchstabe pro Zeile) als Kategorie-Tag,
  am linken Rand jedes Screens.
- Eine einzige Schriftfamilie, Hierarchie nur über Gewicht/Größe, nicht Genre.
- Text-Link „→" statt weicher Button-Chrome für tertiäre Aktionen.
- Tab-Bar nur Text + kleiner Punkt als Aktiv-Indikator, keine Icons.

## Navigation (bestätigt)

4 Tabs: **Liste · Rezepte · Todos · Konto** (Todos ist neu, stand vorher nicht
in PRODUCT.md). Tab-Bar erscheint auf den 4 Root-Screens, NICHT auf
Detail-/Push-Screens (dort Zurück-Chevron statt Tab-Bar, iOS-Konvention).

## Artefakte (Claude-Artifacts, im Account des Nutzers, privat)

1. Vier Art-Directions (verworfen zugunsten Maison Augé):
   https://claude.ai/artifact/4dUroyXWfxy8ckxFbGUVaW
2. **Emil × Maison Augé** — Screens: Rezeptübersicht, Rezept-Detail,
   Einkaufsliste (3-Spalten-Raster), Tab-Bar:
   https://claude.ai/artifact/5tUn8P6J4v87ZuVF8bHVrE
3. **Emil Typografie-Systeme** — A/B/C-Vergleich, Hanken Grotesk gewählt:
   https://claude.ai/artifact/UerTs22haXUPrBy5bs4XTq
4. **Emil Komponenten-Specimen** — Buttons/Felder/Listen/Sheet/Leerzustand,
   Rot-Kandidaten-Vergleich, Ecken-Vergleich (eckig vs. abgerundet, eckig
   gewählt), verankert in echtem Code (`ListView.tsx` renderSheet):
   https://claude.ai/artifact/8GGAvyviEPanjui5jNfirj

## Blocker — GELÖST (2026-09-23, Folgesession)

Der Zugriff auf `src/app/` und `docs/` war in der Folgesession wieder normal
(`ls`/`Read`/`Edit` funktionieren). Ursache blieb ungeklärt, war aber
session-lokal — kein Handlungsbedarf mehr.

`globals.new.css` wurde übernommen und danach wie vorgesehen gelöscht.

## Nachträglich geklärt (Folgesession, 2026-09-23)

- **Fotos bleiben** in Rezeptübersicht und Einkaufsliste — die Mockups zeigen
  reinen Text, das war aber eine Sketch-Vereinfachung, keine Entscheidung.
  Nutzer bestätigt: Fotos behalten, **aber ohne Rahmen/Haarlinie um Foto oder
  Karte** — das Foto selbst grenzt sich ab, keine zusätzliche Border. Passt
  zum parallelen Marktregal-Bildprojekt in diesem Repo (nicht hinfällig).
- **`--muted`/`--icon-muted` bleiben `#B99C8E`** wie in den Artefakten, trotz
  nur ~2.4:1 Kontrast auf `#FEF5F9` (unter WCAG-AA 4.5:1). Nutzer bestätigt
  explizit: Optik vor Kontrast-Optimierung an dieser Stelle.
- `/todo` existierte bereits im Code (nicht neu, wie ursprünglich vermutet).
- Regel „kein Versalsatz mit Sperrsatz als Überschrift" aus dem `design`-Skill
  entfernt — widersprach der Richtung (Wordmark, Überschriften, Navigation
  sind bewusst Versalsatz + Tracking).

## Typo-Skala (System A — Hanken Grotesk, aus Artefakt 3)

| Ebene | Größe | Zeilenhöhe | Tracking | Gewicht | Versalien |
|---|---|---|---|---|---|
| Display | 56pt | 1.02 | -0.01em | 900 | ja |
| Titel | 28pt | 1.05 | -0.005em | 800 | ja |
| Überschrift | 12pt | 1.3 | 0.12em | 800, `--muted` | ja |
| Fließtext | 16pt | 1.5 | 0 | 400 | **nein** |
| Caption | 11pt | 1.4 | 0.08em | 700 | ja |
| Zahlen | 15pt | 1.2 | 0.02em | 800, tabular-nums | ja |
| Button-Label | 13pt | 1.0 | 0.10em | 800 | ja |
| Navigation | 10.5pt | 1.0 | 0.08em | 700 / 900 aktiv | ja |

Dynamic Type: Display bleibt bis „Groß" gekoppelt, dann gedeckelt (sonst
sprengt die Riesenüberschrift das Layout bei realen, langen Rezepttiteln —
`hyphens: auto` nutzen, `lang="de"` ist gesetzt). Fließtext, Caption, Zahlen,
Button, Navigation skalieren voll bis Accessibility-Stufen; Button-Label
bricht dabei zweizeilig statt abzuschneiden.

## Komponenten-Zustände (aus Artefakt 4, Phase 3b)

- **Buttons**: keine Pillen mehr — rechteckig, 52px hoch, Button-Label-Skala.
  Primär (Navy-Fläche), Sekundär (2px Navy-Outline), Tertiär (Text + „→",
  kein sichtbarer Rahmen), Destruktiv (2px Danger-Outline, **nicht** gefüllt).
  Gedrückt: Primär dunkler (`#3B4552`) + `scale(.97)`, Sekundär 8%-Navy-Tint,
  Destruktiv `--danger-tint`-Fläche. Deaktiviert: 32% Opazität. Lädt: Spinner
  + Label. **Nur ein Primärbutton pro Screen.**
- **Textfeld**: kein Kasten mehr — Unterstrich (2px Navy), Label darüber in
  Überschrift-Skala (`--muted`, Versalien). Fokus: 3px Unterstrich. Fehler:
  Unterstrich + Text in `--danger`, Fehlertext darunter. Deaktiviert: helle
  Töne. `font-size: 16px` Pflicht (iOS-Zoom).
- **Select/Menü**: eigene Liste statt natives Dropdown-Styling — Trigger mit
  1px-Navy-Rahmen, offenes Menü mit hairline-getrennten Zeilen, ausgewählte
  Zeile navy-gefüllt.
- **Segmented Control**: bleibt Systemcontrol, eigener Radius (8–10px), aktiv
  navy-gefüllt — einzige Rundungs-Ausnahme.
- **Zahlentastatur**: bleibt vollständig System-Grau, keine Markenfarben.
- **Stepper**: kein Kasten — Unterstrich 2px, `–`/`+` ohne sichtbaren
  Rahmen (44px Trefferfläche über Padding), Wert zentriert, tabular-nums.
- **Listenzeile**: Name Versalien 14.5px/700, Meta darunter Caption-Skala
  `--muted`, Menge rechtsbündig `--muted` tabular-nums. Abgehakt:
  durchgestrichen, `#C9BEB6`. Swipe: rote Fläche „Entfernen" rechts,
  Zeile verschiebt sich `translateX(-96px)`.
- **Sheet**: kein Radius oben (Token ist 0), nur `border-top` Haarlinie statt
  Schatten, zentrierter Griff, Kopfzeile mit `×`-Schließen, Zeilen
  hairline-getrennt, Herkunftszeile klein/nicht-versal, Danger-Button
  bildschirmbreit unten.
- **Notice/Hinweis**: **nicht gefüllt** — 1px-Rahmen in Tonfarbe
  (`--text`/`--danger`), Hintergrund bleibt `--card`. Kein `bg-danger/10`
  mehr wie im alten `ui.tsx`.
- **Leerzustand**: große Versal-Headline (24px/900), Beschreibung `--muted`,
  Text-Link „→" als CTA.
- **Toast**: navy-gefüllt, Haken-Icon, Versal-Label.
- **Radius, alle Belege konsistent**: 0px ist die bewusste Entscheidung,
  keine Restunsicherheit — Artefakt 4 vergleicht explizit eckig vs.
  abgerundet und empfiehlt eckig.
- `--danger-tint: #F5DEE1` ist ein eigener, entschiedener Token (Druckzustand
  Destruktiv-Button, o.ä.) — bisher nicht in `globals.css` übernommen.

## Offen — Projekt-eigenes Setup, das noch geprüft werden muss

- **Impeccable ist in diesem Projekt eingerichtet** (Hooks, `.impeccable/`
  Live-Sessions, Detektoren). Nutzer hat sich explizit für dessen Workflow
  entschieden: **erst echte Next.js-Screens bauen, DANACH automatisch
  DESIGN.md aus dem fertigen Code ableiten lassen** (nicht: DESIGN.md zuerst
  als Vertrag schreiben — das ist Impeccables eigene Regel, siehe
  `reference/new-work.md`: „ein Regelwerk, das vor dem Bau geschrieben wird,
  verteidigt sich gegen die Realität, statt sie zu beschreiben").
- ~~Alte, jetzt überholte Doku~~ — erledigt: `docs/design-system.md` und die
  lose Marktregal-`DESIGN.md` sind gelöscht/ersetzt; `DESIGN.md` +
  `.impeccable/design.json` sind jetzt aus dem fertigen Maison-Augé-Code
  abgeleitet (`impeccable-documenter`, 2026-09-23).

## Stand: Phase 4 abgeschlossen

Alle Schritte unten sind erledigt — dieser Abschnitt bleibt als
Entstehungsprotokoll stehen. **`DESIGN.md` im Repo-Root ist ab jetzt die
Quelle für Code-Entscheidungen**, nicht mehr diese Datei.

1. ~~Zugriff prüfen~~ — erledigt.
2. ~~`globals.new.css` übernehmen~~ — erledigt, Datei gelöscht.
3. ~~Hanken Grotesk einbinden~~ — erledigt über `next/font/google`
   (`src/app/layout.tsx`), kein manuelles Hosting nötig, lädt zur Bauzeit
   von derselben Domain.
4. ~~TabBar auf Text+Punkt umstellen~~ — erledigt, `src/app/(app)/TabBar.tsx`.
5. ~~`ui.tsx`-Primitives umstellen~~ — erledigt: Button rechteckig
   (primär/sekundär/tertiär/danger, mit Lade-/Deaktiviert-Zuständen), Field
   als Unterstrich, Notice gerahmt statt gefüllt. Wirkt automatisch in allen
   30 Verbraucherdateien.
6. ~~`ListView.tsx` Stepper/Sheet angleichen~~ — erledigt: bloße Ziffern/
   Vorzeichen statt Kasten, Sheet mit Ziehgriff und Haarlinie statt Schatten.
7. ~~Screenshots aller Screens gegenprüfen~~ — erledigt, live im Browser
   gegen echte Daten verifiziert; Produktionsbuild und Lint sauber.
8. ~~`impeccable-documenter` spawnen~~ — erledigt, siehe oben.

## Offen (aus DESIGN.md/dem Dokumentierer-Lauf übernommen)

- **Zwei Signature-Elemente der Richtung sind nirgends gebaut:** das
  vertikal gestapelte Kategorie-Etikett (ein Buchstabe pro Zeile, linker
  Bildschirmrand) und die kleine getrackte „EMIL"-Wordmark auf den
  Root-Screens. Beide stehen nur in den Artefakten oben, nicht im Code.
- `--muted` (`#B99C8E`) bleibt ein bestätigter, aber nicht erweiterbarer
  Kontrast-Kompromiss (~2,4:1 auf `--bg`) — nicht versehentlich auf neue
  Textrollen ausdehnen.
