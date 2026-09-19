# Emil — Design-System

Verbindliche Gestaltungsregeln. `docs/app_redesign.jpg` ist die
**Spezifikation, nicht die Inspiration**: Weicht eine Umsetzung von der
Referenz ab, wird die Umsetzung korrigiert und nicht die Abweichung zur
Designentscheidung erklärt.

Dieses Dokument ist die einzige Quelle für Farben, Schrift, Maße und Bewegung.
Die Tokens stehen in `src/app/globals.css`, die Bausteine in
`src/components/ui.tsx` und den jeweiligen Screen-Komponenten — alle setzen
um, was hier steht. Ändert sich eine Regel, ändert sie sich hier zuerst.

Stand 19.09.2026: umgesetzt, im Browser gegen `docs/app_redesign.jpg`
kontrolliert und an mehreren Stellen nachgeschärft, wo der erste Durchgang zu
grob war (Kartenradius, Foto-Rand, „Details"-Knopf, Tab-Leiste, Titelgröße)
oder Dinge erfunden hatte, die die Referenz gar nicht zeigt (Begrüßung mit
Namen, Zutatenkacheln auf dem Rezept-Screen). `npm run typecheck`, `npm run
lint`, `npm run build` sind grün.

---

## 1. Haltung

Der Auftritt ist **Produkt**: eine kühle, helle Fliederblau-Fläche, eine
geometrische Grotesk, echte Karten mit Schatten für Listeninhalte, eine warme
Goldfarbe als durchgängige Markenfarbe für Aktionen. Das Vorbild ist eine
saubere Consumer-App.

Farbe ist Markenmittel. Gold markiert, was man antippen soll; Schwarz
markiert, was gerade aktiv ist; alles andere ist die helle Fläche, Weiß und
gedämpftes Blaugrau für Nebentext.

Was Emil ausdrücklich **nicht** sein soll:

- Zweite Farbfläche oder Schatten außerhalb der Rezeptvorschau-Karte
  (Abschnitt 4, 7) — der Rezept-Screen, die Einkaufsliste und alle
  Werkzeug-Screens bleiben auf der einen Grundfläche.
- `--accent` als Warnfarbe oder auf jeder beliebigen Bedienfläche — er ist
  Aktionen vorbehalten, Fehler laufen über `--danger`.
- Bildschirmbreite CTA-Knöpfe auf Rezept- und Einkaufsscreens — Aktionen
  stehen dort neben dem Inhalt, nie darüber (Abschnitt 3).
- Emojis als Symbole, gemischte Symbolsätze.
- Pulsierende graue Ladebalken — ein Web-Muster, das Emil nicht zeigt
  (Abschnitt 9).
- Standard-Formularelemente des Browsers im sichtbaren Auslieferungszustand.

---

## 2. Die Referenz lesen — Maßstab und eine Falle

`docs/app_redesign.jpg` ist 736 × 920 px groß und zeigt **zwei
iPhone-Screenshots auf einer hellgrauen Fläche** (`#e9e9eb`, gemessen an den
Bildrändern und der „Visit ↗ waxyweb.com"-Zeile unten links). Das ist der
Tisch, auf dem die Screenshots liegen — nicht die App. Wer daraus etwas
abliest, liest **innerhalb** der Gerätekante ab.

Innerhalb der Gerätekante gibt es in dieser Referenz **zwei** Flächen, beide
echt, keine Fehllesung:

1. Eine fliederblaue Grundfläche (`#c9d2e3`), die Kopfzeile, Filterzeile und
   auf dem Detail-Screen den gesamten Inhalt unter dem Foto trägt.
2. Eine weiße Karte mit Schatten, die **nur** auf dem Übersichts-Screen
   erscheint — als Behälter für eine Rezeptvorschau.

### Maßstab

Der sichtbare Bildschirminhalt eines Geräts (ohne Rahmen) ist in der Referenz
rund **291 px breit** (gemessen per Kantenerkennung, `x ≈ 55` bis `346`). Ein
echtes iPhone hat 390 pt. Faktor: **390 / 291 ≈ 1,34.**

**Übertragen werden Proportionen, nicht Absolutwerte**, und drei harte
Untergrenzen gehen jeder Umrechnung vor — sie sind Eigenschaften von iOS und
Daumen, nicht der Referenz:

| Grenze | Wert | Grund |
|---|---|---|
| Schrift in Eingabefeldern | ≥ 16 px | darunter zoomt iOS Safari beim Antippen hinein |
| Trefferfläche | ≥ 44 × 44 px | Apples Mindestmaß; Emil wird einhändig und in Bewegung bedient |
| Fließtext | ≥ 15 px | wird im Stehen aus Armlänge gelesen |

Die Maßtabellen in Abschnitt 5 und 6 sind das Ergebnis dieser Umrechnung.

---

## 3. Zwei Register

Emil hat zwei Sorten Screens, und sie sprechen bewusst unterschiedlich.

**Redaktionell** — Rezept, Rezeptliste, Einkauf. Aktionen sind zurückhaltend
und stehen neben dem Inhalt, nie darüber. Zurückhaltend heißt nicht farblos —
eine schmale Gold-Pille neben dem Inhalt (wie „Details" in der Referenz) ist
zulässig, solange sie nicht bildschirmbreit ist und nicht mit dem Titel
konkurriert.

**Werkzeug** — Anmelden, Registrieren, Formulare, Einstellungen, Import. Hier
gilt Bedienbarkeit vor Zurückhaltung: ein Feld sieht aus wie ein Feld, der
Absenden-Knopf ist bildschirmbreit, eindeutig und trägt `--accent`.

Beide Register teilen Farben, Schrift, Radien, Abstände und Bewegung. Sie
unterscheiden sich in der Lautstärke der Aktionen.

---

## 4. Farbe

Gemessen aus `docs/app_redesign.jpg`, innerhalb der Geräte (Abschnitt 2), mit
PIL/Python am Originalbild. Wo eine gemessene Rohfarbe aus Kontrast- oder
JPEG-Kompressionsgründen angepasst werden musste, steht das explizit dabei.

### Tokens

| Token | Wert | Rolle |
|---|---|---|
| `--bg` | `#c9d2e3` | Die Grundfläche. Kopfzeile, Filterzeile, gesamter Detail-Screen unter dem Foto. |
| `--card` | `#ffffff` | Die Rezeptvorschau-Karte in der Übersicht — die **einzige** Fläche mit eigenem Schatten. Nirgends sonst. |
| `--chip` | `#ffffff` | Untergrund der Zutatenkacheln (Abschnitt 7), wie `--card`. |
| `--soft` | `#bcc4d6` | Sichtbare Bedienfläche auf `--bg`: inaktive Filter-/Schlagwort-Pille, Suchfeld, Formularfeld. |
| `--border` | `#a8b2c9` | Haarlinie für Merkmal-Chips und Feldkanten. |
| `--text` | `#0b0b10` | Fließtext, Titel. 12,9 : 1 auf `--bg`, 19,6 : 1 auf `--card`. |
| `--muted` | `#4d5770` | Nebentext. 4,74 : 1 auf `--bg`, 6,7 : 1 auf `--card`. |
| `--accent` | `#f6ce8f` | Die Markenfarbe. CTA-Pillen, Icon-Badges auf Fotos, Ziffernkasten. |
| `--accent-ink` | `#0b0b10` (= `--text`) | Text/Icon auf `--accent`. 13,2 : 1. |
| `--danger` | `#93331f` | Löschen, Fehler — nie als Fließtext direkt auf `--bg` (nur 5,1 : 1, knapp), sondern auf `--card`/`--soft` (7,7 : 1). |
| `--ok` | `#28583d` | 5,4 : 1 auf `--bg`. |
| `--warn` | `#7a4f18` | 4,7 : 1 auf `--bg`. Bewusst dunkler Bronzeton, nicht Gold — sonst ist eine Warnmeldung von einer CTA-Pille nicht zu unterscheiden. |
| `--photo` | `#bcc4d6` (= `--soft`) | Das Bett unter einem Rezeptfoto, solange die signierte Adresse noch unterwegs ist, oder wenn ein Rezept keins hat. |
| `--shadow-card` | `0 16px 32px -14px rgba(23,25,40,.28)` | Der einzige Schatten im System, exklusiv für `--card`. |
| `--well` | `#f3f4f9` | Die Kapsel um den aktiven Tab in der Tab-Leiste — sitzt auf `--card` (Weiß), braucht deshalb nur einen Hauch Abhebung, nicht das Blaugrau von `--soft`. Exakt gemessen, nicht abgeleitet. |
| `--icon-muted` | `#98a0ad` | Symbolfarbe der inaktiven Tab-Einträge — heller als `--muted`, aus demselben Grund: sitzt auf `--card`, nicht auf `--bg`. Exakt gemessen, nicht von `--muted` abgeleitet. |

**Ein Vorbehalt zu `--accent` auf `--bg`:** Gold auf dem Fliederblau hat nur
**1,02 : 1** Kontrast — praktisch unsichtbar als dünne Kontur oder kleines
Symbol direkt auf der Grundfläche. `--accent` funktioniert ausschließlich als
**große, gefüllte Fläche** (Pille, Kreis) mit dunklem Text oder Icon darauf,
nie als Outline oder Text auf nacktem `--bg`.

### Regeln

1. **Zwei Flächen, klar getrennt.** `--bg` ist der Grund. `--card` ist die
   Ausnahme — sie erscheint ausschließlich in der Rezeptübersicht, als
   Behälter je Vorschau. Der Rezept-Screen selbst, die Einkaufsliste und alle
   Werkzeug-Screens bleiben auf `--bg`, ohne Karte.
2. `--accent` ist die Markenfarbe für Aktionen: primäre CTA-Pillen, der
   Ziffernkasten, Icon-Badges auf Fotos. Er ersetzt keine Statusfarbe — Fehler
   bleiben `--danger`, nie Gold.
3. Braucht ein Bedienelement auf `--bg` eine sichtbare Fläche, bekommt es
   `--soft`, nicht `--accent` — Gold ist Aktionen vorbehalten (sonst verliert
   es seine Signalwirkung).
4. Schatten ausschließlich an `--card`. Kein Schatten auf Knöpfen, Pillen,
   Icon-Badges oder dem Ziffernkasten.
5. Keine Verläufe, kein Text auf einem Foto. Titel stehen grundsätzlich neben
   oder unter dem Foto — nur kleine Icon-Badges (Zurück, Bearbeiten, „Auf der
   Liste") liegen direkt darauf.

### Dunkel

Kein Dark Mode. `docs/app_redesign.jpg` zeigt ausschließlich Hell, und aus der
kühlen Farbfamilie lässt sich ohne dunkle Referenz nichts sauber ableiten.
Offener Punkt, siehe Abschnitt 12.

---

## 5. Typografie

### Die Schrift

**Ein** Schriftschnitt für alles: Titel, Abschnitte, Fließtext und
Kleinschrift laufen in derselben geometrisch-humanistischen Grotesk, nur in
unterschiedlichem Schnitt und Gewicht — genau wie im Entwurf, der an keiner
Stelle eine Serife zeigt.

**Plus Jakarta Sans** (`--font-sans`, `--font-display` — beide CSS-Variablen
zeigen auf dieselbe Instanz), geladen über `next/font/google` (400, 500, 600,
700). Begründung der Wahl: Die Referenz zeigt ein geometrisches Grundgerüst
mit leicht humanistischer Abrundung und ein enges, niedriges „a" — das trifft
Plus Jakarta Sans näher als etwa Inter (zu neo-grotesk) oder Manrope (zu rund
im Auge).

Kein Kursiv-Schnitt im Einsatz: Die Referenz setzt in der Begrüßung ein Wort
kursiv (den Namen: „Hey *Ratul*,"), aber Emils Rezeptübersicht trägt eine
schlichte „Rezepte"-Überschrift ohne Namen — dafür gibt es keine passende
Entsprechung, also bleibt Kursiv ungenutzt statt an einer Stelle ohne Vorbild
erfunden zu werden.

### Skala

Ergebnis der Umrechnung aus Abschnitt 2 (Faktor ≈ 1,34), mit Untergrenzen.

| Rolle | Größe / Zeile | Schnitt |
|---|---|---|
| Rezepttitel (Kachel **und** Detail-Screen) | 32 / 1,15 | 700 |
| Screen-Überschrift (Rezepte, Einkauf, Einstellungen, Konto, Werkzeug-Screens) | 32 / 1,15 | 700 |
| Abschnitt („Zutaten", „Zubereitung", „Etwas ergänzen" …) | 15 / 1,3 | 600 |
| Fließtext, Beschreibung, Zubereitungsschritte | 15 / 1,5 | 400 |
| Formularfeld-Inhalt | 16 / 1,4 | 400 |
| Merkmal-Chip (Portionen, Zeit, Schlagwort) | 13 / 1,2 | 500 |
| Zutatenname unter der Einkaufslisten-Kachel | 13 / 1,2 | 500 |
| Nebentext, Feldbeschriftung | 13 / 1,4 | 400 |
| Filter-/Schlagwort-Pillen-Text | 13 / 1,2 | — |
| Tab-Beschriftung | 12 / 1,1 | 600 |
| Schritt-Ziffer im Kasten | 13 | 700 |

Der Rezepttitel liegt bei 32 px — näher an der reinen Umrechnung (Abschnitt 2)
als der erste Durchgang, der ihn auf 26 px gesetzt hatte. Die Umrechnung
selbst ergäbe rund 42–48 px (aus einer gemessenen Glyphenspanne von 49 px im
Mockup); 32 px ist der bewusste Kompromiss, weil deutsche Rezeptnamen länger
sind als „Omny Puerto" und beim reinen Umrechnungswert zu häufig dreizeilig
würden. Ein zu starker Abschlag von der Messung — wie im ersten Durchgang —
ist aber selbst ein Fehler, keine Vorsicht: **im Zweifel näher an der
Umrechnung bleiben, nicht großzügig abrunden.**

Kein Versalsatz mit Sperrsatz (`uppercase tracking-wide`). Die Referenz zeigt
Groß-/Kleinschreibung durchgehend, auch bei Pillen und Tabs.

---

## 6. Maß, Radius, Schatten

**Abstände** auf 4er-Raster: 4, 8, 12, 16, 20, 24, 32.

- Screen-Seitenrand: **20 px**, über `px-safe`/`px-5` mit der Safe Area.
- Kartenabstand in der Übersicht: 20 px zwischen zwei Karten.
- **Karten-Innenabstand ist zweigeteilt, nicht einheitlich** — das war im
  ersten Durchgang falsch (durchgehend 16 px angenommen). Gemessen an der
  Referenz sitzt der Text (Titel, Chips) mit dem vollen Seitenrand von 20 px
  (`px-5`), das Foto darunter dagegen fast randlos, nur **8 px** zur Karte
  (`px-2 pb-2`) — es bleibt sichtbar innerhalb der Karte, aber mit deutlich
  weniger Luft als der Text darüber.
- Inhaltsbreite: `max-w-md` (448 px), zentriert.
- **Rezept-Screen:** das Foto trägt denselben 20-px-Seitenrand wie der Rest
  der Seite (`px-5`) und läuft **nicht** mehr unter die Statusleiste — es ist
  eingerückt und gerundet, wie im zweiten Screenshot der Referenz, nicht
  randlos wie im ersten Durchgang.

**Radien**

| Token | Wert | Wofür |
|---|---|---|
| `--radius-card` | 32 px | Die Rezeptvorschau-Karte in der Übersicht (außen), ihr Foto und das Foto auf dem Rezept-Screen — alle drei teilen sich den großen Radius, weil sie mit sehr kleinem Rand nah an ihrer jeweiligen Außenkante sitzen. War 24 px im ersten Durchgang, deutlich zu klein gegen die Referenz. |
| `--radius-tile` | 14 px | Zutatenkacheln in der Einkaufsliste — abgerundetes Rechteck, keine Kreise. |
| `--radius-soft` | 12 px | Felder, kleine Knöpfe, Meldungen, Ziffernkasten. |
| `--radius-pill` | 999 px | Filter-Pillen, CTA-Pillen, Icon-Badges, Tab-Leiste, Suchfeld. |

**Schatten:** genau einer, `--shadow-card`, ausschließlich an `--card`
(Abschnitt 4). Kein Schatten auf Knöpfen, Pillen oder Icon-Badges — was eine
Kante braucht, bekommt eine Haarlinie in `--border`.

**Trefferflächen** 44 × 44 px, auch wenn die sichtbare Fläche kleiner ist. Ein
32-px-Kreis bekommt seine Trefferfläche über Padding oder ein Pseudoelement,
nicht über mehr Durchmesser.

---

## 7. Bausteine

### Screen-Kopfzeile
`src/components/ui.tsx`, `ScreenHeader`/`Screen`. Schlichte Überschrift
(„Rezepte", „Einkaufsliste", „Einstellungen" …) in der Skala aus Abschnitt 5,
ohne Aktion rechts — der runde Icon-Knopf zu Konto/Haushalt, der hier zuerst
saß (`SettingsButton`), ist auf Wunsch in die Tab-Leiste gewandert (siehe
TabBar unten); die Kopfzeile trägt jetzt nur noch den Titel. **Keine
Begrüßung mit Namen:** ein erster Durchgang hatte „Hallo, *Haushaltsname*"
nach dem Vorbild der Referenz-Begrüßung eingeführt — das war nicht verlangt,
brauchte Kursiv ohne sonstigen Zweck in der App und wurde wieder auf die
schlichte Überschrift zurückgenommen.

### FilterRow
Die bestehende Schlagwort-Filterung aus den Rezept-Tags, im neuen Farbschema:
eine waagerechte, randlose Reihe aus Pillen. Aktiv: `--text`-gefüllte Pille,
Text `--card`-weiß. Inaktiv: `--soft`-gefüllte Pille, Text `--muted`. Kein
Rahmen auf beiden Zuständen — die Fläche allein trägt den Zustand.

### RecipeBrowserCard
`src/app/(app)/rezepte/RecipeBrowser.tsx`. Eine echte Karte: `--card`-Fläche,
`--radius-card`, `--shadow-card`. Der Innenabstand ist **zweigeteilt**
(Abschnitt 6) — Text mit vollem 20-px-Rand, Foto mit nur 8 px. Aufbau von
oben:

1. In einem `px-5 pt-5`-Block: Rezepttitel (32/1,15, 700), darunter
   Merkmal-Chips (Portionen, Zeit falls vorhanden, bis zu zwei Schlagwörter)
   als Kontur-Chips in `--border`, Text 13/500 — Pendant zu „1,200 sq ft · 3
   Beds …" in der Referenz, aber mit echten Rezeptdaten statt einer
   erfundenen Kategorie ohne Entsprechung im Datenmodell.
2. In einem `px-2 pb-2 pt-4`-Block: das Rezeptfoto, `--radius-card`,
   Seitenverhältnis 4:3 — fast bündig mit der Karte, deutlich knapper
   umrandet als der Text darüber.

Auf dem Foto sitzt unten rechts eine `--accent`-Pille „Ansehen" — die einzige
Stelle, an der eine Gold-Fläche direkt auf einem Foto liegt statt auf `--bg`.
Wie „Details" in der Referenz trägt sie **kein loses Pfeil-Icon**, sondern
einen eigenen kleinen schwarzen Kreis (`bg-text text-card`, 24 px) mit dem
Pfeil darin, am rechten Ende der Pille — nicht nur eine Chevron-Kontur in
Akzent-Tinte neben dem Text.

Liegt das Rezept auf der Einkaufsliste, sitzt oben links auf dem Foto ein
Milchglas-Badge (`--card`/70 % + Blur), bewusst nicht in `--accent` — sonst
wäre der Listenstatus von der CTA-Farbe nicht zu unterscheiden.

### RecipeHero (Rezept-Screen)
`src/app/(app)/rezepte/[id]/RecipeHero.tsx`. Seitenverhältnis **4:3** (nicht
9:10 — an beiden Screens der Referenz gemessen). **Eingerückt und gerundet,
nicht randlos**: das Foto trägt denselben 20-px-Seitenrand wie der Rest der
Seite (`px-5`) plus `pt-safe` nach oben, mit `--radius-card`. Läuft nicht
mehr unter die Statusleiste — ein erster Durchgang hatte das Foto voller
Bildschirmbreite ohne Rundung gebaut (vom alten, randlosen System
übernommen), aber der zweite Screenshot der Referenz zeigt eindeutig ein
eingerücktes, gerundetes Foto mit sichtbarem Rand zur Bildschirmkante.

Auf dem Foto liegen zwei runde Icon-Badges oben links/rechts, beide 44 px
Trefferfläche: links **Zurück**, Milchglas
(`rgba(255,255,255,.7)` + `backdrop-filter: blur(8px)`, dunkles Symbol) — reine
Navigation, bleibt neutral. Rechts **Bearbeiten**, `bg-accent text-accent-ink`
gefüllt — eine Aktion, und Aktionen tragen die Markenfarbe, genau wie die
gold gefüllten Kontakt-Icons auf dem Foto der Referenz. **Kein Titel, kein
Scrim** — die Referenz legt Text nie über ein Foto.

Titel und Merkmal-Chips (dieselbe Chip-Reihe wie `RecipeBrowserCard`) stehen
direkt darunter, auf `--bg`, in `src/app/(app)/rezepte/[id]/page.tsx`. Danach
folgen Zutaten und Zubereitung in dieser Reihenfolge — die Referenz legt ihre
strukturell nächsten Entsprechungen zwar umgekehrt an (Foto → Beschreibung →
Galerie), aber ein Rezept liest man erst an den Zutaten entlang und dann an
den Schritten; die Abfolge folgt der Kochlogik, nicht der Analogie zur
Referenz.

Oben rechts steht bewusst **kein Herz**: Emil kennt keine Favoriten
(Abschnitt 12), und ein Knopf ohne Wirkung ist keine Option.

### Zutatenkacheln — nur in der Einkaufsliste
`src/app/(app)/liste/ListView.tsx`. Ein erster Durchgang hatte auf dem
Rezept-Screen zusätzlich zur Zutatenliste eine waagerechte Reihe aus
Foto-Kacheln gezeigt (`IngredientTile`, angelehnt an die „Gallery"-Kacheln
der Referenz) — das gibt es nicht mehr. Auf dem Rezept-Screen stehen Zutaten
ausschließlich als Textliste (Menge, Name, Notiz); für Fotos gibt es dort
keine Entsprechung in der Referenz, und die genaue Menge steht ohnehin nur im
Text.

Fotos bleiben der Einkaufsliste vorbehalten, wo sie beim Einsortieren im
Regal tatsächlich helfen: Raster, drei Spalten, `gap-x-2 gap-y-3`, Kachel
`--radius-tile`, `bg-chip`, freigestelltes Foto `object-fit: cover`. Unter dem
Foto stehen **Name und Menge**, je 13 px mit `hyphens-auto` und
Zwei-Zeilen-Deckel — beides gehört zur Kachel, nicht nur der Name, weil im
Laden die Menge genauso zählt wie die Zutat selbst. Fehlt ein Foto, steht der
Anfangsbuchstabe in `--muted`. Abgehakt: Bild `opacity-40`, ein Häkchen-Badge
in `--accent`/`--accent-ink` bleibt kräftig darüber.

**Ein Raster, nach Abteilung geordnet — keine Box je Abteilung.** Ein erster
Durchgang hatte jede Abteilung als eigenen Abschnitt mit eigenem Drei-Spalten-
Raster gebaut; eine unvollständige letzte Reihe ließ die Abteilung wie einen
eigenen Kasten mit Restplatz wirken, obwohl die Abteilung nur die Reihenfolge
bestimmt. Jetzt liegt die ganze Liste in **einem** Raster, die Abteilung
steht als schmale, volle Zeile über der ersten Kachel, die zu ihr gehört, und
die Kacheln danach laufen normal weiter — auch über eine unvollständige Reihe
hinweg.

**Details per Longpress, nicht über ein „⋯"-Menü.** Ein erster Durchgang
hatte oben rechts auf jeder Kachel einen kleinen `⋯`-Knopf, der die
Zusatzinfos (Rezeptquellen, Abteilung ändern, „von der Liste nehmen") *unter
der ganzen Abteilung* aufklappte — das war zweimal indirekt: ein Zusatzknopf
neben der eigentlichen Trefferfläche, und ein Aufklapp-Ort, der nicht bei der
gehaltenen Kachel lag. Jetzt hält man die Kachel selbst (500 ms), das öffnet
die Details **direkt unter dieser einen Kachel**, als eigene volle Zeile im
selben Raster. Ein kurzer Antipper hakt weiterhin ab, wie zuvor — die ganze
Kachel bleibt die einzige Trefferfläche. Bekannte Lücke: die Details sind
damit nur per Touch/Maus-Halten erreichbar, ohne Tastatur-Entsprechung (siehe
Abschnitt 12).

### ServingStepper
`RecipeActions.tsx`. Pille rechts neben „Zutaten" (`bg-soft` auf `--bg`),
`− 2 +`, 32 px sichtbar / 44 px Trefferfläche, `tabular-nums`,
`aria-live="polite"`. Die Tippkreise selbst sind `bg-card` (Weiß) — sichtbar
gegen das `--soft` der Pille. Berechnung immer aus der Basismenge
(`src/lib/core/scale.ts`), Formatierung über `src/lib/core/format.ts`.

### ShoppingListAction
`RecipeActions.tsx`. Ruhezustand: `bg-accent text-accent-ink`, vollgerundet
(`rounded-pill`), „＋ Einkaufsliste" — die Markenfarbe trägt hier genau die
Art schmaler, wichtiger Sekundäraktion, die „Details" in der Referenz zeigt.
Zustand „auf der Liste": Fläche wechselt auf `--soft`, Text auf `--text`,
Häkchen statt Plus — kein Grün. Ein dritter Zustand („Liste aktualisieren")
greift, wenn das Rezept mit einer *anderen* Portionszahl auf der Liste liegt;
`useOptimistic`, korrigiert statt zu verdoppeln (`add_recipe_to_list`).

### RecipeSteps
`src/app/(app)/rezepte/[id]/page.tsx`. Die Ziffer steht in einem Quadrat
(24 × 24 px, `--radius-soft`), `bg-accent text-accent-ink`, 13 px, 700 — kein
Kursiv-Schnitt im System (Abschnitt 5). Text daneben 15/1,5, Abstand zwischen
Schritten 16 px.

### TabBar
`src/app/(app)/TabBar.tsx`. Freistehende, vollgerundete Leiste (`--card` mit
`--shadow-card`), mit sichtbarem `--bg`-Rand ringsum — keine bildschirmbreite,
sticky Leiste mit Haarlinie mehr. **Drei Einträge:** Einkauf, Rezepte und
Konto/Haushalt — der runde Knopf, der zuerst oben rechts auf der Kopfzeile
saß, ist auf Wunsch hierher gewandert, damit Navigation an einer Stelle
steht statt an zweien.

Der aktive Eintrag ist **nicht** vollflächig schwarz — das war ein erster,
zu grober Durchgang. Die Referenz zeigt eine helle Kapsel in `--well`
(`#f3f4f9`, exakt auf der Leiste gemessen — **nicht** `--soft`, das für
Bedienflächen auf `--bg` reserviert ist und dort deutlich mehr Blaugrau
braucht, um sich abzusetzen), und nur das Symbol darin sitzt in einem
eigenen kleinen schwarzen Kreis (`bg-text text-card`, 32 px); das Label steht
direkt auf der Kapsel, in `--text`.

**Alle drei Einträge sind gleich breit** (`flex-1`) und zeigen ihr Label
dauerhaft, nicht nur der aktive. Ein früherer Stand ließ den aktiven Eintrag
die überschüssige Breite der Leiste einnehmen (`flex-1`) und die inaktiven
auf Icongröße schrumpfen (`shrink-0`), ohne Label — das ließ die Symbole beim
Tab-Wechsel seitlich springen, weil sich die Spaltenbreite mit dem aktiven
Zustand änderte. Jetzt wechselt beim Tab-Wechsel nur die Farbe/Kapsel, nie
die Größe: die `--well`-Kapsel füllt die volle Breite ihrer Spalte, beim
ersten Eintrag reicht sie damit weiterhin bis an die linke Rundung der
Leiste heran, so wie zuvor bei der asymmetrischen Aufteilung. Der inaktive
Eintrag zeigt Symbol und Label in `--icon-muted` (`#98a0ad`) — heller als
`--muted`, weil er auf `--card` (Weiß) steht statt auf `--bg`; `--muted` ist
für den Kontrast auf der Grundfläche abgestimmt und wirkt auf Weiß zu
dunkel/kräftig. Wechsel im selben Frame (`useOptimistic`), `data-pending`
dimmt den Inhalt darüber.

### RowLink / Field / Select / Textarea / Button / Notice
`src/components/ui.tsx`. `RowLink`: mindestens 56 px hoch, `bg-soft` mit
Chevron rechts in `--muted` (nicht `--accent` — eine stille Bedienfläche in
der Markenfarbe wäre ein Aktions-Signal ohne Aktion).

Felder: 48 px hoch, `rounded-soft`, `bg-soft`, Haarlinie `--border`, 16 px
Schrift, Fokus über `border-text`.

`Button`: 48 px, bildschirmbreit, `rounded-pill`; `primary` = `bg-accent
text-accent-ink`, `quiet` = Haarlinie ohne Fläche, `danger` = Kontur in
`--danger`. Nur auf Werkzeug-Screens.

`Notice`: `role="alert"` bei Fehlern, Fläche `bg-danger/10` mit
`border-danger/40`, nie nacktes `--bg` — `--danger`-Text braucht dafür
Kontrast.

---

## 8. Symbole

Eigene Inline-SVG nach Lucides Regeln (24er-Raster, `viewBox="0 0 24 24"`,
Kontur `stroke-width: 1,75`, runde Enden, `currentColor`) —
`src/components/icons.tsx`: Chevron links/rechts, Stift, Plus, Minus, Häkchen.

**Zwei Ausnahmen:**

- Die Tab-Symbole (Korb, Buch, `TabBar.tsx`) sind gefüllt, nicht konturiert —
  iOS-Tab-Leisten setzen gefüllte Glyphen, eine Kontur wirkt in 11–12 px
  zerbrechlich.
- Icon-Badges auf Fotos und im Ziffernkasten stehen auf **gefüllter**
  `--accent`- oder `--soft`-Fläche; das Symbol selbst bleibt Kontur.

Kein Herz — Emil kennt keine Favoriten (Abschnitt 12).

---

## 9. Bewegung

**120–250 ms**, `ease-out`, kein Federn, kein Hüpfen, kein Konfetti.

| Utility | Verhalten |
|---|---|
| `press` | `opacity .7` + `scale(.98)`, beim Drücken **ohne** Übergang, beim Loslassen 120 ms |
| `press-flat` | wie oben ohne Skalierung |
| `count-swap` | Ziffernwechsel, 150 ms Einblendung |
| `dims-when-pending` | dimmt auf 0,5, solange ein Vorfahr `data-pending` trägt |

`placeholder-box` ist eine ruhige getönte Fläche, 320 ms unsichtbar, kein
Puls — pulsierende Balken sind ein Web-Muster, das Emil als Home-Screen-App
nicht zeigt. `prefers-reduced-motion: reduce` schaltet `placeholder-box` und
`count-swap` ab.

---

## 10. Zustände

Jedes bedienbare Element braucht alle sechs: Ruhe, Zeiger darüber (nur
Desktop, minimal), Gedrückt (`press`/`press-flat`), Fokus
(`:focus-visible`, 2 px `--text`, auf dem Foto weiß), Gesperrt (`opacity .5`),
Gewählt (`aria-pressed`/`aria-current`, optisch über `--accent` oder
`--text`, je nach Baustein).

Der blaue Standardring des Browsers passt zu nichts hier — weglassen ist
trotzdem keine Option: Portionswahl und Einkaufsliste müssen mit der Tastatur
bedienbar bleiben.

---

## 11. Barrierefreiheit

- Semantisches HTML: `<ol>` für Schritte, `<ul>` für Zutaten und Chips,
  `<button>` für Aktionen, `<h1>/<h2>` in der richtigen Reihenfolge.
- Symbolknöpfe brauchen `aria-label` („Zurück", „Rezept bearbeiten").
- Der Portionswähler ist vollständig per Tastatur bedienbar, die Ziffer meldet
  sich über `aria-live="polite"`.
- Dekoratives Bild bekommt `alt=""` — der Rezepttitel steht daneben im Text.

**Kontrast** (WCAG 2.1, berechnet):

| Paar | Verhältnis | Urteil |
|---|---|---|
| `--text` auf `--bg` | 12,91 : 1 | gut |
| `--text` auf `--card` | 19,63 : 1 | gut |
| `--muted` auf `--bg` | 4,74 : 1 | gut, knapp über der Grenze |
| `--muted` auf `--card` | 6,7 : 1 | gut |
| `--muted` auf `--soft` | 4,12 : 1 | **darunter** — Nebentext auf `--soft` steht deshalb in `--text` |
| `--accent-ink` auf `--accent` | 13,22 : 1 | gut |
| `--accent` auf `--bg` (Fläche, nicht Text) | 1,02 : 1 | kein Text/Kontur-Einsatz auf nacktem `--bg` (Abschnitt 4) |
| `--danger` auf `--bg` | 5,05 : 1 | gut |
| `--danger` auf `--card` | 7,68 : 1 | gut |
| `--ok` auf `--bg` | 5,4 : 1 | gut |
| `--warn` auf `--bg` | 4,7 : 1 | gut |

---

## 12. Offene Punkte

Arbeitsliste, kein Ist-Zustand. Stand 19.09.2026:

1. **Kein Dark Mode.** Siehe Abschnitt 4. Sobald eine dunkle Referenz
   vorliegt, wird sie abgeleitet (Flächenrollen tauschen, Kontraste neu
   prüfen) statt geraten.
2. **`--shadow-card`-Werte sind nach Augenmaß gesetzt**, nicht pixelgenau
   gemessen — an einer JPEG-komprimierten Schattenkante lässt sich Blur/Spread
   nicht zuverlässig ablesen.
3. **`--warn` und `--accent` liegen in derselben Farbfamilie** (beide
   Gold/Bronze-Ton). Im UI beobachten, ob eine Warnmeldung neben einer
   CTA-Pille als solche erkennbar bleibt.
4. **Es gibt keine Favoriten.** Der Stift zum Bearbeiten sitzt, wo die
   Referenz ein Herz zeigt (RecipeHero). Kommt die Funktion, braucht sie eine
   Spalte in `recipes`, einen Weg in `src/lib/data/recipes.ts` und einen
   Filter in der Übersicht — dann rückt der Stift und das Herz nimmt seinen
   Platz.
5. **Die Zutatenfotos decken die Zutaten nur teilweise ab**
   (`scripts/ingredient-images/`), sichtbar in der Einkaufsliste — dem
   einzigen Ort, an dem sie noch erscheinen (siehe „Zutatenkacheln — nur in
   der Einkaufsliste", Abschnitt 7).
6. **Die Zusatzinfos einer Einkaufslisten-Zutat (Longpress) haben keine
   Tastatur-Entsprechung.** Kurzes Antippen hakt weiter über Enter/Leertaste
   ab, aber Rezeptquellen, Abteilung ändern und „von der Liste nehmen" sind
   nur per Halten (Touch/Maus) erreichbar. Braucht noch einen Weg ohne
   Zeigegerät — etwa eine Kontextmenü-Taste oder eine zweite, per Tastatur
   fokussierbare Aktion.

---

## 13. Prüfliste

**Optisch** — im direkten Vergleich mit `docs/app_redesign.jpg`, im Browser
gegengeprüft:

- [x] Zwei Flächen sauber getrennt: `--bg` überall, `--card` nur in der
      Übersicht
- [x] Karten mit Schatten, großzügiger Radius (32 px), nur dort
- [x] Kartenfoto und Rezept-Screen-Foto knapp und gerundet, nicht randlos
      voll ausgereizt — Text trägt vollen Seitenrand, Foto nur 8 px
- [x] Kein Scrim, kein Titel auf dem Foto — Titel steht daneben/darunter
- [x] Foto querformatig 4:3 auf Hero und Kachel
- [x] „Ansehen"/„Details"-Pille mit eigenem schwarzem Kreis-Badge, nicht nur
      loses Icon
- [x] Bearbeiten-Knopf auf dem Rezeptfoto in `--accent`, Zurück bleibt
      Milchglas
- [x] Keine Zutatenkacheln auf dem Rezept-Screen — nur Textliste; Kacheln nur
      in der Einkaufsliste
- [x] Ziffernkasten in `--accent`
- [x] Tab-Leiste freistehend, gerundet, mit Schatten — aktiver Eintrag als
      helle `--well`-Kapsel mit schwarzem Icon-Kreis, nicht vollflächig
      schwarz und nicht `--soft`
- [x] Alle Tabs gleich breit, Label immer sichtbar — nur Farbe/Kapsel
      wechseln aktiv, nie die Größe, damit kein Symbol beim Wechsel springt
- [x] Inaktive Tab-Symbole in `--icon-muted`, nicht `--muted`
- [x] Konto/Haushalt als dritter Tab-Eintrag statt Knopf in der Kopfzeile
- [x] Titelgröße nah an der gemessenen Umrechnung (32 px), nicht grob
      abgerundet
- [x] `--accent` nie als dünne Linie oder Text direkt auf `--bg`

**Funktional:**

- [x] Portionen ändern rechnet aus der Basismenge
- [x] Mengen formatieren sauber (`1,5`, `250 g`, nie `2.000000`)
- [x] Auf die Liste geht mit der eingestellten Portionszahl
- [x] erneutes Auflegen korrigiert, statt zu verdoppeln
- [x] alles per Tastatur bedienbar, Fokus sichtbar
- [ ] `prefers-reduced-motion` im Browser geprüft (nicht nur im Code)

**Qualität:** Sieht ein Element nach Bootstrap, Material, Tailwind-Vorgabe,
SaaS-Dashboard-Klischee (Verlauf, harter Schatten, Sperrsatz) oder
unverändertem Browser-Steuerelement aus — überarbeiten.
