# Emil — Design-System

Verbindliche Gestaltungsregeln. `docs/app_redesign.jpg` ist die
**Spezifikation, nicht die Inspiration**: Weicht eine Umsetzung von der
Referenz ab, wird die Umsetzung korrigiert und nicht die Abweichung zur
Designentscheidung erklärt.

Dieses Dokument ist die einzige Quelle für Farben, Schrift, Maße und Bewegung.
Die Tokens stehen in `src/app/globals.css`, die Bausteine in
`src/components/ui.tsx` — beide setzen um, was hier steht. Ändert sich eine
Regel, ändert sie sich hier zuerst.

**Stand 19.09.2026:** Dieses Dokument ersetzt die vorherige Fassung, die auf
`app_design.jpg` (Food-Fotografie, redaktionell, keine Karten, keine
Akzentfarbe) beruhte. Die alte Referenz liegt zur Nachvollziehbarkeit unter
`docs/app_design.jpg`, ist aber **nicht mehr verbindlich**. Der Wechsel ist
bewusst und war ein expliziter Auftrag, keine schleichende Abweichung — siehe
Abschnitt 12. Component- und CSS-Code folgt dieser Dokumentänderung als
eigener, separater Schritt — **Abschnitt 14 ist dafür die Arbeitsgrundlage**:
eine gegen den Code (Stand 19.09.2026) geprüfte Liste jeder Stelle, die das
alte System noch trägt, mit der jeweils richtigen neuen Klasse/Variable.

---

## 1. Haltung

Der Auftritt ist **Produkt**, nicht Kochbuch: eine kühle, helle
Fliederblau-Fläche, eine geometrische Grotesk, echte Karten mit Schatten für
Listeninhalte, eine warme Goldfarbe als durchgängige Markenfarbe für Aktionen.
Das Vorbild ist eine saubere Consumer-App, kein redaktionelles Magazin — der
Bruch zur vorherigen Fassung ist gewollt (Abschnitt 12).

Farbe ist jetzt Markenmittel, nicht mehr ausschließlich dem Essen vorbehalten.
Gold markiert, was man antippen soll; Schwarz markiert, was gerade aktiv ist;
alles andere ist die helle Fläche, Weiß und gedämpftes Blaugrau für Nebentext.

Was sich gegenüber der alten Fassung umdreht — jede dieser Zeilen war vorher
ausdrücklich verboten und ist jetzt Teil des Systems, weil die neue Referenz
sie zeigt:

- **Karten mit Schatten** — aber nur in der Rezeptübersicht (Abschnitt 4, 7).
  Der Rezept-Screen selbst bleibt kartenlos, siehe unten.
- **Eine echte Akzentfarbe** (Gold) für Haupt-Aktionen, nicht nur als
  Warnton.
- **Ein Ziffernkasten in der Markenfarbe** statt Schwarz.

Was **unverändert** gilt, weil die neue Referenz nichts Gegenteiliges zeigt:

- Emojis als Symbole, gemischte Symbolsätze — weiterhin ausgeschlossen.
- Pulsierende graue Ladebalken — weiterhin ein Web-Muster, das Emil nicht
  zeigt (Abschnitt 9).
- Standard-Formularelemente des Browsers im sichtbaren Auslieferungszustand.
- Bildschirmbreite CTA-Knöpfe auf Rezept- und Einkaufsscreens — die Referenz
  zeigt CTAs immer **neben** dem Inhalt (schmale Pille), nie darüber
  (Abschnitt 3).

---

## 2. Die Referenz lesen — Maßstab und eine Falle, die diesmal nicht zuschlägt

`docs/app_redesign.jpg` ist 736 × 920 px groß und zeigt, wie schon die
vorherige Referenz, **zwei iPhone-Screenshots auf einer hellgrauen Fläche**
(`#e9e9eb`, gemessen an den Bildrändern und der „Visit ↗ waxyweb.com"-Zeile
unten links). Das ist wieder der Tisch, nicht die App — dieselbe Falle wie
beim alten Bild, siehe die vorherige Fassung dieses Dokuments.

**Diesmal schlägt sie aber nur zur Hälfte zu.** Innerhalb der Gerätekante gibt
es in dieser Referenz tatsächlich **zwei** Flächen, nicht eine:

1. Eine fliederblaue Grundfläche (`#c9d2e3`), die Statusleiste, Kopfzeile,
   Begrüßung, Filterzeile und auf dem Detail-Screen den gesamten Inhalt unter
   dem Foto trägt.
2. Eine weiße Karte mit Schatten, die **nur** auf dem Übersichts-Screen
   erscheint — als Behälter für eine Rezeptvorschau.

Das ist keine Fehllesung wie beim alten Bild: Der Kartenrand mit Schatten
liegt eindeutig **innerhalb** der Gerätekante, nicht am Bildschirmrand.

### Maßstab

Der sichtbare Bildschirminhalt eines Geräts (ohne Rahmen) ist in der Referenz
rund **291 px breit** (gemessen per Kantenerkennung, `x ≈ 55` bis `346`). Ein
echtes iPhone hat 390 pt. Faktor: **390 / 291 ≈ 1,34.**

Wie beim alten Bild gilt: **Übertragen werden Proportionen, nicht
Absolutwerte**, und drei harte Untergrenzen gehen jeder Umrechnung vor — sie
sind Eigenschaften von iOS und Daumen, nicht der Referenz:

| Grenze | Wert | Grund |
|---|---|---|
| Schrift in Eingabefeldern | ≥ 16 px | darunter zoomt iOS Safari beim Antippen hinein |
| Trefferfläche | ≥ 44 × 44 px | Apples Mindestmaß; Emil wird einhändig und in Bewegung bedient |
| Fließtext | ≥ 15 px | wird im Stehen aus Armlänge gelesen |

Die Maßtabellen in Abschnitt 5 und 6 sind das Ergebnis dieser Umrechnung.

---

## 3. Zwei Register

Unverändert aus der vorherigen Fassung — die neue Referenz widerspricht dem
Prinzip nicht, sie ändert nur, *womit* das redaktionelle Register arbeitet.

**Redaktionell** — Rezept, Rezeptliste, Einkauf. Aktionen sind zurückhaltend
und stehen neben dem Inhalt, nie darüber. Der Unterschied zur alten Fassung:
„zurückhaltend" heißt jetzt nicht mehr zwingend farblos — eine schmale
Gold-Pille neben dem Inhalt (wie „Details" in der Referenz) ist zulässig,
solange sie nicht bildschirmbreit ist und nicht mit dem Titel konkurriert.

**Werkzeug** — Anmelden, Registrieren, Formulare, Einstellungen, Import. Hier
gilt Bedienbarkeit vor Zurückhaltung: ein Feld sieht aus wie ein Feld, der
Absenden-Knopf ist bildschirmbreit, eindeutig und trägt jetzt `--accent` statt
eines fiktiven Markenblaus.

Beide Register teilen Farben, Schrift, Radien, Abstände und Bewegung. Sie
unterscheiden sich in der Lautstärke der Aktionen — nicht mehr darin, ob Farbe
erlaubt ist.

---

## 4. Farbe

Gemessen aus `docs/app_redesign.jpg`, innerhalb der Geräte (Abschnitt 2), mit
PIL/Python am Originalbild. Wo eine gemessene Rohfarbe aus Kontrast- oder
JPEG-Kompressionsgründen angepasst werden musste, steht das explizit dabei —
wie schon beim Scrim-Wert der Vorgängerfassung.

### Tokens (hell)

| Token | Wert | Rolle |
|---|---|---|
| `--bg` | `#c9d2e3` | Die Grundfläche. Kopfzeile, Begrüßung, Filterzeile, gesamter Detail-Screen unter dem Foto. |
| `--card` | `#ffffff` | Neu. Die Rezeptvorschau-Karte in der Übersicht — die **einzige** Fläche mit eigenem Schatten. Nirgends sonst. |
| `--chip` | `#ffffff` | Untergrund der Zutatenkacheln (Abschnitt 7), wie `--card`. |
| `--soft` | `#bcc4d6` | Sichtbare Bedienfläche auf `--bg`: inaktive Filter-Pille, Suchfeld, Formularfeld. Gemessen an der inaktiven „Buy"/„Sell"-Pille. |
| `--border` | `#a8b2c9` | Haarlinie für Merkmal-Chips auf dem Canvas und Feldkanten. Die Referenz misst hier nur `#c8d1e2` (kaum von `--bg` zu unterscheiden) — das ist ein JPEG-Kompressionsartefakt an einer 1-px-Linie, keine Designentscheidung. Der Wert ist angehoben, bis die Linie tatsächlich sichtbar ist. |
| `--text` | `#0b0b10` | Fließtext, Titel. 12,9 : 1 auf `--bg`, 19,6 : 1 auf `--card`. |
| `--muted` | `#4d5770` | Nebentext. 4,74 : 1 auf `--bg`, 6,7 : 1 auf `--card`. Rohmessung lag bei stark streuenden Werten zwischen `#55607a` und `#272e40` — kleine, JPEG-komprimierte Schrift misst nie sauber; der Wert ist auf die Kontrastgrenze gesetzt, wie `--muted` es in der Vorgängerfassung schon einmal war. |
| `--accent` | `#f6ce8f` | **Jetzt Markenfarbe, kein Warnton mehr.** CTA-Pillen, Icon-Badges auf Fotos, Ziffernkasten. Gemessen am „Details"-Knopf. |
| `--accent-ink` | `#0b0b10` (= `--text`) | Text/Icon auf `--accent`. 13,2 : 1. |
| `--danger` | `#93331f` | Löschen, Fehler — vom alten `--accent`-Warnton abgeleitet, für die neue, kühlere Fläche nachgedunkelt (war 3,6 : 1 auf `#c9d2e3`, jetzt 5,1 : 1 / 7,7 : 1 auf `--card`). Nie als Fließtext direkt auf `--bg`, sondern auf `--card`/`--soft` — siehe Notice in Abschnitt 7. |
| `--ok` | `#28583d` | 5,4 : 1 auf `--bg`. Ohne Vorbild in der Referenz, aus demselben Grün wie zuvor auf die neue Fläche nachgedunkelt. |
| `--warn` | `#7a4f18` | 4,7 : 1 auf `--bg`. Bewusst dunkler Bronzeton, nicht Gold — sonst ist eine Warnmeldung von einer CTA-Pille nicht zu unterscheiden. |
| `--shadow-card` | `0 16px 32px -14px rgba(23,25,40,.28)` | Der einzige Schatten im System, exklusiv für `--card`. Weich, weit gestreut, keine harte Kante — Blur/Spread sind an einer JPEG-Kante nicht messbar und deshalb nach Augenmaß gegen den Entwurf gesetzt, nicht pixelgenau abgelesen. |
| `--photo` | `#bcc4d6` (= `--soft`) | Das Bett unter einem Rezeptfoto, solange die signierte Adresse noch unterwegs ist, oder wenn ein Rezept keins hat. Alter Wert war `#2b2622`, ein warmes Dunkelbraun — gebraucht, damit ein weißer Titel *auf* dem Foto lesbar blieb. Diesen Grund gibt es nicht mehr (Titel steht nicht mehr auf dem Foto, Abschnitt 4 Regel 5), darum jetzt schlicht `--soft`: ein eigener Token bleibt trotzdem bestehen, falls sich das Bett später wieder vom Rest absetzen soll. |
| `--control` | **entfällt, wird `--card`** | Die kleinen Kreise im Portionswähler waren ein eigener Token, weil `--chip` im dunklen Modus nicht mitziehen konnte (Abschnitt 4, Dunkel-Absatz der Vorgängerfassung). Ohne Dark Mode entfällt der Grund; `--control` und `--chip` sind jetzt identisch mit `--card` (`#ffffff`) und der Token wird ersatzlos entfernt, nicht nur umbenannt. |

**`--brand`, `--brand-text`, `--accent-text` (alte Namen) entfallen.** `--brand`
stand im Code (`#080808`, identisch zu `--panel`), tauchte aber nie in der
Farbtabelle der Vorgängerfassung auf — beide Rollen übernimmt jetzt
`--accent`/`--accent-ink`. `--accent-text` hieß der alte Kontrastpartner der
Warnfarbe; sein Nachfolger heißt bewusst anders (`--accent-ink`), weil er
jetzt zu einer inhaltlich anderen Farbe gehört (Marke statt Warnung) — siehe
Migrationstabelle, Abschnitt 14.

**Ein Vorbehalt zu `--accent` auf `--bg`:** Gold auf dem Fliederblau hat nur
**1,02 : 1** Kontrast — praktisch unsichtbar als dünne Kontur oder kleines
Symbol direkt auf der Grundfläche. `--accent` funktioniert in dieser Referenz
ausschließlich als **große, gefüllte Fläche** (Pille, Kreis) mit dunklem Text
oder Icon darauf, nie als Outline oder Text auf nacktem `--bg`.

### Regeln

1. **Zwei Flächen, klar getrennt.** `--bg` ist der Grund. `--card` ist die
   Ausnahme — sie erscheint ausschließlich in der Rezeptübersicht, als
   Behälter je Vorschau. Der Rezept-Screen selbst, die Einkaufsliste und alle
   Werkzeug-Screens bleiben auf `--bg`, ohne Karte.
2. `--accent` ist die Markenfarbe für Aktionen: primäre CTA-Pillen, der
   Ziffernkasten, Icon-Badges auf Fotos. Er ersetzt keine Statusfarbe — Fehler
   bleiben `--danger`, nie Gold.
3. Braucht ein Bedienelement auf `--bg` eine sichtbare Fläche, bekommt es
   `--soft`, nicht `--accent` — Gold ist Aktionen vorbehalten, nicht jeder
   Bedienfläche (sonst verliert es seine Signalwirkung).
4. Schatten ausschließlich an `--card`. Kein Schatten auf Knöpfen, Pillen,
   Icon-Badges oder dem Ziffernkasten — die Referenz zeigt dort keinen.
5. Keine Verläufe. Die alte Referenz brauchte einen Scrim, um einen weißen
   Titel auf hellem Foto lesbar zu halten (Abschnitt 7, RecipeHero) — die
   neue Referenz legt Titel grundsätzlich **neben oder unter** das Foto, nie
   darüber. Der Scrim entfällt ersatzlos.

### Dunkel

**Kein Dark Mode in dieser Fassung.** `docs/app_redesign.jpg` zeigt
ausschließlich Hell, und anders als beim alten Bild lässt sich aus einem
Fliederblau-auf-Weiß-System kein dunkles Gegenstück ableiten, ohne zu raten.
Der bisherige dunkle Modus (`#1f1c19` als Grund, cremefarbener Ziffernkasten)
passt nicht mehr zur neuen Farbfamilie und wird **nicht** übernommen. Bis eine
dunkle Referenz vorliegt, läuft Emil nur hell — offener Punkt, Abschnitt 13.

---

## 5. Typografie

### Die Schrift

**Ein** Schriftschnitt für alles, nicht mehr zwei: die Referenz zeigt an
keiner Stelle eine Serife, auch nicht im Titel. Titel, Abschnitte, Fließtext
und Kleinschrift laufen in derselben geometrisch-humanistischen Grotesk, nur
in unterschiedlichem Schnitt und Gewicht — genau wie im Entwurf.

**Plus Jakarta Sans** (`--font-sans`), geladen über `next/font/google`
(400, 500, 600, 700, kursiv 500). Begründung der Wahl: Die Referenz zeigt ein
geometrisches Grundgerüst mit leicht humanistischer Abrundung, ein enges,
niedriges „a" und eine kräftige, nicht überzogene Kursive für die
Namens-Betonung in der Begrüßung — das trifft Plus Jakarta Sans deutlich
näher als etwa Inter (zu neo-grotesk) oder Manrope (zu rund im Auge). Wer den
Gegenversuch macht, prüft am Rezepttitel gegen den Screenshot, nicht am Namen.

Playfair Display und Poppins entfallen. Das war die tragende Typo-Entscheidung
der vorherigen Fassung — der Wechsel ist beabsichtigt, siehe Abschnitt 12.

**Zu den CSS-Variablennamen:** `src/app/layout.tsx` lädt die Schrift aktuell
als zwei `next/font`-Instanzen (`Playfair_Display` → CSS-Variable
`--font-serif`, `Poppins` → `--font-sans-ui`), und `globals.css` bildet daraus
zwei Tailwind-Tokens (`--font-display`, `--font-sans`). Diese zwei Namen
bleiben — nicht weil es zwei Familien gibt, sondern weil `font-display` an
rund 20 Stellen im Code steht (Rezepttitel, alle Abschnittsüberschriften,
Ziffernkasten) und ein Massenumbenennen auf `font-sans` nur Fehlerrisiko ohne
Nutzen wäre. **Beide Tokens zeigen jetzt auf dieselbe Schrift**, Plus Jakarta
Sans, geladen als eine `next/font`-Instanz mit zwei Variablennamen (oder eine
Instanz, zweimal referenziert) — es gibt also weiterhin `font-display` und
`font-sans` als Klassen, aber keine zwei Schriftfamilien mehr dahinter, nur
zwei Namen für dieselbe.

### Kursive Betonung

Die Referenz setzt in der Begrüßung genau ein Wort kursiv (den Namen: „Hey
*Ratul*,"). Das ist keine beliebige Hervorhebung, sondern eine wiederkehrende
Rolle: **Kursiv markiert ausschließlich den Namen der angemeldeten Person**,
nirgends sonst — nicht in Rezepttiteln, nicht in Abschnittsüberschriften.

### Skala

Ergebnis der Umrechnung aus Abschnitt 2 (Faktor ≈ 1,34), mit Untergrenzen.
Der Rezept-/Objekttitel misst in der Referenz rund 42–48 px (Umrechnung aus
einer Glyphenspanne von 49 px im Mockup); wie beim alten Bild schon einmal
gilt: deutsche Rezeptnamen sind länger als „Omny Puerto" und brauchen mehr
Zeilenraum, nicht mehr Größe — der Titel bleibt darum unter dem reinen
Umrechnungswert.

| Rolle | Größe / Zeile | Schnitt |
|---|---|---|
| Rezepttitel (Kachel **und** Detail-Screen) | 26 / 1,2 | 700 |
| Screen-Überschrift (Einkauf, Einstellungen, Konto, Werkzeug-Screens — `ScreenHeader`/`Screen`, `title`) | 26 / 1,2 | 700 |
| Begrüßung „Hallo, *Name*" (nur Rezeptübersicht, ersetzt dort die generische Screen-Überschrift) | 24 / 1,2 | 700, Name kursiv 500 |
| Abschnitt („Zutaten", „Zubereitung", „Beschreibung") | 15 / 1,3 | 600 |
| Fließtext, Beschreibung, Zubereitungsschritte | 15 / 1,5 | 400 |
| Formularfeld-Inhalt | 16 / 1,4 | 400 |
| Stat-/Merkmal-Chip (Kalorien, Zeit, Portionen) | 13 / 1,2 | 500 |
| Zutatenname unter der Kachel | 13 / 1,2 | 500 |
| Nebentext, Feldbeschriftung, Kartenuntertitel | 13 / 1,4 | 400 |
| Filter-Pillen-Text | 13 / 1,2 | 600 |
| Tab-Beschriftung | 12 / 1,1 | 600 |
| Schritt-Ziffer im Kasten | 13 | 700, **nicht** kursiv (Kursiv ist dem Namen vorbehalten) |

Kein Versalsatz mit Sperrsatz (`uppercase tracking-wide`). Die Referenz zeigt
Groß-/Kleinschreibung durchgehend, auch bei den Filter-Pillen und Tabs.

---

## 6. Maß, Radius, Schatten

**Abstände** auf 4er-Raster: 4, 8, 12, 16, 20, 24, 32.

- Screen-Seitenrand: **20 px**, über `px-safe` mit der Safe Area.
- Kartenabstand in der Übersicht: 20 px zwischen zwei Karten.
- Karten-Innenabstand: 16 px (Text- und Chip-Bereich), Foto darin mit
  eigenem, kleinerem Radius und ca. 12 px Abstand zum Kartenrand.
- Inhaltsbreite: `max-w-md` (448 px), zentriert.
- **Ausnahme Rezept-Screen:** das Foto läuft über die volle Breite bis unter
  die Statusleiste; Titel und Abschnitte darunter setzen ihren eigenen
  Seitenrand.

**Radien**

| Token | Wert | Wofür |
|---|---|---|
| `--radius-card` | 24 px | Die Rezeptvorschau-Karte in der Übersicht, außen. |
| `--radius-tile` | 14 px | Foto in der Karte, Zutatenkacheln (Abschnitt 7) — abgerundetes Rechteck, keine Kreise mehr. |
| `--radius-soft` | 12 px | Felder, kleine Knöpfe, Meldungen, Ziffernkasten. |
| `--radius-pill` | 999 px | Filter-Pillen, CTA-Pillen, Icon-Badges, Tab-Leiste, Suchfeld. |

28 px `--radius-card` der alten Fassung ist auf 24 px angepasst: die neue
Karte ist ein eigenständiger Körper mit Schatten, kein Foto-only-Element, und
wirkt bei 28 px auf der gemessenen Kartenbreite optisch zu weich.

**Schatten**

Es gibt jetzt genau einen: `--shadow-card`, ausschließlich an `--card`
(Abschnitt 4). Keine zweite Schattenstufe, kein `--shadow-float` — die
Referenz zeigt nirgends eine zweite Schattentiefe, auch nicht unter der
Tab-Leiste, deren Kontur allein durch die Farbdifferenz zu `--bg` trägt.

**Trefferflächen** 44 × 44 px, auch wenn die sichtbare Fläche kleiner ist —
unverändert aus Abschnitt 2.

---

## 7. Bausteine

### TopBar / Begrüßung
Nur auf der Rezeptübersicht. Zwei runde Icon-Flächen (`--soft` auf `--bg`,
40 px sichtbar / 44 px Trefferfläche) links und rechts einer Zeile — links ein
Zugang zu Konto/Einstellungen, rechts vorläufig ohne Funktion belegt
(Abschnitt 13, offener Punkt: die Referenz zeigt hier eine
Benachrichtigungs-Glocke, Emil kennt noch keine Benachrichtigungen). Darunter
die Begrüßung „Hallo, *Name*" in zwei Zeilen möglich, Name kursiv.

### FilterRow
Ersetzt den Standort-Dropdown der Referenz (Auftrag, siehe Nutzerentscheidung
in der Historie dieses Dokuments): eine waagerechte, randlose Reihe aus
Mahlzeiten-Filtern (Frühstück, Mittag, Abend). Aktiv: `--text`-gefüllte Pille,
Text `--card`-weiß. Inaktiv: `--soft`-gefüllte Pille, Text `--muted`. Kein
Rahmen auf beiden Zuständen — die Fläche allein trägt den Zustand, wie in der
Referenz. Waagerecht scrollbar ohne sichtbaren Balken.

### RecipeBrowserCard
Kehrtwende zur Vorgängerfassung: **das ist jetzt eine echte Karte.**
`--card`-Fläche, `--radius-card`, `--shadow-card`. Aufbau von oben:

1. Kopfzeile in der Karte: kleines rundes Icon-Feld (`--soft`) mit einem
   Symbol für die Mahlzeitenkategorie, daneben der Rezeptname (26/1,2, 700)
   und darunter eine Nebenzeile (13 px, `--muted`) mit einem kurzen
   Rezept-Kontext (z. B. „4 Portionen · 25 Min").
2. Merkmal-Chips (Kalorien, Zeit, Portionen) als Kontur-Chips in `--border`
   auf `--card`, Text 13/500 — Pendant zu „1,200 sq ft · 3 Beds …" in der
   Referenz.
3. Das Rezeptfoto, `--radius-tile`, Seitenverhältnis 4:3, mit ca. 12 px
   Abstand zu den Kartenrändern links/rechts/unten.
4. Eine `--accent`-Pille „Ansehen" mit Pfeil-Icon, unten rechts **auf dem
   Foto** platziert (wie „Details" in der Referenz) — die einzige Stelle, an
   der eine Gold-Fläche direkt auf einem Foto sitzt statt auf `--bg`.

Liegt das Rezept auf der Einkaufsliste, sitzt oben links auf dem Foto dieselbe
Art Milchglas-Badge wie zuvor, jetzt mit `--card`/70 % + Blur statt
`--accent`, damit der Zustand nicht mit der CTA-Farbe verwechselt wird.

### RecipeHero (Rezept-Screen)
Das Foto füllt die volle Bildschirmbreite, oben, bis unter die Statusleiste,
ohne Rundung — **Seitenverhältnis und Höhenanteil sinken** gegenüber der
Vorgängerfassung, und zwar deutlich: von hochkant 9:10 auf **querformatig
4:3** (`aspect-[4/3]`, ersetzt `aspect-[9/10]`). Gemessen an beiden Screens
der Referenz (Kachel-Foto ≈ 260 : 190, Detail-Foto ≈ 270 : 185 — beide runden
auf 4:3), unabhängig von der tatsächlichen Gerätehöhe, die zwischen
iPhone-Modellen um bis zu 40 % streut. Bei üblichen Gerätehöhen entspricht das
rund 28–32 % der Screenhöhe — das ist die Rechengröße dahinter, nicht der
CSS-Wert selbst; verbindlich ist das Seitenverhältnis. Auf dem Foto
liegen ausschließlich zwei runde Icon-Badges oben links/rechts
(`rgba(255,255,255,.7)` + `backdrop-filter: blur(8px)`, dunkles Symbol) —
**kein Titel, kein Scrim.** Das ist die größte strukturelle Änderung: die
Referenz legt den Titel in beiden Screens unter bzw. neben das Foto, nie
darüber.

Unter dem Foto, auf `--bg` (keine Karte hier, Abschnitt 4): Rezepttitel
26/1,2/700, darunter eine Merkmal-Chip-Reihe wie in `RecipeBrowserCard`, dann
„Zubereitung" als Fließtext-Abschnitt (Pendant zu „Description"), dann
„Zutaten" als Kachel-Reihe (Pendant zu „Gallery").

Links auf dem Foto: Zurück (Chevron). Rechts: der Weg zum Bearbeiten
(Stift-Kontur) — unverändert aus der Vorgängerfassung, aus demselben Grund
(kein Favoriten-Konzept, Abschnitt 13).

### IngredientTile (vormals IngredientRail)
**Wechsel von Kreis zu Kachel** (Auftrag, siehe Nutzerentscheidung): Die
Referenz kennt für Zutaten keine Entsprechung, ihre „Gallery"-Kacheln unter
dem Detail-Screen sind aber genau das strukturell nächstliegende Element —
abgerundete Rechtecke, keine Kreise. Kachel 76 × 76 px, `--radius-tile`,
`bg-chip`, das freigestellte Zutatenfoto darin `object-fit: cover`, darunter
der Name in 13 px. Deutsche Zutatennamen brauchen weiterhin `hyphens-auto` und
einen Zwei-Zeilen-Deckel. Waagerecht scrollbar, `scroll-snap-type: x
proximity`, vierte Kachel angeschnitten als Wisch-Einladung — das war schon
bei den Kreisen richtig und ändert sich mit der Form nicht.

Im Einkauf als Raster: drei Spalten, `gap-x-3 gap-y-5`, dieselbe Kachelform.
Abgehakt: Bild `opacity-40`, Häkchen (jetzt in `--accent-ink` auf einem
kleinen `--accent`-Badge statt bloßem Kontur-Symbol) bleibt kräftig.

### ServingStepper
Kein Vorbild in der Referenz — strukturell unverändert aus der
Vorgängerfassung (Pille rechts neben „Zutaten", `−  2  +`, 32 px sichtbar /
44 px Trefferfläche, `tabular-nums`, `aria-live="polite"`), nur neu tokenisiert:
Pille jetzt `bg-soft` auf `--bg` statt auf einer Karte. Berechnung weiterhin
aus der Basismenge (`src/lib/core/scale.ts`), Formatierung über
`src/lib/core/format.ts`.

### ShoppingListAction
Übernimmt jetzt `--accent` als Aktionsfarbe — passend zur Referenz, die
genau diese Art schmaler, wichtiger Sekundäraktion in Gold zeigt („Details").
Ruhezustand: `--accent`-gefüllte Pille, `--accent-ink`-Text, „＋
Einkaufsliste". Zustand „auf der Liste": Fläche wechselt auf `--soft`, Text
auf `--text`, Häkchen statt Plus — kein Grün, wie zuvor. Höhe weiterhin 36 px,
`rounded-pill` statt `rounded-soft` (die Referenz zeigt für Pillen-CTAs
durchgehend Vollrundung, nicht das kleinere Soft-Radius).

Der dritte Zustand („Liste aktualisieren" bei abweichender Portionszahl)
bleibt unverändert aus der Vorgängerfassung, samt `useOptimistic`-Verhalten
und der Korrektur-statt-Verdopplung-Logik in `add_recipe_to_list`.

### RecipeSteps
Die Ziffer steht weiterhin in einem Quadrat, jetzt 26 × 26 px,
`--radius-soft`, aber **`bg-accent text-accent-ink`** statt `bg-panel
text-panel-text` — die Entscheidung aus der Nutzerklärung: Gold wird die
durchgängige Markenfarbe, der schwarze Ziffernkasten entfällt. Ziffer 13 px,
700, **nicht kursiv** (Abschnitt 5). Text daneben 15/1,5, Abstand zwischen
Schritten 16 px.

### RowLink / TabBar
`RowLink`: unverändert, mindestens 56 px hoch, `bg-soft` mit Chevron rechts,
Chevron in `text-muted`. **Nicht** `text-accent`: der Chevron war vorher
`text-brand` (= Schwarz), und ein reflexhaftes `brand → accent` würde ihn Gold
färben — eine stille Bedienfläche in der Markenfarbe wäre aber ein
Aktions-Signal ohne Aktion (Regel 3, Abschnitt 4).

`TabBar`: **grundlegend neue Bauform.** Nicht mehr bildschirmbreit-sticky mit
Haarlinie oben, sondern eine freistehende, vollgerundete Leiste
(`--radius-pill`), `bg-card` mit `--shadow-card`, mit sichtbarem `--bg`-Rand
ringsum (16 px Abstand zu den Bildschirmkanten, 12 px zur unteren Safe Area) —
wie in der Referenz. Zwei Einträge (Einkauf, Rezepte). Der aktive Eintrag
bekommt ein eigenes, dunkles Icon-Badge (`bg-text`, Symbol `--card`-weiß, 28 px
Kreis) plus sichtbares Label auf einer `--soft`-Kapsel; der inaktive Eintrag
zeigt nur das Symbol in `--muted`, ohne Badge, ohne Label — exakt das Muster
„Home" vs. übrige Icons in der Referenz. Wechsel weiterhin im selben Frame
(`useOptimistic`), `data-pending` dimmt den Inhalt darüber.

### Field / Select / Textarea / Button / Notice
Werkzeug-Register. Felder: 48 px hoch, `rounded-soft`, `bg-soft`, Haarlinie
`--border`, 16 px Schrift, Fokus über `border-text`.

`Button`: 48 px, bildschirmbreit, `rounded-pill`; `primary` = `bg-accent
text-accent-ink` (das war vorher `bg-brand` — ein Token, das im Code stand,
aber nie in der Farbtabelle der alten Fassung dieses Dokuments auftauchte;
`--brand`/`--brand-text` entfallen jetzt zugunsten von `--accent`), `quiet` =
Haarlinie ohne Fläche, `danger` = Kontur in `--danger`. Nur auf
Werkzeug-Screens.

`Notice`: `role="alert"` bei Fehlern, Fläche `bg-card` oder `bg-soft`, nie
nacktes `--bg` — `--danger`-Text braucht dafür Kontrast (Abschnitt 4).

---

## 8. Symbole

Unverändert aus der Vorgängerfassung: eigene Inline-SVG nach Lucides Regeln
(24er-Raster, `viewBox="0 0 24 24"`, Kontur `stroke-width: 1,75`, runde Enden,
`currentColor`).

**Zwei Ausnahmen**, beide aus der neuen Referenz:

- Die Tab-Symbole sind gefüllt, nicht konturiert — wie zuvor, aus demselben
  Grund (iOS-Konvention, Kontur wirkt in 11–12 px zerbrechlich).
- Icon-Badges auf Fotos (RecipeHero, RecipeBrowserCard-CTA) und im
  Ziffernkasten dürfen auf **gefüllter** `--accent`- oder `--soft`-Fläche
  stehen; das Symbol selbst bleibt Kontur, nur der Untergrund ist neu.

Kein Herz — weiterhin ohne Favoriten-Funktion (Abschnitt 13).

---

## 9. Bewegung

Unverändert aus der Vorgängerfassung: **120–250 ms**, `ease-out`, kein Federn,
kein Hüpfen.

| Utility | Verhalten |
|---|---|
| `press` | `opacity .7` + `scale(.98)`, beim Drücken **ohne** Übergang, beim Loslassen 120 ms |
| `press-flat` | wie oben ohne Skalierung |
| `count-swap` | Ziffernwechsel, 150 ms Einblendung |
| `dims-when-pending` | dimmt auf 0,5, solange ein Vorfahr `data-pending` trägt |

`placeholder-box` bleibt eine ruhige getönte Fläche (jetzt `--soft` statt der
alten warmen Tönung), 320 ms unsichtbar, kein Puls.
`prefers-reduced-motion: reduce` schaltet `placeholder-box` und `count-swap`
ab.

---

## 10. Zustände

Unverändert aus der Vorgängerfassung — jedes bedienbare Element braucht alle
sechs (Ruhe, Zeiger, Gedrückt, Fokus, Gesperrt, Gewählt). Der Fokusring bleibt
`:focus-visible`, 2 px `--text`, 2 px Abstand, auf dem Foto weiß. Einzige
Änderung: „Gewählt" (`aria-pressed`/`aria-current`) darf jetzt optisch über
`--accent` laufen, wo vorher kein Markentoken existierte.

---

## 11. Barrierefreiheit

Semantik, ARIA-Labels und Tastaturbedienbarkeit unverändert aus der
Vorgängerfassung (Abschnitt 11 dort).

**Kontrast, neu gemessen für die Farbfamilie aus Abschnitt 4** (WCAG 2.1,
berechnet, nicht am JPEG abgelesen):

| Paar | Verhältnis | Urteil |
|---|---|---|
| `--text` auf `--bg` | 12,91 : 1 | gut |
| `--text` auf `--card` | 19,63 : 1 | gut |
| `--muted` auf `--bg` | 4,74 : 1 | gut, knapp über der Grenze |
| `--muted` auf `--card` | 6,7 : 1 | gut |
| `--muted` auf `--soft` | 4,12 : 1 | **darunter** — Nebentext auf `--soft` steht deshalb in `--text`, wie schon in der Vorgängerfassung Konvention |
| `--accent-ink` auf `--accent` | 13,22 : 1 | gut |
| `--accent` auf `--bg` (Fläche, nicht Text) | 1,02 : 1 | **kein Text/Kontur-Einsatz auf nacktem `--bg`** — siehe Abschnitt 4 |
| `--danger` auf `--bg` | 3,61 : 1 (`#b5442c` alt) → 5,05 : 1 (`#93331f` neu) | erst nach Nachdunkeln gut |
| `--danger` auf `--card` | 7,68 : 1 | gut |
| `--ok` auf `--bg` | 5,4 : 1 | gut, nachgedunkelt aus dem alten Grün |
| `--warn` auf `--bg` | 4,7 : 1 | gut, bewusst dunkler Bronzeton statt Gold |

---

## 12. Abweichungen — Referenzwechsel und was er bedeutet

Dieser Abschnitt ersetzt die alte „Abweichungen vom Master-Prompt"-Tabelle.
Die vorherige Fassung dieses Dokuments *war* die begründete Abweichung vom
Master-Prompt; jetzt kommt ein expliziter, zweiter Auftrag obendrauf: das
Referenzbild selbst wurde ausgetauscht, mit der Anweisung, es so genau wie
möglich nachzubauen. Was sich dadurch gegenüber der Vorgängerfassung ändert:

| Vorherige Fassung (`app_design.jpg`) | Diese Fassung (`app_redesign.jpg`) | Grund |
|---|---|---|
| Keine Karten, ein Grund durchgehend | Karten mit Schatten in der Übersicht, ein Grund sonst | Die neue Referenz zeigt eine echte, innerhalb der Gerätekante liegende Karte — keine Fehllesung wie beim alten Bild (Abschnitt 2) |
| Keine Akzentfarbe, „Farbe trägt das Essen" | `--accent` als durchgängige Markenfarbe | Explizite Nutzerentscheidung: Ziffernkasten und CTAs übernehmen die Gold-Fläche der Referenz |
| Playfair Display (Serife) + Poppins | Plus Jakarta Sans (eine Grotesk) | Die neue Referenz zeigt an keiner Stelle eine Serife |
| Titel als weißer Text auf dem Foto, Scrim | Titel unter/neben dem Foto, kein Scrim | Die neue Referenz legt Text nie über ein Foto |
| Zutatenkreise | Zutatenkacheln (abgerundetes Rechteck) | Explizite Nutzerentscheidung, angelehnt an die „Gallery"-Kacheln der Referenz |
| Hell **und** Dunkel | Nur Hell | Explizite Nutzerentscheidung: kein dunkles Gegenstück ohne dunkle Referenz |
| Foto hochkant 9:10, 42–46 % der Screenhöhe | Foto querformatig 4:3, ca. 28–32 % der Screenhöhe | Gemessen an beiden Screens der neuen Referenz |
| Tab-Leiste bildschirmbreit, sticky, Haarlinie | Freistehende, gerundete Leiste mit Schatten | Referenz zeigt eine floatende Pille, keine Vollbreiten-Leiste |

---

## 13. Was noch nicht dem System entspricht

Arbeitsliste, keine Beschreibung des Ist-Zustands. Stand 19.09.2026 — dieser
gesamte Abschnitt beschreibt Lücken der **Dokumentation**, nicht der
Umsetzung; Component- und CSS-Code folgen diesem Dokument noch als eigener
Schritt (siehe Kopf dieses Dokuments).

1. **Kein Dark Mode.** Siehe Abschnitt 4. Sobald eine dunkle Referenz
   vorliegt, wird sie nach derselben Methode wie zuvor abgeleitet
   (Flächenrollen tauschen, Kontraste neu prüfen).
2. **Rechtes TopBar-Icon ohne Funktion.** Die Referenz zeigt dort eine
   Benachrichtigungs-Glocke; Emil hat kein Benachrichtigungskonzept. Vorläufig
   dekorativ/deaktiviert, bis geklärt ist, was dorthin gehört (evtl. Suche).
3. **`--shadow-card`-Werte sind nach Augenmaß gesetzt**, nicht pixelgenau
   gemessen — an einer JPEG-komprimierten Schattenkante lässt sich Blur/Spread
   nicht zuverlässig ablesen. Vor dem ersten Einsatz gegen den Screenshot
   prüfen und ggf. nachschärfen.
4. **`--warn` und `--accent` liegen in derselben Farbfamilie** (beide
   Gold/Bronze-Ton). In der Referenz kommt keine Warnmeldung vor, das
   Nebeneinander ist ungeprüft — im UI beobachten, ob eine Warnmeldung neben
   einer CTA-Pille als solche erkennbar bleibt.
5. **Es gibt keine Favoriten.** Unverändert aus der Vorgängerfassung: der
   Stift zum Bearbeiten sitzt vorläufig, wo die Referenz ein Herz zeigt.
6. **Die Zutatenfotos decken die Zutaten nur teilweise ab** (unverändert,
   siehe `scripts/ingredient-images/`). Die alten kreisrunden Fotos müssen für
   die neue Kachelform ggf. neu zugeschnitten werden — ein Kreis-Crop passt
   nicht automatisch in ein 14-px-Radius-Rechteck.

---

## 14. Migrationsprüfung — was aus dem alten System nicht mit rüber darf

Dieser Abschnitt entstand aus einer Prüfung des tatsächlichen Codes gegen
diese Dokumentation (19.09.2026), *bevor* die Umsetzung begann — mit dem Ziel,
dass beim Implementieren kein Element des alten Systems unbemerkt bestehen
bleibt. Er ist eine Arbeitsliste, kein Teil der Gestaltungsregel selbst; Regel
bleibt, was in den Abschnitten 1–13 steht.

### 14.1 CSS-Variablen — vollständig, `src/app/globals.css`

| Alt | Alter Wert | Neu | Neuer Wert | Status |
|---|---|---|---|---|
| `--bg` | `#f5f1ee` | `--bg` | `#c9d2e3` | Wert ändert sich, Rolle bleibt |
| `--chip` | `#ffffff` | `--chip` | `#ffffff` | unverändert im Wert, Träger jetzt Kacheln statt Kreise |
| `--soft` | `#ece7e3` | `--soft` | `#bcc4d6` | Wert ändert sich |
| `--panel` | `#080808` | `--accent` (Rolle übernommen) | `#f6ce8f` | **Ziffernkasten wechselt Token, nicht nur Wert** |
| `--panel-text` | `#ffffff` | `--accent-ink` | `#0b0b10` (= `--text`) | Rolle übernommen, Wert gedreht (dunkel auf hell statt hell auf dunkel) |
| `--text` | `#242321` | `--text` | `#0b0b10` | Wert ändert sich |
| `--muted` | `#756d66` | `--muted` | `#4d5770` | Wert ändert sich |
| `--accent` | `#b5442c` (Warnton) | `--danger` | `#93331f` | **Umbenannt, nicht nur umgefärbt** — `--accent` heißt jetzt Marke, nicht Warnung |
| `--brand` | `#080808` | entfällt | — | Rolle geht in `--accent` auf |
| `--brand-text` | `#ffffff` | entfällt | — | Rolle geht in `--accent-ink` auf |
| `--accent-text` | `#ffffff` (Kontrast zum alten `--accent`) | entfällt | — | Nachfolgerrolle heißt `--accent-ink`, siehe oben |
| `--border` | `#e2dbd5` | `--border` | `#a8b2c9` | Wert ändert sich |
| `--ok` | `#3f6f52` | `--ok` | `#28583d` | Wert ändert sich (Kontrast auf neuem `--bg`) |
| `--warn` | `#b5762a` | `--warn` | `#7a4f18` | Wert ändert sich |
| `--scrim` | `rgba(12,10,9,.72)` | **entfällt ersatzlos** | — | Kein Text mehr auf dem Foto |
| `--photo` | `#2b2622` | `--photo` | `#bcc4d6` (= `--soft`) | Wert ändert sich, Grund entfällt (Abschnitt 4) |
| `--control` | `#ffffff` | **entfällt ersatzlos** | — | Geht in `--card`/`--chip` auf |
| `--card` | — (gab es nicht) | `--card` | `#ffffff` | **Neu** |
| `--accent-ink` | — | `--accent-ink` | `#0b0b10` | **Neu** |
| `--danger` | — | `--danger` | `#93331f` | **Neu** (Nachfolger des alten `--accent`) |
| `--shadow-card` | — | `--shadow-card` | `0 16px 32px -14px rgba(23,25,40,.28)` | **Neu** |

**Der komplette `@media (prefers-color-scheme: dark)`-Block entfällt** (Abschnitt
4, „Dunkel"). Ein Dark Mode, der nach dem Token-Wechsel weiterläuft, würde
sofort wieder alte Werte gegen neue Rollen ausspielen — er muss ganz raus, nicht
nur unverändert stehen bleiben.

`--radius-card` ändert sich von `28px` auf `24px`. Neu hinzu kommt
`--radius-tile` (`14px`) für die Zutatenkacheln — `--radius-soft` (`12px`,
vorher `11px`) und `--radius-pill` (`999px`) bleiben konzeptionell gleich.

Der gesamte Kommentarblock am Kopf von `globals.css` (Zeilen 3–36 im
jetzigen Stand) beschreibt die *alte* Herleitung — „Die Farben stammen aus
app_design.jpg", „Es gibt keine Akzentfarbe" usw. — und muss komplett neu
geschrieben werden, nicht nur die Werte darunter. Ein Kommentar, der der
Farbtabelle widerspricht, ist schlimmer als keiner.

### 14.2 `accent` im Code — jede Fundstelle einzeln, nicht pauschal ersetzen

Das ist die gefährlichste Einzelstelle in der ganzen Migration: `--accent`
bedeutet jetzt etwas anderes (Marke statt Warnung). Ein reflexhaftes
Suchen-und-Ersetzen von `accent` lässt in beiden Richtungen falsche Ergebnisse
zu — mal bleibt eine echte Fehlermeldung gold, mal wird ein neutraler Zustand
fälschlich zur Markenfarbe. Jede Fundstelle (Stand 19.09.2026, `grep -rn
accent src --include="*.tsx"`) braucht eine eigene Entscheidung:

| Datei:Zeile | Jetzige Klasse | Bedeutung | Wird zu |
|---|---|---|---|
| `src/components/ui.tsx:65` | `border-accent text-accent` (`Button` `danger`) | Fehler-Aktion | `border-danger text-danger` |
| `src/components/ui.tsx:98` | `border-accent/40 bg-accent/10` (`Notice` `error`) | Fehlermeldung | `border-danger/40 bg-danger/10` |
| `.../rezepte/[id]/RecipeActions.tsx:450` | `border border-accent text-accent` (Löschen-Bestätigung) | Destruktive Aktion | `border border-danger text-danger` |
| `.../liste/ListView.tsx:614` | `border border-accent text-accent` („Von der Liste nehmen") | Destruktive Aktion | `border border-danger text-danger` |
| `.../rezepte/RecipeImageField.tsx:143` | `text-accent` (Fehlertext) | Fehlermeldung | `text-danger` |
| `.../rezepte/importieren/ImportPanel.tsx:272` | `border-accent bg-accent text-accent-text` (aktiver Import-Tab) | **Kein Fehler** — reine Auswahl-Markierung, hat die alte Warnfarbe nur mitbenutzt, weil sie die einzige kräftige Farbe war | `border-text bg-text text-card` (gleiche Logik wie die aktive Filter-Pille, Abschnitt 7) |
| `.../rezepte/RecipeForm.tsx:405,429,437,453` | `focus:border-accent` | Fokuszustand von Feldern | `focus:border-text` (Design-System kennt keinen Akzent-Fokusring, Abschnitt 10) |
| `src/app/passwort-neu/page.tsx:46` | `text-accent underline` (Link) | Sekundärer Link, keine Warnung | Bewusst prüfen: als Markenlink in `text-accent` naheliegend (Abschnitt 3, Werkzeug-Register), aber nicht automatisch übernehmen — erst gegenlesen, ob Gold als Fließtext-Link genug Kontrast hat (Abschnitt 4: `--accent` auf `--bg` nur 1,02:1; auf `--card`/`--soft` im Formularkontext ist das unkritisch, sofern der Link nicht direkt auf nacktem `--bg` steht) |
| `src/app/anmelden/page.tsx:40` | `text-accent underline` (Link zu „Registrieren") | wie oben | wie oben |

### 14.3 Tailwind-Klassen und Formen — Fundstellen mit Datei

| Muster | Wo | Wird zu |
|---|---|---|
| `aspect-[9/10]` | `RecipeHero.tsx`, `RecipeBrowser.tsx`, `skeletons.tsx` ×2 | `aspect-[4/3]` (Abschnitt 7, RecipeHero) |
| `bg-gradient-to-b/-t from-scrim …` (Scrim-Verläufe) | `RecipeHero.tsx`, `RecipeBrowser.tsx` | ersatzlos entfernt, Titel wandert von auf das Foto zu unter/neben das Foto |
| `text-white` am Rezepttitel | `RecipeHero.tsx:85`, `RecipeBrowser.tsx:215` | `text-text`, weil der Titel nicht mehr auf dem Foto liegt |
| `rounded-pill` an Zutatenkacheln (`size-18 … rounded-pill bg-chip`) | `RecipeActions.tsx:224-225`, `ListView.tsx` (Raster-Kacheln), `skeletons.tsx:104` | `rounded-tile` (14 px), Form wird Quadrat, nicht mehr Kreis (Abschnitt 7, IngredientTile) |
| `bg-panel text-panel-text` + `italic` am Ziffernkasten | `rezepte/[id]/page.tsx:157` | `bg-accent text-accent-ink`, **`italic` explizit entfernen** — Kursiv ist jetzt ausschließlich dem Namen in der Begrüßung vorbehalten (Abschnitt 5). Der naheliegende Fehler ist, nur `bg-panel`→`bg-accent` zu ersetzen und das `italic` zu übersehen. |
| `bg-panel text-panel-text` am Haken-Badge | `ListView.tsx:504` | `bg-accent text-accent-ink` |
| `bg-brand text-brand-text` | `ui.tsx:63` (`Button` `primary`), `RecipeBrowser.tsx:135` (aktiver Schlagwort-Filter), `rezepte/page.tsx:31` | `bg-accent text-accent-ink` |
| `text-brand` (Chevron) | `ui.tsx:277` (`RowLink`) | `text-muted`, **nicht** `text-accent` (Abschnitt 7, RowLink) |
| `bg-control` | `RecipeActions.tsx:327` (Stepper-Kreise) | `bg-card` (Token entfällt, Wert bleibt Weiß) |
| `rounded-card` | `RecipeBrowser.tsx:183`, `skeletons.tsx:135` | Klasse bleibt, `--radius-card`-Wert ändert sich auf 24 px; zusätzlich braucht die Kachel jetzt `bg-card shadow-card` (bisher keine Fläche) |
| `border border-border` an ShoppingListButton, Ruhezustand | `RecipeActions.tsx:369` | `bg-accent text-accent-ink` gefüllt, kein reiner Kontur-Button mehr (Abschnitt 7, ShoppingListAction) |
| `h-9 … rounded-soft` an ShoppingListButton | `RecipeActions.tsx:364` | `rounded-pill` statt `rounded-soft` |
| Theme-Color-Metatags | `src/app/layout.tsx:74-75` | `#f5f1ee`/`#1f1c19` → `#c9d2e3`; die dunkle Zeile ganz entfernen (kein Dark Mode, Abschnitt 4) |
| `Playfair_Display`, `Poppins` Imports + Doc-Kommentar „Die beiden Schriften aus app_design.jpg" | `src/app/layout.tsx` | Ein `Plus_Jakarta_Sans`-Import, zwei Variablennamen (Abschnitt 5) |
| `rounded-xl`, `rounded-lg` (rohe Tailwind-Radien statt Token) | `ImportPanel.tsx:270`, `einstellungen/haushalt/InviteSection.tsx:90,100`, `skeletons.tsx:75` | `rounded-soft` — vorbestehende Abweichung von der „Nur Tokens"-Regel (AGENTS.md), nicht durch den Referenzwechsel verursacht, aber gleich mit erledigen, da `--radius-soft` jetzt ohnehin 12 px ist und `rounded-xl` (12 px) zahlenmäßig deckungsgleich wird |

### 14.4 Betroffene Dateien — vollständige Liste

Jede Datei, die beim Codegrep (19.09.2026) mindestens ein Element aus 14.1–14.3
enthielt. Eine Implementierung, die diese Liste nicht komplett abarbeitet, hat
zwangsläufig alte Elemente stehen lassen:

`src/app/globals.css` · `src/app/layout.tsx` · `src/components/ui.tsx` ·
`src/components/skeletons.tsx` · `src/app/(app)/rezepte/[id]/RecipeHero.tsx` ·
`src/app/(app)/rezepte/[id]/RecipeActions.tsx` ·
`src/app/(app)/rezepte/[id]/page.tsx` · `src/app/(app)/rezepte/RecipeBrowser.tsx` ·
`src/app/(app)/rezepte/page.tsx` · `src/app/(app)/rezepte/RecipeForm.tsx` ·
`src/app/(app)/rezepte/RecipeImageField.tsx` ·
`src/app/(app)/rezepte/importieren/ImportPanel.tsx` ·
`src/app/(app)/liste/ListView.tsx` · `src/app/(app)/TabBar.tsx` (Bauform,
Abschnitt 7 — keine alten Tokens, aber komplett neue Struktur) ·
`src/app/passwort-neu/page.tsx` · `src/app/anmelden/page.tsx`

Nicht in der Liste, weil beim Grep ohne alte Tokens: `src/components/icons.tsx`
(bleibt strukturell gültig, siehe Abschnitt 8), `RecipeForm.tsx` außerhalb der
vier `focus:border-accent`-Stellen, alle Seiten, die nur `Screen`/`Field`/
`Button` aus `ui.tsx` ohne eigene Farbklassen verwenden — dort reicht die
Änderung an `ui.tsx` selbst.

### 14.5 Nachweis vor Abschluss

Vor dem Abhaken der Prüfliste in Abschnitt 15 sollten folgende Suchen in
`src/` **keine** Treffer mehr liefern:

```
grep -rn "bg-brand\|text-brand\|bg-control\|aspect-\[9/10\]\|from-scrim" src/
grep -rn "bg-panel\|text-panel" src/          # außer als bewusst benannter Alt-Verweis in Kommentaren
grep -rn "Playfair_Display\|Poppins" src/
grep -rn "rounded-xl\|rounded-lg" src/        # rohe Radien statt --radius-soft
grep -rEn "size-18|w-18" src/                 # alte Zutatenkreis-Maße
```

Und folgende Suche sollte **nur noch** Treffer zeigen, die in 14.2 als
„bleibt `accent`" eingestuft wurden (aktuell: die beiden Link-Stellen, nach
Prüfung):

```
grep -rn "accent" src/ --include="*.tsx"
```

---

## 15. Prüfliste

**Optisch** — im direkten Vergleich mit `docs/app_redesign.jpg`:

- [ ] Zwei Flächen sauber getrennt: `--bg` überall, `--card` nur in der
      Übersicht
- [ ] Karten mit Schatten, Radius 24 px, nur dort
- [ ] Kein Scrim, kein Titel auf dem Foto — Titel steht daneben/darunter
- [ ] Foto querformatig 4:3 (`aspect-[4/3]`, nicht mehr `aspect-[9/10]`) auf Hero und Kachel
- [ ] Zutaten als Kacheln, nicht als Kreise, vierte Kachel angeschnitten
- [ ] Ziffernkasten in `--accent`, Ziffer nicht kursiv
- [ ] Kursiv ausschließlich am Namen in der Begrüßung
- [ ] Tab-Leiste freistehend, gerundet, mit Schatten — nicht bildschirmbreit
- [ ] `--accent` nie als dünne Linie oder Text direkt auf `--bg`

**Funktional:**

- [ ] Portionen ändern rechnet aus der Basismenge
- [ ] Mengen formatieren sauber (`1,5`, `250 g`, nie `2.000000`)
- [ ] Auf die Liste geht mit der eingestellten Portionszahl
- [ ] erneutes Auflegen korrigiert, statt zu verdoppeln
- [ ] alles per Tastatur bedienbar, Fokus sichtbar
- [ ] `prefers-reduced-motion` geprüft

**Qualität:** Sieht ein Element nach Bootstrap, Material, Tailwind-Vorgabe,
SaaS-Dashboard-Klischee (Verlauf, harter Schatten, Sperrsatz) oder
unverändertem Browser-Steuerelement aus — überarbeiten.
