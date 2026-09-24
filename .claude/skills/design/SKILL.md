---
name: design
description: Emils Gestaltung — verbindliche Regeln für Farbe, Schrift, Maß,
  Radius, Bewegung, Zustände und Ladeverhalten. Vor JEDER Änderung an der
  Oberfläche zu laden: Screens unter src/app/, Bausteine in src/components/,
  Tokens in src/app/globals.css, jede neue Komponente, jede Änderung an
  Abständen, Größen oder Animationen. Auch laden, wenn eine Aufgabe nur
  beiläufig etwas Sichtbares berührt — etwa ein Ladezustand, eine
  Fehlermeldung oder ein Knopf in einem Formular.
---

# Emils Gestaltung

**Festgeschriebene Richtung: Instagram-Baseline, seit 2026-09-24.** Single
Source of Truth ist `DESIGN.md` (Farben, Typografie, Radien, Komponenten) plus
der darin verlinkte Design-Canvas. Der Rebuild darauf ist umgesetzt. Baue auf
`DESIGN.md` und den bestehenden Komponenten (`src/components/ui.tsx`,
`icons.tsx`) auf, statt neue Farben/Radien/Komponenten-Looks zu erfinden. Nur
wenn der Nutzer ausdrücklich eine neue Richtung will, lass sie zuerst über
`/app-art-director` entscheiden.

## Nicht verhandelbar (direction-unabhängig)

1. 16 px Schrift in Eingabefeldern (sonst zoomt iOS hinein), 44 px
   Trefferfläche, 15 px Fließtext.
2. **Sichtbare Größe ≠ Trefferfläche.** Ein kleines Symbol bekommt seine 44 px
   über Padding, nicht über mehr Durchmesser.
3. **Keine Web-Muster.** Kein pulsierendes Skelett, kein Emoji als Symbol,
   kein Standard-Fokusring des Browsers, keine Systemschrift.
4. **Jede Animation braucht `prefers-reduced-motion: reduce`.** Bewegung
   generell 120–250 ms, `ease-out`.
