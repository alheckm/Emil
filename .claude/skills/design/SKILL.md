---
name: design
description: Emils Gestaltung — verbindliche Regeln für Farbe, Schrift, Maß,
  Radius, Schatten, Bewegung, Zustände und Ladeverhalten. Vor JEDER Änderung an
  der Oberfläche zu laden: Screens unter src/app/, Bausteine in
  src/components/, Tokens in src/app/globals.css, jede neue Komponente, jede
  Änderung an Abständen, Größen oder Animationen. Auch laden, wenn eine Aufgabe
  nur beiläufig etwas Sichtbares berührt — etwa ein Ladezustand, eine
  Fehlermeldung oder ein Knopf in einem Formular.
---

# Emils Gestaltung

`docs/app_redesign.jpg` ist die **Design-Spezifikation, nicht die
Inspiration**. `docs/design-system.md` übersetzt sie in Regeln.

**Lies `docs/design-system.md`, bevor du Oberflächen-Code schreibst.** Die
Abschnitte, die du je nach Aufgabe brauchst:

| Aufgabe | Abschnitt |
|---|---|
| Irgendetwas messen oder Größen wählen | 2 (Maßstab) und 5 (Skala) |
| Knopf, Aktion, Formular | 3 (Zwei Register) und 7 |
| Farbe wählen | 4 |
| Neue Komponente | 6, 7, 10 |
| Symbol zeichnen | 8 |
| Animation, Ladezustand, Platzhalter | 9 |
| Kontrast, Tastatur, Screenreader | 11 |
| Was noch offen ist | 12 |
| Fertig? | 13 (Prüfliste) |

## Nicht verhandelbar

1. **Nur Tokens.** Farben, Radien und Schatten stehen in `src/app/globals.css`.
   Kein Hex-Wert im Komponentencode. Kein Maß außerhalb der Skala in
   Abschnitt 5 — und wenn eines fehlt, kommt es erst ins Dokument, dann in den
   Code.
2. **Die Referenz nicht mit dem Lineal auslesen.** Sie ist ein Mockup, die
   Handyfläche darin ~291 px gegen 390 pt auf dem Gerät (Faktor ≈ 1,34).
   Übertragen werden Proportionen. Untergrenzen: 16 px in Eingabefeldern,
   44 px Trefferfläche, 15 px Fließtext.
3. **Karten nur in der Rezeptübersicht.** `--card` mit `--shadow-card` fasst
   dort jede Rezeptvorschau. Überall sonst (Rezept-Screen, Einkauf, Werkzeug)
   läuft `--bg` ohne Karte durch. Braucht ein Bedienelement auf `--bg` eine
   Fläche, nimmt es `--soft`, nicht `--card`.
4. **`--accent` ist Markenfarbe**, kein Warnton. CTA-Pillen, Ziffernkasten,
   Icon-Badges auf Fotos. Fehler und Löschen laufen über `--danger`.
   `--accent` nie als dünne Linie oder Text direkt auf `--bg` — der Kontrast
   reicht dafür nicht (Abschnitt 4).
5. **Zwei Register.** Rezept und Einkauf: leise Aktionen neben dem Inhalt, kein
   bildschirmbreiter Knopf — eine schmale Gold-Pille ist erlaubt. Anmelden,
   Formulare, Einstellungen: eindeutiger breiter Knopf. Nie vermischen.
6. **Sichtbare Größe ≠ Trefferfläche.** Ein 32-px-Kreis bekommt seine 44 px
   über Padding, nicht über mehr Durchmesser.
7. **Kein Text auf einem Foto**, außer kleinen Icon-Badges (Zurück, Bearbeiten,
   „Auf der Liste"). Titel stehen daneben oder darunter.
8. **Keine Web-Muster.** Kein pulsierendes Skelett, kein Emoji als Symbol,
   kein Versalsatz mit Sperrsatz als Überschrift, kein Standard-Fokusring des
   Browsers.
9. **Jede Animation braucht `prefers-reduced-motion: reduce`.**

## Wenn du abweichen willst

Das kann berechtigt sein — aber dann ändert sich **zuerst
`docs/design-system.md`** und danach der Code, mit Begründung im selben Commit.
Eine Abweichung, die nur im Code steht, ist keine Entscheidung, sondern Drift.

Abschnitt 12 führt die Stellen, an denen die App dem System noch nicht
entspricht. Wer eine davon anfasst, streicht sie dort.
