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

**Aktuelle Richtung: „Maison Augé"** (entschieden 2026-09-23, über
`/app-art-director`, Referenz https://maisonauge.com/). Bewusste Abweichung
von der älteren Fliederblau/Karten-Richtung — `docs/app_redesign.jpg` und
`docs/design-system.md` sind gelöscht, nicht mehr gültig.

**Lies `HANDOFF-maison-auge.md` im Repo-Root, bevor du Oberflächen-Code
schreibst.** Es trägt Tokens, Signature-Elemente, Navigation und die
Artefakt-Links (Screens, Typografie-System, Komponenten-Specimen), bis
`impeccable-documenter` am Ende von Phase 4 ein `DESIGN.md` bzw.
`.impeccable/design.json` aus dem fertigen Code schreibt — danach ist das
die Quelle, nicht mehr die Handoff-Datei.

## Nicht verhandelbar

1. **Nur Tokens.** Farben und Radien stehen in `src/app/globals.css`. Kein
   Hex-Wert im Komponentencode.
2. **Radius überall 0px** — das Signature-Element. Einzige Ausnahme: native
   Segmented Control (8px, Systemcontrol).
3. **`--card` = `--bg`.** Flächen trennen sich über `--border` (Haarlinie),
   nicht über Schatten. `--shadow-card` ist `none`. Braucht ein Bedienelement
   auf `--bg` eine Fläche, nimmt es `--soft`, nicht `--card`.
4. **`--accent` = `--text`.** Kein separater Markenton — CTAs sind
   Navy-Flächen. Fehler und Löschen laufen über `--danger`.
5. **Eine einzige Schriftfamilie** (Hanken Grotesk). Hierarchie nur über
   Gewicht/Größe, nie über Genre oder Kursive.
6. Untergrenzen unabhängig von der Richtung: 16 px in Eingabefeldern
   (sonst zoomt iOS hinein), 44 px Trefferfläche, 15 px Fließtext.
7. **Sichtbare Größe ≠ Trefferfläche.** Ein kleines Symbol bekommt seine 44 px
   über Padding, nicht über mehr Durchmesser.
8. **Kein Text auf einem Foto**, außer kleinen Icon-Badges (Zurück, Bearbeiten,
   „Auf der Liste"). Titel stehen daneben oder darunter.
9. **Keine Web-Muster.** Kein pulsierendes Skelett, kein Emoji als Symbol,
   kein Standard-Fokusring des Browsers. Versalsatz mit Sperrsatz IST hier
   Teil der Richtung (Wordmark, Überschriften, Caption, Navigation,
   Button-Label) — siehe Typo-Skala unten, keine Web-Pattern-Ausnahme.
10. **Jede Animation braucht `prefers-reduced-motion: reduce`.**
11. **Kein Dark Mode.** Die Referenz zeigt nur Hell.

## Wenn du abweichen willst

Das kann berechtigt sein — aber dann ändert sich **zuerst
`HANDOFF-maison-auge.md`** (bzw. `DESIGN.md`, sobald es existiert) und danach
der Code, mit Begründung im selben Commit. Eine Abweichung, die nur im Code
steht, ist keine Entscheidung, sondern Drift.
