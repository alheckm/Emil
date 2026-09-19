# Emil — Design-System

Verbindliche Gestaltungsregeln. `docs/app_redesign.jpg` ist die
**Spezifikation, nicht die Inspiration**: Weicht eine Umsetzung von der
Referenz ab, wird die Umsetzung korrigiert und nicht die Abweichung zur
Designentscheidung erklärt.

Dieses Dokument ist die einzige Quelle für Farben, Schrift, Maße und Bewegung.
Die Tokens stehen in `src/app/globals.css`, die Bausteine in
`src/components/ui.tsx` und den jeweiligen Screen-Komponenten — alle setzen
um, was hier steht. Ändert sich eine Regel, ändert sie sich hier zuerst.

Stand 19.09.2026: umgesetzt und gegen den Code geprüft (`npm run typecheck`,
`npm run lint`, `npm run build`, alle grün).

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

1. Eine fliederblaue Grundfläche (`#c9d2e3`), die Statusleiste, Kopfzeile,
   Begrüßung, Filterzeile und auf dem Detail-Screen den gesamten Inhalt unter
   dem Foto trägt.
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
| `--bg` | `#c9d2e3` | Die Grundfläche. Kopfzeile, Begrüßung, Filterzeile, gesamter Detail-Screen unter dem Foto. |
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
700, kursiv 500). Begründung der Wahl: Die Referenz zeigt ein geometrisches
Grundgerüst mit leicht humanistischer Abrundung, ein enges, niedriges „a" und
eine kräftige, nicht überzogene Kursive für die Namens-Betonung in der
Begrüßung — das trifft Plus Jakarta Sans näher als etwa Inter (zu
neo-grotesk) oder Manrope (zu rund im Auge).

### Kursive Betonung

Die Referenz setzt in der Begrüßung genau ein Wort kursiv (den Namen: „Hey
*Ratul*,"). **Kursiv markiert ausschließlich den Namen** in der Begrüßung auf
der Rezeptübersicht (bei Emil: der Haushaltsname), nirgends sonst — nicht in
Rezepttiteln, nicht in Abschnittsüberschriften, nicht im Ziffernkasten.

### Skala

Ergebnis der Umrechnung aus Abschnitt 2 (Faktor ≈ 1,34), mit Untergrenzen.

| Rolle | Größe / Zeile | Schnitt |
|---|---|---|
| Rezepttitel (Kachel **und** Detail-Screen) | 26 / 1,2 | 700 |
| Screen-Überschrift (Einkauf, Einstellungen, Konto, Werkzeug-Screens) | 26 / 1,2 | 700 |
| Begrüßung „Hallo, *Haushaltsname*" (nur Rezeptübersicht) | 24 / 1,2 | 700, Name kursiv |
| Abschnitt („Zutaten", „Zubereitung", „Etwas ergänzen" …) | 15 / 1,3 | 600 |
| Fließtext, Beschreibung, Zubereitungsschritte | 15 / 1,5 | 400 |
| Formularfeld-Inhalt | 16 / 1,4 | 400 |
| Merkmal-Chip (Portionen, Zeit, Schlagwort) | 13 / 1,2 | 500 |
| Zutatenname unter der Kachel | 13 / 1,2 | 500 |
| Nebentext, Feldbeschriftung | 13 / 1,4 | 400 |
| Filter-/Schlagwort-Pillen-Text | 13 / 1,2 | — |
| Tab-Beschriftung | 12 / 1,1 | 600 |
| Schritt-Ziffer im Kasten | 13 | 700, **nicht kursiv** |

Der Rezepttitel bleibt bei 26 px, obwohl die reine Umrechnung deutlich mehr
ergäbe: deutsche Rezeptnamen sind länger als „Omny Puerto" und brauchen mehr
Zeilenraum, nicht mehr Größe.

Kein Versalsatz mit Sperrsatz (`uppercase tracking-wide`). Die Referenz zeigt
Groß-/Kleinschreibung durchgehend, auch bei Pillen und Tabs.

---

## 6. Maß, Radius, Schatten

**Abstände** auf 4er-Raster: 4, 8, 12, 16, 20, 24, 32.

- Screen-Seitenrand: **20 px**, über `px-safe` mit der Safe Area.
- Kartenabstand in der Übersicht: 20 px zwischen zwei Karten.
- Karten-Innenabstand: durchgehend 16 px — Text, Chips und Foto teilen sich
  denselben Rand, keine engere Sonderbehandlung fürs Foto.
- Inhaltsbreite: `max-w-md` (448 px), zentriert.
- **Ausnahme Rezept-Screen:** das Foto läuft über die volle Breite bis unter
  die Statusleiste; Titel und Abschnitte darunter setzen ihren eigenen
  Seitenrand.

**Radien**

| Token | Wert | Wofür |
|---|---|---|
| `--radius-card` | 24 px | Die Rezeptvorschau-Karte in der Übersicht, außen. |
| `--radius-tile` | 14 px | Foto in der Karte, Zutatenkacheln — abgerundetes Rechteck, keine Kreise. |
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

### TopBar / Begrüßung
Nur auf der Rezeptübersicht, `src/app/(app)/rezepte/page.tsx`. Links die
Begrüßung „Hallo, *Haushaltsname*" (zwei Zeilen möglich, Name kursiv), rechts
eine runde Icon-Fläche (`--soft`, 44 px Trefferfläche) zu Konto/Haushalt
(`SettingsButton`). Kein zweites Icon links — die Referenz zeigt dort einen
Standort-Dropdown, für den es bei Emil kein Konzept gibt.

Begrüßung und Rezeptkarten hängen an derselben Suspense-Grenze (beide
brauchen den Haushalt) — `GreetingSkeleton` reserviert den Platz, damit beim
Nachladen nichts springt.

### FilterRow
Die bestehende Schlagwort-Filterung aus den Rezept-Tags, im neuen Farbschema:
eine waagerechte, randlose Reihe aus Pillen. Aktiv: `--text`-gefüllte Pille,
Text `--card`-weiß. Inaktiv: `--soft`-gefüllte Pille, Text `--muted`. Kein
Rahmen auf beiden Zuständen — die Fläche allein trägt den Zustand.

### RecipeBrowserCard
`src/app/(app)/rezepte/RecipeBrowser.tsx`. Eine echte Karte: `--card`-Fläche,
`--radius-card`, `--shadow-card`, 16 px Innenabstand rundum. Aufbau von oben:

1. Rezepttitel (26/1,2, 700).
2. Merkmal-Chips: Portionen, Zeit (falls vorhanden), bis zu zwei Schlagwörter
   — Kontur-Chips in `--border`, Text 13/500. Pendant zu „1,200 sq ft · 3
   Beds …" in der Referenz; anders als dort erfunden sind es echte
   Rezeptdaten, keine Platzhalter-Kategorie ohne Entsprechung im Datenmodell.
3. Das Rezeptfoto, `--radius-tile`, Seitenverhältnis 4:3.
4. Eine `--accent`-Pille „Ansehen" mit Pfeil-Icon, unten rechts **auf dem
   Foto** (wie „Details" in der Referenz) — die einzige Stelle, an der eine
   Gold-Fläche direkt auf einem Foto sitzt statt auf `--bg`.

Liegt das Rezept auf der Einkaufsliste, sitzt oben links auf dem Foto ein
Milchglas-Badge (`--card`/70 % + Blur), bewusst nicht in `--accent` — sonst
wäre der Listenstatus von der CTA-Farbe nicht zu unterscheiden.

### RecipeHero (Rezept-Screen)
`src/app/(app)/rezepte/[id]/RecipeHero.tsx`. Das Foto füllt die volle
Bildschirmbreite, oben, bis unter die Statusleiste, ohne Rundung,
Seitenverhältnis **4:3** (nicht mehr 9:10 — an beiden Screens der Referenz
gemessen). Auf dem Foto liegen ausschließlich zwei runde Icon-Badges oben
links/rechts (`rgba(255,255,255,.7)` + `backdrop-filter: blur(8px)`, dunkles
Symbol): links Zurück, rechts der Weg zum Bearbeiten. **Kein Titel, kein
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

### IngredientTile
`src/app/(app)/rezepte/[id]/RecipeActions.tsx`. Kachel statt Kreis: 72 × 72 px
(`size-18`), `--radius-tile`, `bg-chip`, freigestelltes Zutatenfoto darin
`object-fit: cover`, Name darunter in 13 px mit `hyphens-auto` und
Zwei-Zeilen-Deckel — deutsche Zutatennamen sind oft ein einziges langes Wort.
Waagerecht scrollbar, `scroll-snap-type: x proximity`, vierte Kachel
angeschnitten als Wisch-Einladung. Fehlt ein Foto, steht der Anfangsbuchstabe
in `--muted`.

Im Einkauf (`src/app/(app)/liste/ListView.tsx`) als Raster: drei Spalten,
`gap-x-3 gap-y-5`, dieselbe Kachelform. Abgehakt: Bild `opacity-40`, ein
Häkchen-Badge in `--accent`/`--accent-ink` bleibt kräftig darüber.

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
(24 × 24 px, `--radius-soft`), `bg-accent text-accent-ink`, 13 px, **700, nicht
kursiv** — Kursiv ist dem Namen in der Begrüßung vorbehalten (Abschnitt 5).
Text daneben 15/1,5, Abstand zwischen Schritten 16 px.

### TabBar
`src/app/(app)/TabBar.tsx`. Freistehende, vollgerundete Leiste (`--card` mit
`--shadow-card`), mit sichtbarem `--bg`-Rand ringsum — keine bildschirmbreite,
sticky Leiste mit Haarlinie mehr. Zwei Einträge (Einkauf, Rezepte). Der aktive
Eintrag füllt seine Hälfte der Leiste komplett in `--text`, Symbol und Label
in `--card`-Weiß; der inaktive zeigt nur das Symbol in `--muted`, ohne Label.
Wechsel im selben Frame (`useOptimistic`), `data-pending` dimmt den Inhalt
darüber.

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
2. **Rechtes TopBar-Icon ist der einzige Zugang zu Konto/Haushalt**, nicht
   die Notifications-Glocke der Referenz — Emil hat kein
   Benachrichtigungskonzept. Passt so; nur vermerkt, falls sich das ändert.
3. **`--shadow-card`-Werte sind nach Augenmaß gesetzt**, nicht pixelgenau
   gemessen — an einer JPEG-komprimierten Schattenkante lässt sich Blur/Spread
   nicht zuverlässig ablesen.
4. **`--warn` und `--accent` liegen in derselben Farbfamilie** (beide
   Gold/Bronze-Ton). Im UI beobachten, ob eine Warnmeldung neben einer
   CTA-Pille als solche erkennbar bleibt.
5. **Es gibt keine Favoriten.** Der Stift zum Bearbeiten sitzt, wo die
   Referenz ein Herz zeigt (RecipeHero). Kommt die Funktion, braucht sie eine
   Spalte in `recipes`, einen Weg in `src/lib/data/recipes.ts` und einen
   Filter in der Übersicht — dann rückt der Stift und das Herz nimmt seinen
   Platz.
6. **Die Zutatenfotos decken die Zutaten nur teilweise ab**
   (`scripts/ingredient-images/`). Für die Kachelform (statt Kreis) müssen
   Rohbilder ggf. neu zugeschnitten werden.

---

## 13. Prüfliste

**Optisch** — im direkten Vergleich mit `docs/app_redesign.jpg`:

- [x] Zwei Flächen sauber getrennt: `--bg` überall, `--card` nur in der
      Übersicht
- [x] Karten mit Schatten, Radius 24 px, nur dort
- [x] Kein Scrim, kein Titel auf dem Foto — Titel steht daneben/darunter
- [x] Foto querformatig 4:3 auf Hero und Kachel
- [x] Zutaten als Kacheln, nicht als Kreise, vierte Kachel angeschnitten
- [x] Ziffernkasten in `--accent`, Ziffer nicht kursiv
- [x] Kursiv ausschließlich am Namen in der Begrüßung
- [x] Tab-Leiste freistehend, gerundet, mit Schatten — nicht bildschirmbreit
- [x] `--accent` nie als dünne Linie oder Text direkt auf `--bg`
- [ ] Im Browser gegenkontrolliert (Chrome-Erweiterung war bei der Umsetzung
      nicht verbunden — visuell noch nicht am Gerät geprüft, nur `typecheck`
      / `lint` / `build` / Dev-Server-Smoke-Test)

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
