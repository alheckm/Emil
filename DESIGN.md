# emil – Designsystem

## Richtung

Instagram-Baseline – Struktur und Interaktionssprache von Instagram (Feed,
Story-Ringe, Profilraster, Glas-Tabbar) übertragen auf einen
Haushalts-Kochassistenten, mit eigener Typografie statt Systemschrift.
Referenzwelt: die aktuelle Instagram-iOS-App (Grundlayout und Verhalten,
nicht die Farbmarke).

Signature-Element: Die Kreis-Zutatenbilder der Einkaufsliste, im
Instagram-Story-Raster angeordnet (nicht der farbige Story-Ring selbst — der
ist seit 2026-09-24 wieder raus, siehe unten). Erledigt wird durch Dimmen des
Fotos plus zentriertem Haken markiert, nicht als Ecken-Badge.

## Prinzipien

1. Hierarchie kommt aus Größe und Kontrast der Typografie (Unbounded groß/fett
   vs. Public Sans ruhig), nicht aus zusätzlichen Containern oder Schatten.
2. Struktur und Verhalten werden von Instagram übernommen (Feed, Story-Ringe,
   Tabbar, Profilraster), Farbe und Typografie sind eigenständig — keine
   1:1-Kopie der Marke.
3. Ein Screen, eine Hauptsache: Rezeptdetail zeigt die Portionsumrechnung
   prominent, weil das Emils Kernversprechen ist (siehe PRODUCT.md).
4. Lieber zurückhaltend und lesbar als plakativ — Unbounded wird an eng
   bemessenen Stellen (Kachel-Titel im 2-spaltigen Raster) bewusst kleiner
   gesetzt und nach 2 Zeilen mit Ellipsis abgeschnitten, statt das Layout zu
   sprengen.
5. Reale Bedienelemente auch im Mockup — echte `<button>`, `<input>` +
   `<label>`, keine Divs mit Klick-Handlern.

## Farbe

| Token | Hex | Rolle |
|---|---|---|
| ground | `#FFFFFF` | Hintergrund |
| ink | `#262626` | Primärtext, Icons |
| inkSecondary | `#8E8E8E` | Sekundärtext, Platzhalter |
| inkInactive | `#C7C7C7` | Inaktive Tab-Icons, gestrichelte Rahmen |
| line | `#EFEFEF` | Trennlinien, Kartenrahmen, Kachel-Fugen |
| surface | `#F7F7F7` | Eingabefeld-Hintergrund, Leer-/Fehlerzustand |
| accent | `#262626` | Primäraktion (Button, aktiver Tab, Haken) |
| accent-alt-blue | `#0095F6` | Alternative, falls „wie Instagram" gewünscht |
| accent-alt-red | `#ED4956` | Alternative für Signal-/Herz-Analogie |
| signal | `#C0392B` | Fehler, „Konto löschen" |

`accent` ist als Tweak/Variable angelegt, nicht hart codiert — die drei
Optionen liegen bereits in jedem Screen als Farbwähler bereit.
Kein Dark Mode (bewusste Produktentscheidung, siehe PRODUCT.md).

## Typografie

| Stufe | Schrift | Größe | Zeilenhöhe | Tracking | Gewicht |
|---|---|---|---|---|---|
| display | Unbounded | 22–28 px | 1.0–1.05 | 0 bis −1 % | 700 |
| titel | Unbounded | 20 px | 1.2–1.3 | 0 | 700 |
| abschnitt | Unbounded | 15–18 px | 1.2 | 0 | 600–700 |
| kennzahl | Unbounded, tabellarisch | 18–22 px | 1.0 | 0 | 700 |
| fließtext | Public Sans | 15 px | 1.5 | 0 | 400 |
| ui-label | Public Sans | 12.5–14 px | 1.2 | 0 | 600–700 |
| caption/meta | Public Sans | 12–13 px | 1.3 | 0 | 400–600 |
| eyebrow | Public Sans | 12 px | 1.2 | +6–8 % | 700, Versalien |

Zahlen: `font-variant-numeric: tabular-nums` überall, wo Mengen, Zeiten oder
Zähler stehen (Zeit-Chips, Nährwerte, Zutatenmengen, „X von Y erledigt").

Lizenz: beide Schriften über Google Fonts, SIL Open Font License —
uneingeschränkt in der App einbettbar.

Bekannte Grenze: Unbounded ist breit gesetzt. Titel und Kachel-Titel sind
deshalb kleiner skaliert als in einem klassischen System, Kachel-Titel
zusätzlich auf 2 Zeilen mit Ellipsis begrenzt (`-webkit-line-clamp: 2`). Wird
das im echten Betrieb zu eng, ist der Wechsel auf System B (Public
Sans/Unbounded → Instrument Sans/Bricolage Grotesque) ein reiner Font-Tausch
ohne Strukturänderung — beide Systeme liegen im Design-Canvas nebeneinander.

## Abstand & Form

Raster: 4-px-Basis. Häufige Stufen: 4, 6, 8, 10, 12, 14, 16, 18, 20, 24, 32.
Seitenränder durchgängig 20 px. Safe-Area oben 52 px reserviert, kein
simulierter Statusbalken.

Radien: 999 px (Pillen: Buttons, Chips, Avatare, Tabbar), 12–16 px
(Eingabefelder, Karten, Leer-/Fehlerzustand), 0 (Fotos im Feed und im
Kachelraster — bewusst kantig, wie bei Instagram).

## Bewegung

120–250 ms, ease-out, `prefers-reduced-motion` beachten. Bewegt: Tab-Wechsel
(Feed/Kacheln, Einfügen/Link), Checkbox-Zustand. Nie: pulsierende Skeletons
(verboten laut AGENTS.md).

## Komponenten

**Primärbutton** (schwarze Pille)
- Normal: `accent`-Hintergrund, weißer Text, 14 px/600–700.
- Gedrückt: Hintergrund `#000000` + `box-shadow: inset 0 1px 4px rgba(0,0,0,.4)`.
- Deaktiviert: Hintergrund `#EFEFEF`, Text `#B5B5B5`, kein Schatten.
- Lädt: Label wird durch drei Punkte ersetzt (kein Spinner-Ring), Breite
  bleibt fix, damit der Button nicht springt.

**Eingabefeld**
- 16 px Schrift Pflicht (sonst zoomt iOS beim Fokussieren hinein).
- Form folgt Funktion, nicht Zeilenlänge:
  - **Suche** (Home) **und „etwas hinzufügen"** (Einkaufsliste, Aufgaben):
    volle Pille, `border-radius: 999px`, `bg-border`, Icon links bei
    `left-4` absolut positioniert — dieselbe Geste wie die Suche, bewusst
    wiederverwendet statt einer eigenen Optik fürs Ergänzen (2026-09-24,
    abgelöst das gestrichelte „+" + freistehendes `<input>` von vorher).
  - **Formular** (Link-Import, Mengen, Einstellungen): gerundetes Rechteck,
    `border-radius: 12–14px` — passt zu Nachbarfeldern wie einer Textarea, die
    selbst keine Pille sein kann, und wirkt in einer Liste nicht wie ein
    zweites Suchfeld.
- Leer: `surface`-Hintergrund, `line`-Rahmen, `inkSecondary`-Platzhalter.
- Fokus: Rahmen `ink`, zusätzlich `box-shadow: 0 0 0 3px rgba(38,38,38,.08)`.
- Fehler: Rahmen `signal`, Hintergrund leicht rot getönt (`#FBEFEE`),
  Fehlertext 12 px in `signal` direkt darunter.

**Checkbox/Auswahl-Kreis** (Einkaufsliste, Aufgaben)
- Offen: 1.5 px `inkInactive`-Ring, transparent.
- Erledigt: `accent`-gefüllt, weißer Haken. Bei Foto-Kreisen (Einkaufsliste
  „Kreise"): kein Ring mehr um das Foto (Story-Ring-Mechanik entfernt,
  2026-09-24) — das Foto selbst bleibt rund, dimmt beim Abhaken, Haken sitzt
  zentriert darauf — nie als Ecken-Badge.
- Foto-Kreise ohne jeden Rahmen (2026-09-24): nur das Bild, kein Ring, kein
  Rand, keine `border`. Das Zutatenbild wird dafür ca. 5 % größer als sein
  Kreis-Container dargestellt (`scale-105` auf dem `<img>`) — die
  Pastell-Chip-Pipeline füllt den Hintergrund nur bis ~94 % des
  Kreisdurchmessers (`process.py`, `COVER`), der leichte Farbsaum am
  äußersten Bildrand wird durch den Zoom aus dem sichtbaren Kreis
  herausgeschnitten statt als grauer Saum sichtbar zu bleiben.

**Nährwert-Kreise** (Rezeptdetail)
- Nimmt das Kreis-Schema der Einkaufsliste noch einmal auf, statt Zutaten-
  Mengen als dritte Darstellung zu erfinden (2026-09-24). Vier Kreise, 68 px,
  je ein Wert (kcal, Eiweiß, Fett, Kohlenhydrate) zentriert, Label darunter
  wie bei den Foto-Kreisen.
- Farben fix, nicht gehasht — dieselben vier Nährwerte stehen immer in
  derselben Reihenfolge. Die vier Töne folgen derselben Farbfamilie wie die
  drei Kategorien, die der Design-Canvas durchfärbt (`Liste-Kreise.dc.html`:
  Terrakotta/Trockenwaren, Salbeigrün/Obst & Gemüse, Sandbeige/Milchprodukte)
  plus Salbeiblau als vierter Ton, aber deutlich aufgehellt (`#D1BEAF`,
  `#BAC2B0`, `#DFD6C6`, `#BCC8CB`) statt der dortigen Vollfarbe — auf
  Nutzerwunsch (2026-09-24), nicht mehr die exakten Canvas-Hexwerte.
- Text dunkel (`text`) und in Public Sans (`font-sans`), nicht Unbounded —
  die Ziffer ist ein Messwert, kein Display-Titel. Weiß bleibt auf diesen
  hellen Tönen zu kontrastarm (2026-09-24: erst abgedunkelte Eigenfarben mit
  weißem Text versucht, dann Canvas-Pastelltöne mit dunklem Text, jetzt
  aufgehellte Töne mit dunklem Text in Public Sans).
- Farbiger Ring statt Haarlinie (2026-09-24): außen ein 3 px Ring in
  derselben Farbe wie die Füllung, dann ein 2 px weißer Spalt, dann die
  Füllung mit der Ziffer — dieselbe Ring/Spalt/Füllung-Mechanik wie bei den
  Zutaten-Kreisen im Canvas (`Liste-Kreise.dc.html`), dort per verschachteltem
  `padding` (Ring) und `border` (Spalt), hier genauso.

**Tag/Chip**
- Filter-Chip (Home): 34 px hoch, `line`-Rahmen, aktiver Zustand
  `accent`-gefüllt.
- Info-Pille (Rezept-Tags im Detail): 28 px hoch, nur Rahmen, nie gefüllt.

**Tabbar**
- Genau 4 Ziele: Home, Einkaufsliste, Aufgaben, Konto. Konto zeigt den echten
  Nutzer-Avatar, kein generisches Icon.
- Glas-Effekt: `background: rgba(255,255,255,.72)`,
  `backdrop-filter: blur(24px) saturate(180%)` — der `saturate`-Zusatz ist
  Pflicht, sonst wirkt es milchig statt Glas.
- Aktiver Tab: `accent`-Farbe am Icon plus 4-px-Punkt darunter.

**„Etwas hinzufügen"-Zeile** (Einkaufsliste, Aufgaben)
- Kein schwebender Button — inline erste Zeile der Liste, echtes `<input>`
  mit zugehörigem `<label>`. Scrollt mit der Liste weg, blockiert keinen
  dauerhaften Platz über der Tabbar.
- Pille wie das Suchfeld auf Home (siehe Eingabefeld oben), nicht mehr
  gestricheltes „+" mit freistehendem Feld (2026-09-24).
- Direkt darunter, nicht darüber: „Noch X von Y erledigt" / „Alles abgehakt"
  bzw. „Alles erledigt" — gehört zur selben Handlung wie das Ergänzen, auf
  beiden Screens gleich (Aufgaben hatte vorher gar keinen Fortschritt).

**Leer-/Fehlerzustand**
- Card auf `surface`-Hintergrund, 16 px Radius, Icon 34 px in
  `inkInactive`/`signal`, Titel in der `abschnitt`-Stufe, Erklärung als
  `caption`, ein Button darunter.

## Niemals

- Keine Systemschrift (SF Pro / `-apple-system`) — immer Public Sans /
  Unbounded über den Google-Fonts-Link.
- Keine Emojis als Icons — ausschließlich Strich-SVGs.
- Keine pulsierenden Skeletons.
- Kein „Weiß, weil Default" — Weiß ist hier bewusste Instagram-Referenz;
  bei einer künftigen Richtungsänderung neu entscheiden, nicht stillschweigend
  beibehalten.
- Keine schwebende „Hinzufügen"-Leiste, die dauerhaft Platz über der Tabbar
  blockiert.
- Kein Auf-Liste-Button unten links auf der 2-spaltigen Kachel — kollidiert
  mit Titel/Zeit; gehört oben rechts auf das Foto.

## Referenz

Alle Screens, die verworfenen Vergleichsvarianten (System A/B) und das
Komponenten-Specimen liegen im Design-Canvas:
https://claude.ai/artifact/SCoRZn9rXXh9vWY5MVCMV2
