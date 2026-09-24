# Emil

## Gestaltung — vor jeder Änderung an der Oberfläche

**Festgeschriebene Richtung: Instagram-Baseline, seit 2026-09-24.** Single
Source of Truth ist `DESIGN.md` plus der darin verlinkte Design-Canvas
(Screens, Typografie- und Komponenten-Specimen). Der komplette Rebuild von
`src/app/`, `src/components/` und `src/app/globals.css` auf diese Richtung ist
umgesetzt (Tokens, Home-Feed, Rezeptdetail, Einkaufsliste als Foto-Kreise im
Story-Raster, Aufgaben, Konto, Import). Wer die Oberfläche weiter anfasst, hält sich
an `DESIGN.md`, statt aus Gedächtnis oder alten Code-Konventionen (Maison
Augé, radiuslos, Versalien) zu improvisieren. Nur wenn der Nutzer ausdrücklich
eine neue Richtung will, geht es über den Skill `app-art-director` (bzw.
`design`) neu los.

Direction-unabhängige Untergrenzen, die trotzdem immer gelten:

- 16 px Schrift in Eingabefeldern (sonst zoomt iOS hinein).
- 44 px Trefferfläche, 15 px Fließtext.
- Bewegung: 120–250 ms, `ease-out`, `prefers-reduced-motion` immer mitbedacht.
- Keine pulsierenden Skelette, keine Emojis als Symbole, keine Systemschrift.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
