# Emil

## Gestaltung — vor jeder Änderung an der Oberfläche

`docs/design-system.md` ist verbindlich. `app_design.jpg` im Projektstamm ist
die **Spezifikation, nicht die Inspiration**: Weicht eine Umsetzung ab, wird die
Umsetzung korrigiert und nicht die Abweichung zur Designentscheidung erklärt.

Wer etwas unter `src/app/`, `src/components/` oder an `src/app/globals.css`
anfasst, liest das Dokument vorher — der Skill `design` lädt es.

Die sechs Regeln, die am schnellsten verloren gehen:

- **Nur Tokens.** Farbe, Radius, Schatten kommen aus `globals.css`. Kein
  Hex-Wert im Komponentencode, keine Maße außerhalb der Skala in Abschnitt 5.
- **Die Referenz nicht abmessen.** Das JPEG ist ein Mockup im Maßstab ~1:1,47.
  Untergrenzen: 16 px Schrift in Eingabefeldern (sonst zoomt iOS hinein),
  44 px Trefferfläche, 15 px Fließtext.
- **Karten ohne Umrandung** — warme Fläche auf grauem Canvas, weicher Schatten.
  Eine Linie darum herum ist das Material-Kärtchen, das der Entwurf vermeidet.
- **Keine Akzentfarbe.** `--accent` ist ein Warnton für Löschen und Fehler,
  keine Marke. Farbe trägt das Essen.
- **Keine bildschirmbreiten CTA-Knöpfe auf Rezept- und Einkaufsscreens.** Dort
  stehen Aktionen leise neben dem Inhalt. Breite Knöpfe gehören in Formulare
  (Abschnitt 3, „Zwei Register").
- **Keine pulsierenden Skelette, keine Emojis als Symbole, keine Systemschrift.**

Bewegung: 120–250 ms, `ease-out`, `prefers-reduced-motion` immer mitbedacht.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
