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

## Blocker — WICHTIG, zuerst klären

Ab einem bestimmten Punkt in der Session konnte ich `src/app/` und zuletzt
auch `docs/` nicht mehr lesen/beschreiben — `ls`/`cat`/Read-Tool liefern
„Operation not permitted", obwohl `stat`/`ls -la` normale Unix-Rechte zeigen
(`0644`, eigener User). `xattr -l` scheitert ebenfalls mit „Operation not
permitted" → sieht nach einer macOS-Zugriffssperre aus (com.apple.macl-artig,
typisch wenn eine sandboxte App wie Xcode die Datei/das Verzeichnis mal
angefasst hat), NICHT nach einem Claude-Code-Sandbox-Thema — ein
`dangerouslyDisableSandbox`-Override half nicht. Der Zugriffsverlust hat sich
während der Session ausgebreitet (erst nur `globals.css`, dann ganz `src/app/`,
dann `docs/`) — Ursache unklar, evtl. ein Tool/Prozess auf dem Rechner des
Nutzers, das gerade läuft (iCloud-Sync? Time Machine? Editor mit App-Sandbox?).

**Vor dem Weitermachen prüfen:** ob der Zugriff in einer neuen Session wieder
da ist. Falls nicht: Nutzer muss auf seiner Seite schauen (z. B. Terminal/die
App, die Claude Code ausführt, unter Systemeinstellungen → Datenschutz &
Sicherheit → Vollzugriff auf Festplatte freigeben, oder prüfen was die
Sperre gesetzt hat).

## Workaround-Datei liegt bereit

`globals.new.css` im Projekt-Root enthält den fertigen `@theme`-Token-Block
für `src/app/globals.css` (Tailwind-v4-Konvention `--color-*`/`--radius-*`/
`--font-*`, abgeleitet aus den Tailwind-Klassen in `ListView.tsx`) — muss
manuell übernommen werden, sobald der Zugriff wieder da ist. Datei danach
löschen.

## Offen — Projekt-eigenes Setup, das noch geprüft werden muss

- **Impeccable ist in diesem Projekt eingerichtet** (Hooks, `.impeccable/`
  Live-Sessions, Detektoren). Nutzer hat sich explizit für dessen Workflow
  entschieden: **erst echte Next.js-Screens bauen, DANACH automatisch
  DESIGN.md aus dem fertigen Code ableiten lassen** (nicht: DESIGN.md zuerst
  als Vertrag schreiben — das ist Impeccables eigene Regel, siehe
  `reference/new-work.md`: „ein Regelwerk, das vor dem Bau geschrieben wird,
  verteidigt sich gegen die Realität, statt sie zu beschreiben").
- Zum Abschluss: `impeccable-documenter`-Subagent spawnen, der DESIGN.md +
  `.impeccable/design.json` aus dem fertigen Build schreibt (siehe
  `reference/new-work.md` Abschnitt 7 „Inspect and finish").
- Alte, jetzt überholte Doku existiert parallel: `docs/design-system.md`
  (altes Fliederblau/Karten-System), eine lose `DESIGN.md` im Root
  (Marktregal/Gold-Richtung, von Impeccable nicht als valide erkannt —
  `designPath: null` bei `impeccable context`) und `.impeccable/design.json`
  (ebenfalls Marktregal-Richtung). Alle drei sind Anti-Referenz für die neue
  Richtung, nicht Autorität — sollten am Ende bereinigt/ersetzt werden.

## Nächste konkrete Schritte nach Neustart

1. Zugriff auf `src/app/` und `docs/` prüfen.
2. `globals.new.css` → `src/app/globals.css` übernehmen (siehe Datei-Kopf).
3. Hanken-Grotesk-Dateien selbst hosten (nicht Google-Fonts-CDN, siehe
   Begründung in `globals.new.css`) — Download-Hinweis steht dort.
4. Echte Screens bauen: Rezeptübersicht, Rezept-Detail, Einkaufsliste
   (3-Spalten), Tab-Bar (Liste/Rezepte/Todos/Konto) — Vorlage sind die vier
   Artefakte oben, Komponenten-Zustände aus Artefakt 4.
5. Mit Screenshots gegenprüfen (Kritik-Schleife, Top-5-Schwächen beheben).
6. `impeccable-documenter` spawnen → DESIGN.md + design.json schreiben.
7. Alte Doku (`docs/design-system.md`, lose `DESIGN.md`, altes
   `.impeccable/design.json`) aufräumen/ersetzen.
