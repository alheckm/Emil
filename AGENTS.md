# Emil

## Gestaltung — vor jeder Änderung an der Oberfläche

`docs/design-system.md` ist verbindlich. `docs/app_redesign.jpg` ist die
**Spezifikation, nicht die Inspiration**: Weicht eine Umsetzung ab, wird die
Umsetzung korrigiert und nicht die Abweichung zur Designentscheidung erklärt.
(`docs/app_design.jpg` ist die frühere Referenz, nur noch zur historischen
Einordnung — nicht mehr verbindlich, siehe design-system.md Abschnitt 12.)

Wer etwas unter `src/app/`, `src/components/` oder an `src/app/globals.css`
anfasst, liest das Dokument vorher — der Skill `design` lädt es.

Die Regeln, die am schnellsten verloren gehen:

- **Nur Tokens.** Farbe, Radius, Schatten kommen aus `globals.css`. Kein
  Hex-Wert im Komponentencode, keine Maße außerhalb der Skala in Abschnitt 5.
- **Die Referenz nicht abmessen.** Das JPEG ist ein Mockup im Maßstab ~1:1,34.
  Untergrenzen: 16 px Schrift in Eingabefeldern (sonst zoomt iOS hinein),
  44 px Trefferfläche, 15 px Fließtext.
- **Das Grau im JPEG ist nicht die App.** Es ist die Fläche, auf der die beiden
  iPhone-Screenshots liegen. Gemessen wird *innerhalb* der Gerätekanten —
  dort aber gibt es diesmal echt zwei Flächen (`--bg` und `--card`), keine
  Fehllesung wie beim alten Bild (design-system.md Abschnitt 2).
- **Karten nur in der Rezeptübersicht.** `--card` mit `--shadow-card` fasst
  dort jede Rezeptvorschau. Überall sonst (Rezept-Screen, Einkauf, Werkzeug)
  läuft `--bg` ohne Karte durch. Was eine Bedienfläche auf `--bg` braucht,
  nimmt `--soft`, nicht `--card`.
- **`--accent` ist jetzt Markenfarbe**, kein reiner Warnton mehr — CTA-Pillen,
  Ziffernkasten, Icon-Badges. Fehler/Löschen bleiben `--danger`. `--accent`
  nie als dünne Linie oder Text direkt auf `--bg` (Kontrast, siehe
  design-system.md Abschnitt 4).
- **Keine bildschirmbreiten CTA-Knöpfe auf Rezept- und Einkaufsscreens.** Dort
  stehen Aktionen leise neben dem Inhalt — auch als gefüllte Gold-Pille erlaubt,
  solange sie nicht bildschirmbreit ist. Breite Knöpfe gehören in Formulare
  (Abschnitt 3, „Zwei Register").
- **Kein Dark Mode aktuell.** Die neue Referenz zeigt nur Hell; der alte dunkle
  Modus passt nicht zur neuen Farbfamilie und ist vorläufig entfernt.
- **Keine pulsierenden Skelette, keine Emojis als Symbole, keine Systemschrift.**

Bewegung: 120–250 ms, `ease-out`, `prefers-reduced-motion` immer mitbedacht.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
