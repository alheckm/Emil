# Emil — Design-System

Verbindliche Gestaltungsregeln. `app_design.jpg` im Projektstamm ist die
**Spezifikation, nicht die Inspiration**: Wenn eine Umsetzung von der Referenz
abweicht, wird die Umsetzung korrigiert und nicht die Abweichung zur
Designentscheidung erklärt.

Dieses Dokument ist die einzige Quelle für Farben, Schrift, Maße und Bewegung.
Die Tokens stehen in `src/app/globals.css`, die Bausteine in
`src/components/ui.tsx` — beide setzen um, was hier steht. Ändert sich eine
Regel, ändert sie sich hier zuerst.

---

## 1. Haltung

Der Auftritt ist **redaktionell**, nicht technisch: hochwertige Food-Fotografie,
eine Serife mit Strichkontrast, viel Ruhe, fast keine Farbe. Das Vorbild ist ein
modernes Kochbuch, nicht eine App-Oberfläche.

Die Farbe trägt das Essen. Alles andere ist Grau, Off-White, Weiß und Schwarz.

Was Emil ausdrücklich **nicht** sein soll — jede dieser Erscheinungen ist ein
Grund zur Überarbeitung, nicht eine Geschmacksfrage:

- Material-Design-Kärtchen mit sichtbarer Umrandung
- Farbflächen als UI (bunte Chips, farbige Kopfzeilen, Verläufe)
- harte Schlagschatten
- große, bildschirmbreite CTA-Knöpfe auf inhaltlichen Screens
- Standard-Formularelemente des Browsers im sichtbaren Auslieferungszustand
- Emojis als Symbole
- gemischte Symbolsätze
- pulsierende graue Ladebalken (Web-Muster; Emil läuft als App vom
  Home-Bildschirm)

---

## 2. Der Maßstabsfehler — bitte zuerst lesen

`app_design.jpg` ist 1000 × 750 px groß und zeigt zwei **Mockup-Handys**. Die
Bildfläche eines Geräts darin ist rund 265 px breit. Ein echtes iPhone hat
390 pt. Jede in der Referenz abgemessene Pixelzahl ist damit um etwa **Faktor
1,47** zu klein.

Wer die Referenz mit dem Lineal ausliest, landet bei „Body 12 px" und
„Zutatenkreis 54 px" — beides wäre auf dem Gerät unlesbar bzw. unbedienbar.
**Übertragen werden Proportionen und Verhältnisse, nicht Absolutwerte.**

Drei harte Untergrenzen gehen jeder Messung vor:

| Grenze | Wert | Grund |
|---|---|---|
| Schrift in Eingabefeldern | ≥ 16 px | darunter zoomt iOS Safari beim Antippen hinein, der Screen sitzt danach schief |
| Trefferfläche | ≥ 44 × 44 px | Apples Mindestmaß; Emil wird einhändig und in Bewegung bedient |
| Fließtext | ≥ 15 px | wird im Stehen aus Armlänge gelesen |

Die Maßtabelle in Abschnitt 5 ist das Ergebnis dieser Umrechnung und gilt —
nicht der Zollstock am JPEG.

---

## 3. Zwei Register

Emil hat zwei Sorten Screens, und sie sprechen bewusst unterschiedlich. Das
löst den scheinbaren Widerspruch „keine großen Knöpfe" gegen „ein Login braucht
einen Absenden-Knopf".

**Redaktionell** — Rezept, Rezeptliste, Einkauf. Hier gilt die Referenz
vollständig: Foto dominiert, Text ist klein und ruhig, Aktionen sind
zurückhaltend und stehen neben dem Inhalt, nie darüber. Kein Knopf konkurriert
mit dem Rezepttitel.

**Werkzeug** — Anmelden, Registrieren, Formulare, Einstellungen, Import. Hier
gilt Bedienbarkeit vor Zurückhaltung: ein Feld sieht aus wie ein Feld, der
Absenden-Knopf ist bildschirmbreit und eindeutig. Diese Screens bekommt man
selten zu sehen, und wenn, will man sie hinter sich bringen.

Beide Register teilen Farben, Schrift, Radien, Abstände und Bewegung. Sie
unterscheiden sich **nur** in der Lautstärke der Aktionen.

---

## 4. Farbe

Aus `app_design.jpg` gemessen, nicht geschätzt. Der Entwurf arbeitet mit **zwei**
Flächen: die warme Karte liegt auf einem neutral-grauen Canvas — nicht
umgekehrt. Genau daher kommt der Eindruck, dass die Karte schwebt.

### Tokens (hell)

| Token | Wert | Rolle |
|---|---|---|
| `--bg` | `#d7d5d6` | Canvas. Trägt **keinen** Fließtext. |
| `--surface` | `#f5f1ee` | Karte, Inhaltsfläche. Alles Gelesene steht hier. |
| `--chip` | `#ffffff` | Nur Zutatenkreise. |
| `--soft` | `#ece7e3` | Leise UI-Fläche: Stepper, Felder, ruhende Zustände. |
| `--panel` | `#080808` | Der Ziffernkasten. Die einzige kräftige Fläche im Screen. |
| `--panel-text` | `#ffffff` | Ziffer darin. |
| `--text` | `#242321` | Fließtext. 13,98:1 auf `--surface`. |
| `--muted` | `#8a827b` | Nebentext — **siehe Abschnitt 11, Kontrast ist zu gering.** |
| `--border` | `#d8d1cc` | Haarlinie. Sparsam. |
| `--accent` | `#b5442c` | **Keine Markenfarbe.** Nur Warnung: Löschen, Fehler. |
| `--photo` | `#2b2622` | Bett unter dem Rezeptfoto, in beiden Modi gleich. |
| `--scrim` | `rgba(12,10,9,.72)` | Verlauf unter dem Titel auf dem Foto. |
| `--control` | `#ffffff` | Kleine runde Bedienfläche: die Kreise im Stepper. |
| `--ok` / `--warn` | `#3f6f52` / `#b5762a` | Statusmeldungen, sonst nichts. |

**Zum Scrim-Wert.** Hier stand `rgba(12,10,9,.34)`, gemessen am Entwurf. Auf
dem Foto der Referenz geht das auf — es ist mitteldunkles Teal. Ein Rezeptfoto
in Emil kommt vom Nutzer und kann ein weißer Teller vor weißer Tischdecke sein;
bei .34 liegt der weiße Titel dann bei 1,45:1 und ist schlicht weg. .72 an der
Unterkante ergibt gegen Weiß 3,2:1 und damit die AA-Grenze für große Schrift
(≥ 24 px). Der Verlauf trägt oben weiterhin nichts (`via-scrim/30` bei halber
Höhe, dann `transparent`), der Eindruck des Entwurfs bleibt also erhalten —
dunkel wird nur das Band, in dem der Titel steht.

`--control` ist im Dunkeln `#3b352f` und nicht weiß: das Symbol darin ist
cremefarben und wäre auf Weiß nicht da. `--chip` kann diese Rolle nicht
mitübernehmen, weil es wegen der freigestellten Fotos in beiden Modi weiß
bleiben muss.

Reines Weiß ist den Zutatenkreisen vorbehalten. Es ist die hellste Fläche im
Entwurf und trägt freigestellte Fotos, die selbst weißen Grund haben — jeder
andere Ton gäbe einen sichtbaren Ring.

### Regeln

1. **Keine zusätzliche Akzentfarbe.** Farbe kommt aus dem Essen.
2. `--accent` ist ein Warnton, keine Marke. Er erscheint an Löschen und
   Fehlern, nirgends sonst. Ein primärer Knopf in Koralle ist ein Fehler.
3. Fließtext steht auf `--surface`, nie auf `--bg`. Der Canvas trägt nur
   Flächen.
4. Keine Verläufe außer dem Scrim unter dem Titel auf dem Foto.

### Dunkel

Nicht weggelassen, sondern gedreht: gekocht wird abends, und im
Supermarkt-Halbdunkel blendet eine cremefarbene Fläche. Die Rollen tauschen,
der Kontrast bleibt. Aus dem Canvas wird ein kühles Fast-Schwarz (`#121110`),
aus der Karte ein warmes Dunkelbraun (`#1f1c19`), und der schwarze
Ziffernkasten wird cremefarben mit dunkler Ziffer — ein schwarzes Quadrat auf
dunkler Karte wäre schlicht nicht mehr da.

`--chip` bleibt auch dunkel weiß. Siehe oben: die Fotos darin haben weißen Grund.

---

## 5. Typografie

### Die Schriften

**Playfair Display** (`--font-display`) für Titel und Abschnittsüberschriften.
Eine Serife mit starkem Strichkontrast — das Elegante des Entwurfs steckt genau
darin. Geladen: 400, 600, 700 und kursiv.

**Poppins** (`--font-sans-ui`) für alles andere. Geometrisch, kreisrund; im
Entwurf deutlich zu erkennen. Geladen: 400, 500.

Beide über `next/font/google`, also zur Bauzeit heruntergeladen und von der
eigenen Domain geliefert: kein Aufruf zu Google zur Laufzeit, datenschutzseitig
die einzige saubere Variante. Systemschriften sind ausgeschlossen — mit San
Francisco sieht der Screen schlicht anders aus als das JPEG.

> **Zur Abweichung vom Master-Prompt:** Der Prompt schlägt *DM Serif Display +
> Inter* vor und erlaubt ausdrücklich eine andere Google-Schrift, wenn sie nach
> visueller Prüfung näher liegt. Playfair und DM Serif sind beide Didone-nah;
> Playfair hat den kräftigeren Strichkontrast und den schmaleren Lauf, was den
> zweizeiligen Titeln der Referenz näher kommt. Poppins statt Inter, weil die
> Referenz eine geometrische Grotesk mit kreisrundem `o` zeigt, keine
> neo-groteske. Beide sind Google-Schriften; die Regel „nur Google Fonts, keine
> Systemschrift" ist eingehalten. Wer den Gegenversuch machen will, prüft
> DM Serif Display gegen den Rezepttitel und Inter gegen die Zutatennamen —
> und entscheidet am Screenshot, nicht am Namen.

### Skala

Ergebnis der Umrechnung aus Abschnitt 2. Verbindlich.

| Rolle | Schrift | Größe / Zeile | Schnitt |
|---|---|---|---|
| Rezepttitel auf dem Foto | Display | 32 / 1,15 | 400 |
| Screen-Überschrift | Display | 32 / 1,2 | 400 |
| Abschnitt („Zutaten", „Zubereitung") | Display | 19 / 1,25 | 600 |
| Gruppentitel im Einkauf | Display | 19 / 1,25 | 600 |
| Fließtext, Zubereitungsschritte | Sans | 15 / 1,55 | 400 |
| Formularfeld-Inhalt | Sans | 16 / 1,4 | 400 |
| Zutatenname unter dem Kreis | Sans | 13 / 1,2 | 500 |
| Nebentext, Feldbeschriftung | Sans | 13 / 1,45 | 400–500 |
| Tab-Beschriftung | Sans | 11 / 1,1 | 500 |
| Schritt-Ziffer im Kasten | Display **kursiv** | 13 | 400 |

Der Rezepttitel steht im **regulären** Schnitt, nicht im fetten. Bei dieser
Größe trägt der Strichkontrast allein; 600 wirkt daneben plump. Die kleinen
Abschnittsüberschriften brauchen umgekehrt 600, sonst verschwinden sie.

Der Titel bleibt bei 32 px, obwohl die reine Umrechnung 38–44 ergäbe: die
Referenz zeigt kurze englische Titel, Emil zeigt „Kürbiscremesuppe mit
Ingwer" — deutsche Komposita brauchen den Platz, den die größere Schrift
fräße. Zwei Zeilen sind vorgesehen und erwünscht.

Kein Versalsatz mit weitem Sperrsatz (`uppercase tracking-wide`) für
Überschriften. Das ist ein SaaS-Muster; der Entwurf setzt Überschriften in der
Serife und gemischt.

---

## 6. Maß, Radius, Schatten

**Abstände** auf 4er-Raster: 4, 8, 12, 16, 20, 24, 32. Im Zweifel den größeren
Wert — die Referenz lebt vom Weißraum.

- Karteninnenabstand: 20 px
- Screen-Seitenrand: 16 px, über `px-safe` zusammen mit der Safe Area
- Abstand zwischen Karten: 24 px
- Inhaltsbreite: `max-w-md` (448 px), zentriert

**Radien**

| Token | Wert | Wofür |
|---|---|---|
| `--radius-card` | 28 px | Karten, Fotos, Hero |
| `--radius-soft` | 11 px | Felder, kleine Knöpfe, Meldungen |
| `--radius-pill` | 999 px | Kreise, Zutatenkreise, Stepper, Suchfeld, Absenden-Knöpfe |
| — | 6 px | Ziffernkasten (einziger Sonderwert, in der Komponente) |

28 px an einer 34 px hohen Fläche ergibt optisch eine Pille — kleine Elemente
bekommen deshalb `--radius-soft`.

**Schatten**

```
--shadow-card:  0 8px 30px rgba(0,0,0,.06)   /* Karte löst sich vom Canvas */
--shadow-float: 0 2px 10px rgba(0,0,0,.12)   /* nur schwebende Elemente */
```

Kein harter Schlagschatten. Karten haben **keine** Umrandung — sie lösen sich
allein über den Schatten. Eine Linie darum herum ist das Material-Kärtchen, das
der Entwurf vermeidet.

**Trefferflächen** 44 × 44 px, auch wenn die sichtbare Fläche kleiner ist. Ein
32-px-Kreis bekommt seine Trefferfläche über Padding oder ein Pseudoelement,
nicht über mehr Durchmesser. Sichtbare Größe und Trefferfläche sind zwei
verschiedene Maße.

---

## 7. Bausteine

### Screen / Card / ScreenHeader
`src/components/ui.tsx`. `Screen` ist der statische Rahmen (Spalte,
Daumenbreite, Safe Areas) und steht in der App Shell, bevor Daten da sind.
`Card` ist die warme Fläche: `rounded-card bg-surface shadow-card`, ohne
Umrandung, 20 px innen.

### RecipeHero
Das Foto füllt die Kartenbreite, sitzt oben, hat oben dieselbe Rundung wie die
Karte und nimmt **42–46 % der Kartenhöhe** ein. `object-fit: cover`, kein
Rahmen. Darunter liegt `--photo`, damit nichts springt, solange die signierte
Bildadresse noch unterwegs ist — und damit ein Rezept ohne Foto denselben
Auftritt hat.

Auf dem Foto, unten links (20 px von links, 20 px vom Fotorand): der
Rezepttitel, weiß, Display 32/1,15, bis zu zwei Zeilen. Darunter ein
Scrim-Verlauf von `transparent` nach `--scrim`, sonst ist der Titel auf einem
hellen Foto weg.

**Auf dem Foto steht nur der Titel.** Die Kochzeit stand hier zwischendurch als
zweite Zeile darunter; 13 px Weiß kommt auch über dem Scrim nicht auf die
4,5:1, die kleine Schrift braucht. Sie steht jetzt unten in der Karte bei den
Schlagwörtern, auf `--surface`. Die Referenz zeigt an dieser Stelle ebenfalls
nichts außer dem Titel.

Oben links und oben rechts je ein Kreis, 36 px sichtbar / 44 px Trefferfläche:
`rgba(255,255,255,.7)` mit `backdrop-filter: blur(8px)`. Das Symbol darin ist
**dunkel** (`--text`), nicht weiß: der Entwurf zeigt eine weiße Kontur, und auf
seinem mitteldunklen Foto geht das auf — auf 70 % Weiß über einem hellen
Rezeptfoto ist Weiß auf Weiß. Die Milchglasfläche des Entwurfs bleibt, der
Strich darauf dreht sich um. Fokusring auf dem Foto in Weiß
(`focus-on-photo`).

Links zurück (Chevron), rechts **der Weg zum Bearbeiten** (Stift-Kontur).
Im Entwurf sitzt dort ein Herz; Emil kennt keine Favoriten, und ein Herz ohne
Wirkung ist keine Option (Abschnitt 13). Der Platz leer zu lassen war die
Alternative — dann hätte das Rezept aber gar keinen Weg mehr zum Bearbeiten,
seit der Knopf dafür aus der Karte verschwunden ist. Der Stift bekommt exakt
dieselbe Behandlung wie der Chevron, damit oben eine Sprache gesprochen wird.
Kommen Favoriten, rückt der Stift und das Herz nimmt seinen Platz.

### RecipeBrowserCard
Die Rezeptübersicht ist ein Stapel derselben Karten, eine Spalte, 24 px
Abstand — keine Zeilenliste mit Miniaturbild. Was ein Rezept ausmacht, sieht
man am Essen, nicht an seinem Namen.

Aufbau wie die Rezeptkarte im Kleinen: Foto im selben Verhältnis, derselbe
Scrim, Titel weiß in Display 32/1,15 darauf, darunter auf `--surface` eine
Zeile in 13 px mit Portionen und Zeit. Liegt das Rezept auf der Einkaufsliste,
sitzt oben links dieselbe Milchglasfläche wie die Knöpfe auf dem Rezeptfoto,
mit dunkler Schrift: „Auf der Liste · 4".

Auf dem Canvas trägt `--border` nicht — der Ton liegt zu dicht am Canvas-Grau.
Flächen, die dort eine Kante brauchen (die Schlagwort-Chips, „Von Hand"),
bekommen sie über `--surface` plus `--shadow-card`, nicht über eine Haarlinie.

### IngredientRail
Waagerechte Reihe aus Zutatenkreisen unter der Überschrift „Zutaten". Kreis
72 px, `rounded-pill bg-chip`, darin das freigestellte Foto aus
`public/zutaten/<slug>.webp` (Zuordnung: `src/lib/core/ingredientImages.ts`),
darunter der Name in 13 px. Deutsche Zutatennamen sind oft ein einziges langes
Wort — die Beschriftung braucht `hyphens-auto` und zwei Zeilen Deckel, sonst
steht „Champignons" breiter da als sein Kreis und schiebt sich unter den
Nachbarn.

Der vierte Kreis ist angeschnitten — das ist keine Panne, sondern die
Einladung zu wischen. Waagerecht scrollbar ohne sichtbaren Balken, mit
`scroll-snap-type: x proximity` (Utility `ingredient-rail`), damit die Reihe
nicht zwischen zwei Kreisen stehen bleibt. Gibt es kein Foto, steht der
Anfangsbuchstabe in `--muted` — nie ein leerer Kasten.

Im Einkauf wird dieselbe Sprache als Raster gesetzt: drei Spalten,
`gap-x-3 gap-y-5`, quadratische Kacheln. Abgehakt wird das Bild blass
(`opacity-40`), das Häkchen darüber bleibt kräftig.

### ServingStepper
Steht **rechts neben der Überschrift „Zutaten"**, nicht als eigene Karte und
nicht als Formularzeile. Eine Pille in `--soft`, darin `−  2  +`. Die
Tippflächen sind 32 px sichtbar, 44 px Trefferfläche; die Ziffer ist
`tabular-nums`, damit beim Wechsel nichts wandert, und wechselt über
`count-swap` (150 ms). `aria-live="polite"` auf der Ziffer, beschriftete
Knöpfe („Eine Portion mehr").

Gerechnet wird bei jedem Tippen **aus der Basismenge**, nie aus dem zuletzt
angezeigten Wert — sonst kommt der Weg 4 → 6 → 4 nicht bei der Originalmenge
heraus (`src/lib/core/scale.ts`). Die Anzeige formatiert über
`src/lib/core/format.ts`: `1`, `1,5`, `250 g`, nie `2.000000`.

### ShoppingListAction
Die zweitwichtigste Aktion der App und trotzdem leise: kein bildschirmbreiter
Knopf, sondern eine schmale Fläche im Zutatenbereich. Höhe 36 px,
`rounded-soft`, `border-border`, transparent, 13 px in 500, davor ein dünnes
Plus.

Zustandswechsel ohne Ampelfarbe — `＋ Einkaufsliste` wird zu
`✓ Auf der Liste`, Hintergrund wechselt auf `--soft`, Schrift auf `--text`,
150 ms. Kein Grün.

**Ein dritter Zustand**, den der Master-Prompt nicht kennt: steht das Rezept
mit einer *anderen* Portionszahl auf der Liste, geht der Knopf wieder auf und
heißt „Liste aktualisieren". Ohne ihn sähe die Liste bestätigt aus, während sie
andere Mengen enthält als die, die gerade auf dem Schirm stehen. Der Zustand kommt sofort (`useOptimistic`) und fällt bei
einem Fehler von selbst zurück; kein „Einen Moment …".

Übernommen wird immer die **eingestellte** Portionszahl, nicht die
Grundmenge, und ein erneutes Auflegen korrigiert die Liste, statt zu
verdoppeln (`add_recipe_to_list` entfernt zuerst den eigenen früheren Anteil).

### RecipeSteps
Nummerierte Schritte. Die Ziffer steht in einem Quadrat, 24 × 24 px, 6 px
Radius, `bg-panel text-panel-text`, Ziffer in Display **kursiv** 13 px. Das ist
die einzige kräftige Fläche im Screen. Daneben der Text in 15/1,55, Abstand
zwischen den Schritten 16 px, Spalte hängend ausgerichtet.

### RowLink / TabBar
`RowLink`: mindestens 56 px hoch, Karte mit Chevron rechts, `press tap-target`.

`TabBar`: unten, `sticky`, `bg-surface/95` mit `backdrop-blur`, Haarlinie oben,
zwei Einträge (Einkauf, Rezepte). Aktiv trägt allein die Farbe — Symbol und
Wort werden zusammen `--text`, inaktiv `--muted`. Kein farbiger Punkt, kein
Hintergrund. Der angetippte Tab wird im selben Frame aktiv (`useOptimistic`),
und `data-pending` dimmt währenddessen nur den Inhalt darüber.

### Field / Select / Textarea / Button / Notice
Werkzeug-Register. Felder: 48 px hoch, `rounded-soft`, `bg-soft`,
Haarlinie, 16 px Schrift, Fokus über `border-text` statt farbigem Ring.
`Button`: 48 px, bildschirmbreit, `rounded-pill`; `primary` = `bg-brand`,
`quiet` = Haarlinie auf `--surface`, `danger` = Kontur in `--accent`.
**Nur auf Werkzeug-Screens.** `Notice` mit `role="alert"` bei Fehlern — ohne
die Ansage liest VoiceOver eine nach dem Absenden erscheinende Meldung nicht
vor.

---

## 8. Symbole

Eigene Inline-SVG, keine Bibliothek: Emil braucht eine Handvoll Symbole, und
ein Paket dafür wären ein paar hundert Kilobyte für ein paar Pfade. Gezeichnet
wird nach Lucides Regeln, damit sie zusammengehören:

- 24er-Raster, `viewBox="0 0 24 24"`
- Kontur, `stroke-width: 1.75`, runde Enden
- `currentColor`, nie feste Farbe
- keine gefüllten Symbole, keine zweite Zeichensprache, keine Emojis

**Eine Ausnahme:** die beiden Tab-Symbole sind gefüllt. iOS-Tab-Leisten setzen
gefüllte Glyphen, und eine Kontur in 11 px Umgebung wirkt daneben zerbrechlich.
Die Ausnahme gilt für die Tab-Leiste und sonst nirgends.

Bestand: `src/components/icons.tsx` — Chevron links, Stift, Plus, Minus,
Häkchen. Dazu die beiden gefüllten Tab-Glyphen (Korb, Buch) in
`src/app/(app)/TabBar.tsx` und der Chevron in `RowLink`.

Ein Herz gibt es bewusst noch nicht: es käme mit der Favoriten-Funktion, nicht
vorher.

---

## 9. Bewegung

Alles zwischen **120 und 250 ms**, `ease-out`. Kein Federn, kein Hüpfen, kein
Konfetti, keine elastischen Kurven.

| Utility | Verhalten |
|---|---|
| `press` | `opacity .7` + `scale(.98)`, beim Drücken **ohne** Übergang, beim Loslassen 120 ms |
| `press-flat` | wie oben ohne Skalierung — für Hälften einer zusammengesetzten Zeile |
| `count-swap` | Ziffernwechsel, 150 ms Einblendung |
| `dims-when-pending` | dimmt auf 0,5, solange ein Vorfahr `data-pending` trägt |

Der Aktiv-Zustand muss im selben Frame stehen wie der Finger. Ein Übergang
beim Drücken erzeugt genau die Trägheit, die hier weg soll.

**Platzhalter** pulsieren nicht. `placeholder-box` ist eine ruhige getönte
Fläche, die die ersten **320 ms unsichtbar** bleibt (`animation-fill-mode:
backwards`, kein JavaScript): Die meisten Ladevorgänge sind vorher vorbei, und
ein Platzhalter, der kurz aufblitzt, wirkt unruhiger als gar keiner. Der Platz
ist trotzdem ab der ersten Millisekunde reserviert — darum ging es.

`prefers-reduced-motion: reduce` schaltet `placeholder-box` und `count-swap`
ab. Jede neue Animation braucht denselben Ausstieg.

---

## 10. Zustände

Jedes bedienbare Element braucht alle sechs:

| Zustand | Umsetzung |
|---|---|
| Ruhe | siehe Baustein |
| Zeiger darüber | nur Desktop, minimal (Deckkraft), nie Farbwechsel |
| Gedrückt | `press` / `press-flat` |
| Fokus | `:focus-visible`, 2 px `--text`, 2 px Abstand, auf dem Foto weiß |
| Gesperrt | `opacity .5`, `cursor: not-allowed` |
| Gewählt | `aria-pressed` bzw. `aria-current`, optisch über `--brand` |

Der blaue Standardring des Browsers passt zu nichts hier — weglassen ist
trotzdem keine Option: Portionswahl und Einkaufsliste müssen mit der Tastatur
bedienbar bleiben. `:focus-visible` statt `:focus`, damit er beim Tippen mit
dem Daumen nicht erscheint.

---

## 11. Barrierefreiheit

- Semantisches HTML: `<ol>` für Schritte, `<ul>` für Zutaten, `<button>` für
  Aktionen, `<h1>/<h2>` in der richtigen Reihenfolge.
- Symbolknöpfe brauchen `aria-label` („Zurück", „Als Favorit merken").
- Der Portionswähler ist vollständig per Tastatur bedienbar, die Ziffer meldet
  sich über `aria-live="polite"`.
- Dekoratives Bild bekommt `alt=""` — der Rezepttitel steht daneben im Text.

**Offener Punkt, Kontrast.** Gemessen nach WCAG 2.1:

| Paar | Verhältnis | Urteil |
|---|---|---|
| `--text` `#242321` auf `--surface` | 13,98 : 1 | gut |
| `--muted` `#756d66` auf `--surface` | 4,52 : 1 | gut (war `#8a827b` mit 3,36 : 1) |
| `--muted` dunkel `#a29a92` auf `#1f1c19` | 6,12 : 1 | gut |

`--muted` ist im hellen Modus auf `#756d66` gezogen — 4,52 : 1 auf
`--surface`, optisch kaum dunkler, aber über der Grenze. Der dunkle Modus
bleibt.

**Achtung, das gilt nur auf `--surface`.** Auf dem Canvas (`#d7d5d6`) kommt
derselbe Ton nur auf 3,5 : 1. Text auf dem Canvas steht deshalb in `--text` —
leise wird er dort über Größe und Position, nicht über Blässe. Das betrifft in
der Praxis genau eine Stelle: „Rezept löschen" unter der Rezeptkarte.

---

## 12. Abweichungen vom Master-Prompt

Bewusst und begründet. Alles andere im Prompt gilt unverändert.

| Prompt | Emil | Grund |
|---|---|---|
| DM Serif Display + Inter | Playfair Display + Poppins | Vom Prompt erlaubt, wenn näher an der Referenz; Strichkontrast und geometrische Grotesk treffen das JPEG besser. Beides Google-Schriften. |
| Body 11–13 px, Kreise 52–58 px | 15 px, 72 px | Mockup-Maße, siehe Abschnitt 2. Auf dem Gerät unlesbar bzw. unter der Trefferflächengrenze. |
| Lucide-Bibliothek | eigene Inline-SVG nach Lucide-Regeln | Ein Paket für acht Pfade; die App wird über Mobilfunk im Supermarkt geladen. |
| „Recipe Card" mit 330–350 px Breite | Karte auf Canvas, `max-w-md` | In der Referenz ist die „Karte" der Handyrahmen. Auf dem Gerät ist der Screen die Fläche; die Kartensprache bleibt über `--surface` auf `--bg` erhalten. |
| keine großen Primärknöpfe | gilt redaktionell, nicht im Werkzeug-Register | Abschnitt 3. Ein Login ohne eindeutigen Absenden-Knopf ist kein gutes Design, sondern ein Rätsel. |
| Hell-Modus | Hell **und** Dunkel | Gekocht wird abends; eine cremefarbene Fläche blendet im Halbdunkel. |
| keine Akzentfarbe | `--accent` nur als Warnton | Löschen und Fehler brauchen ein Signal. Als Markenfarbe wäre es der Bruch. |

---

## 13. Was noch nicht dem System entspricht

Stand 18.09.2026 — Arbeitsliste, keine Beschreibung des Ist-Zustands.

Die Punkte 1 bis 6 der vorigen Fassung sind umgesetzt: Hero mit Titel auf dem
Foto, Zutatenkreise auf der Rezeptseite, Portionswähler als Pille neben
„Zutaten", leise Einkaufslisten-Fläche, Ziffernkästen, `--muted` korrigiert.
Offen bleibt:

1. **Es gibt keine Favoriten.** Im Entwurf sitzt oben rechts ein Herz; in Emil
   sitzt dort vorläufig der Stift zum Bearbeiten (Abschnitt 7). Kommt die
   Funktion, braucht sie eine Spalte in `recipes`, einen Weg in
   `src/lib/data/recipes.ts` und einen Filter in der Übersicht — dann rückt der
   Stift und das Herz nimmt seinen Platz.
2. **Die Zutatenfotos decken die Zutaten nur teilweise ab.** 109 Rohbilder
   liegen in `scripts/ingredient-images/raw/`, die Stammdatenliste kennt aber
   rund 350 Zutaten; für den Rest steht der Anfangsbuchstabe im Kreis. Eine
   Reihe aus vier Buchstaben ist deutlich schwächer als eine aus vier Fotos —
   `scripts/ingredient-images/generate.py` füllt nach.
3. **`--accent` ist im dunklen Modus ungeprüft.** `#e8735a` auf `#1f1c19`
   müsste gemessen werden, bevor Fehlermeldungen darauf verlassen werden.

---

## 14. Prüfliste

**Optisch** — im direkten Vergleich mit `app_design.jpg`:

- [ ] Verhältnis Foto zu Inhalt 42–46 %
- [ ] Titel weiß, Serife, regulär, zwei Zeilen möglich, auf dem Foto
- [ ] Karte ohne Umrandung, Schatten weich, Radius 28
- [ ] Canvas grau, Karte warm — nicht umgekehrt
- [ ] Zutatenkreise weiß, vierter angeschnitten
- [ ] Ziffernkasten schwarz, kursive Ziffer
- [ ] keine Farbfläche außer dem Ziffernkasten
- [ ] Weißraum eher zu viel als zu wenig

**Funktional:**

- [ ] Portionen ändern rechnet aus der Basismenge
- [ ] Mengen formatieren sauber (`1,5`, `250 g`, nie `2.000000`)
- [ ] Auf die Liste geht mit der **eingestellten** Portionszahl
- [ ] erneutes Auflegen korrigiert, statt zu verdoppeln
- [ ] gleiche Zutat wird zusammengeführt, wenn die Einheit passt
- [ ] alles per Tastatur bedienbar, Fokus sichtbar
- [ ] dunkler Modus geprüft (Medienabfrage umdrehen, nicht CSS-Variablen von
      Hand setzen — `body { color }` löst am `:root` auf und folgt einer
      Inline-Überschreibung nicht)
- [ ] `prefers-reduced-motion` geprüft

**Qualität:** Sieht ein Element nach Bootstrap, Material, Tailwind-Vorgabe,
SaaS-Dashboard oder unverändertem Browser-Steuerelement aus — überarbeiten.
