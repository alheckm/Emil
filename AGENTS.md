# Emil

## Gestaltung — vor jeder Änderung an der Oberfläche

**Keine festgeschriebene Richtung aktuell.** Frühere Design-Dokumente
(`docs/design-system.md`, `docs/app_redesign.jpg`, `DESIGN.md`,
`HANDOFF-maison-auge.md`) wurden am 2026-09-24 auf Nutzerwunsch gelöscht —
Neustart. Wer etwas unter `src/app/`, `src/components/` oder an
`src/app/globals.css` anfasst, ohne dass eine neue Richtung entschieden ist,
sollte zuerst über den Skill `app-art-director` (bzw. `design`) eine Richtung
festlegen lassen, statt aus dem Gedächtnis oder aus Code-Konventionen zu
improvisieren.

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
