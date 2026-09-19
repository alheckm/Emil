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
eigener, separater Schritt.

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
| Begrüßung „Hallo, *Name*" | 24 / 1,2 | 700, Name kursiv 500 |
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
Vorgängerfassung: die Referenz zeigt das Foto bei rund 30 % der Screenhöhe
(gemessen an beiden Screens der Referenz), nicht mehr 42–46 %. Auf dem Foto
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
`RowLink`: unverändert, mindestens 56 px hoch, `bg-soft` mit Chevron rechts.

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
text-accent-ink` (das war vorher `bg-brand` — ein Token, das nie definiert
war; jetzt ist es real), `quiet` = Haarlinie ohne Fläche, `danger` = Kontur in
`--danger`. Nur auf Werkzeug-Screens.

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
| Foto 42–46 % der Screenhöhe | Foto ca. 30 % der Screenhöhe | Gemessen an beiden Screens der neuen Referenz |
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

## 14. Prüfliste

**Optisch** — im direkten Vergleich mit `docs/app_redesign.jpg`:

- [ ] Zwei Flächen sauber getrennt: `--bg` überall, `--card` nur in der
      Übersicht
- [ ] Karten mit Schatten, Radius 24 px, nur dort
- [ ] Kein Scrim, kein Titel auf dem Foto — Titel steht daneben/darunter
- [ ] Foto ca. 30 % der Screenhöhe auf Hero und Kachel
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
