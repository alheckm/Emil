# Emil

## Gestaltung — vor jeder Änderung an der Oberfläche

**Aktuelle Richtung: „Maison Augé"** (entschieden 2026-09-23, über
`/app-art-director`). Das ist eine bewusste, vom Nutzer bestätigte Abweichung
von der älteren Fliederblau/Karten-Richtung. `docs/design-system.md` und
`docs/app_redesign.jpg` sind deshalb gelöscht — sie beschrieben die alte
Richtung und wären als Referenz irreführend.

**Solange kein `DESIGN.md` bzw. `.impeccable/design.json` die neue Richtung
trägt** (das schreibt `impeccable-documenter` erst am Ende von Phase 4 des
`app-art-director`-Skills, aus dem fertigen Code), ist `HANDOFF-maison-auge.md`
im Repo-Root die verbindliche Quelle: Tokens, Signature-Elemente, Navigation,
Artefakt-Links. Wer etwas unter `src/app/`, `src/components/` oder an
`src/app/globals.css` anfasst, liest das vorher — der Skill `design` verweist
darauf.

Die Regeln, die am schnellsten verloren gehen:

- **Nur Tokens.** Farbe, Radius kommen aus `globals.css`. Kein Hex-Wert im
  Komponentencode.
- **Radius überall 0px** — das Signature-Element dieser Richtung. Einzige
  Ausnahme: native Segmented Control (8px, Systemcontrol).
- **`--card` fällt mit `--bg` zusammen.** Flächen trennen sich über
  `--border` (Haarlinie), nicht über Schatten — `--shadow-card` ist `none`.
- **`--accent` fällt mit `--text` zusammen** — kein separater Markenton mehr.
  CTAs sind Navy-Flächen. Fehler/Löschen laufen über `--danger`.
- **Eine einzige Schriftfamilie** (Hanken Grotesk), Hierarchie nur über
  Gewicht/Größe, nicht über Genre oder Kursive.
- **Kein Dark Mode.** Die Referenz zeigt nur Hell.
- **Keine pulsierenden Skelette, keine Emojis als Symbole, keine Systemschrift.**
- 16 px Schrift in Eingabefeldern (sonst zoomt iOS hinein), 44 px
  Trefferfläche, 15 px Fließtext — diese Untergrenzen gelten unabhängig von
  der Design-Richtung.

Bewegung: 120–250 ms, `ease-out`, `prefers-reduced-motion` immer mitbedacht.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
