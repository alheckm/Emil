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

`app_design.jpg` im Projektstamm ist die **Design-Spezifikation, nicht die
Inspiration**. `docs/design-system.md` übersetzt sie in Regeln.

**Lies `docs/design-system.md`, bevor du Oberflächen-Code schreibst.** Das
Dokument ist rund 480 Zeilen; die Abschnitte, die du je nach Aufgabe brauchst:

| Aufgabe | Abschnitt |
|---|---|
| Irgendetwas messen oder Größen wählen | 2 (Maßstabsfehler) und 5 (Skala) |
| Knopf, Aktion, Formular | 3 (Zwei Register) und 7 |
| Farbe wählen | 4 |
| Neue Komponente | 6, 7, 10 |
| Symbol zeichnen | 8 |
| Animation, Ladezustand, Platzhalter | 9 |
| Kontrast, Tastatur, Screenreader | 11 |
| „Warum steht das nicht so im Master-Prompt?" | 12 |
| Was noch umzubauen ist | 13 |
| Fertig? | 14 (Prüfliste) |

## Nicht verhandelbar

1. **Nur Tokens.** Farben, Radien und Schatten stehen in `src/app/globals.css`.
   Kein Hex-Wert im Komponentencode. Kein Maß außerhalb der Skala in
   Abschnitt 5 — und wenn eines fehlt, kommt es erst ins Dokument, dann in den
   Code.
2. **Die Referenz nicht mit dem Lineal auslesen.** Sie ist ein 1000-px-Mockup,
   die Handyfläche darin ~265 px gegen 390 pt auf dem Gerät. Übertragen werden
   Proportionen. Untergrenzen: 16 px in Eingabefeldern, 44 px Trefferfläche,
   15 px Fließtext.
3. **Es gibt keine Karten.** Ein warmes Off-White (`--bg`) läuft durch den
   ganzen Screen — kein zweiter Hintergrund, kein Schatten, keine Umrandung um
   einen Inhaltsblock. Das Grau in `app_design.jpg` ist die Fläche, auf der die
   beiden iPhone-Screenshots liegen, nicht die App. Gemessen wird innerhalb der
   Gerätekanten. Braucht ein Bedienelement eine Fläche, nimmt es `--soft`.
4. **Keine Akzentfarbe.** `--accent` erscheint an Löschen und Fehlern, sonst
   nirgends. Die Farbe im Screen kommt aus dem Essen.
5. **Zwei Register.** Rezept und Einkauf: leise Aktionen neben dem Inhalt, kein
   bildschirmbreiter Knopf. Anmelden, Formulare, Einstellungen: eindeutiger
   breiter Knopf. Nie vermischen.
6. **Sichtbare Größe ≠ Trefferfläche.** Ein 32-px-Kreis bekommt seine 44 px
   über Padding, nicht über mehr Durchmesser.
7. **Keine Web-Muster.** Kein pulsierendes Skelett, kein Emoji als Symbol,
   keine Systemschrift, kein Versalsatz mit Sperrsatz als Überschrift, kein
   Standard-Fokusring des Browsers.
8. **Jede Animation braucht `prefers-reduced-motion: reduce`.**

## Wenn du abweichen willst

Das kann berechtigt sein — aber dann ändert sich **zuerst
`docs/design-system.md`** und danach der Code, mit Begründung im selben Commit.
Eine Abweichung, die nur im Code steht, ist keine Entscheidung, sondern Drift.

Abschnitt 13 führt die Stellen, an denen die App dem System noch nicht
entspricht. Wer eine davon anfasst, streicht sie dort.
