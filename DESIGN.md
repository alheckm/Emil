---
name: Emil
description: Deutschsprachige Haushalts-PWA für Rezepte und Einkaufsliste — editoriale, versale Kälte statt App-Defaults.
colors:
  bg: "#fef5f9"
  card: "#fef5f9"
  soft: "#f3efec"
  border: "#e4d9d3"
  text: "#222a36"
  accent: "#222a36"
  accent-ink: "#fef5f9"
  muted: "#b99c8e"
  danger: "#a2283a"
  danger-tint: "#f5dee1"
  ok: "#3f5d42"
  warn: "#8a5a2b"
typography:
  display:
    fontFamily: "Hanken Grotesk, -apple-system, BlinkMacSystemFont, system-ui, sans-serif"
    fontSize: "56px"
    fontWeight: 900
    lineHeight: 1.02
    letterSpacing: "-0.01em"
    fontFeature: "uppercase"
  hero:
    fontFamily: "Hanken Grotesk, -apple-system, BlinkMacSystemFont, system-ui, sans-serif"
    fontSize: "44px"
    fontWeight: 900
    lineHeight: 1.02
    letterSpacing: "-0.01em"
    fontFeature: "uppercase"
  title:
    fontFamily: "Hanken Grotesk, -apple-system, BlinkMacSystemFont, system-ui, sans-serif"
    fontSize: "28px"
    fontWeight: 800
    lineHeight: 1.05
    letterSpacing: "-0.005em"
    fontFeature: "uppercase"
  section-label:
    fontFamily: "Hanken Grotesk, -apple-system, BlinkMacSystemFont, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 800
    letterSpacing: "0.12em"
    fontFeature: "uppercase"
  body:
    fontFamily: "Hanken Grotesk, -apple-system, BlinkMacSystemFont, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.55
  caption-amount:
    fontFamily: "Hanken Grotesk, -apple-system, BlinkMacSystemFont, system-ui, sans-serif"
    fontSize: "12.5px"
    fontWeight: 800
    letterSpacing: "0.02em"
    fontFeature: "uppercase, tabular-nums"
  button-label:
    fontFamily: "Hanken Grotesk, -apple-system, BlinkMacSystemFont, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 800
    letterSpacing: "0.1em"
    fontFeature: "uppercase"
  nav-label:
    fontFamily: "Hanken Grotesk, -apple-system, BlinkMacSystemFont, system-ui, sans-serif"
    fontSize: "10.5px"
    fontWeight: 700
    letterSpacing: "0.08em"
    fontFeature: "uppercase"
rounded:
  none: "0px"
  full: "9999px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-ink}"
    rounded: "{rounded.none}"
    height: "52px"
    padding: "0 24px"
    typography: "{typography.button-label}"
  button-primary-disabled:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-ink}"
    rounded: "{rounded.none}"
    height: "52px"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.text}"
    rounded: "{rounded.none}"
    height: "52px"
    padding: "0 24px"
    typography: "{typography.button-label}"
  button-danger:
    backgroundColor: "transparent"
    textColor: "{colors.danger}"
    rounded: "{rounded.none}"
    height: "52px"
    padding: "0 24px"
    typography: "{typography.button-label}"
  field:
    backgroundColor: "transparent"
    textColor: "{colors.text}"
    rounded: "{rounded.none}"
    height: "44px"
    typography: "{typography.body}"
  tile:
    backgroundColor: "{colors.soft}"
    rounded: "{rounded.none}"
    padding: "{spacing.sm}"
---

# Design System: Emil

## Overview

**Creative North Star: "Das Atelierprotokoll" — das Protokollbuch eines
Grafikbüros, nicht die Speisekarte eines Restaurants.**

Emil dokumentiert Rezepte mit derselben Kälte, mit der ein Studio sein eigenes
Corporate-Manual führt: eine Schrift, ein Gewicht als Hierarchie-Werkzeug
(Größe und Fettung statt Farbe oder Zierrat), null Radius als bewusste
Abgrenzung von generischen `rounded-lg`-SaaS-Defaults, Haarlinie statt
Schatten. Das ist eine im September 2026 vollzogene, nutzerbestätigte
Abkehr von einer früheren „Fliederblau/Karten"-Richtung — Gold-Akzent,
Kartenschatten und bildschirmbreite Pillen-Buttons sind aus dem Code vollständig
entfernt, nicht nur umbenannt. Referenzwelt ist https://maisonauge.com/, eine
Branding-Agentur-Seite, keine App; Farbwerte sind 1:1 aus deren computed style
übernommen.

Die App bleibt trotz der redaktionellen Härte kein reiner Textkatalog: Fotos
(Rezept-Hero, Rezeptliste, Einkaufs-Kacheln) bleiben — eine bewusste,
nutzerbestätigte Entscheidung gegen die reine Text-Behandlung der
Referenz-Mockups. Ein Foto trägt dafür nie einen Rahmen; seine eigene Kante
ist die einzige Grenze.

Bestätigte Ablehnungen: keine Schlagschatten, keine Pillen-Buttons, keine
umrahmten/gefüllten Eingabefelder, keine gefüllten Notice-Banner, kein
warmer/goldener Akzent (`--accent` fällt jetzt bewusst mit der Textfarbe
zusammen — Navy, keine eigene Markenfarbe), kein Dark Mode.

**Key Characteristics:**
- Versal-Typografie (Großbuchstaben, getrackt) als primäres Hierarchie-Mittel; Fließtext ist die einzige bewusste Ausnahme und bleibt normal-case.
- Radius 0 überall im eigenen Formvokabular; die einzigen Kreise im System sind zwei native Browser-Artefakte (Slider-Thumb, Fokusring) plus drei bewusst gerundete Ausnahmen (Foto-Kachel, Tab-Punkt, Lade-Spinner) — siehe Shapes.
- Tiefe ausschließlich über `--border`-Haarlinien und Weißraum, nie über Schatten (`--shadow-card: none`).
- `--bg` und `--card` sind identisch (#FEF5F9) — Flächen trennen sich nie über einen Farbsprung, nur über die Haarlinie.
- `--accent` ist die Textfarbe selbst (Navy #222A36) — CTAs sind Tinten-Flächen, kein separater Markenton.

## Colors

Eine kühle, blasse Rosé-Fläche trägt die ganze App; Abgrenzung kommt von Linie und Gewicht, nie von Farbkontrast zwischen Flächen.

### Primary
- **Tinte / Navy** (`#222a36`, Token `accent`/`text`): Fließtext, alle Überschriften, gefüllte Primär-Buttons (als Fläche), Konturen von Sekundär-Buttons und Feldern. `--accent` und `--text` sind derselbe Wert — es gibt keine separate Markenfarbe, CTAs sind einfach tintenfarbige Flächen.

### Neutral
- **Blush-Weiß** (`#fef5f9`, Token `bg`/`card`): Grundfläche der gesamten App. `--card` ist identisch mit `--bg` — es gibt keine „Karten"-Fläche mehr im ursprünglichen Sinn; ein Rezept-Screen, die Einkaufsliste und Formulare laufen alle auf derselben Fläche.
- **Getöntes Beige** (`#f3efec`, Token `soft`): Fläche für Bedienelemente, die auf `--bg` eine eigene Fläche brauchen — Kachel-Füllung in der Einkaufsliste, Zeilenhintergrund von `RowLink`, inaktive Filter-Pille.
- **Haarlinien-Braun** (`#e4d9d3`, Token `border`): jede Trennlinie — zwischen Zutaten-Zeilen, unter der Tab-Leiste, um Sheets, um die Tab-Buttons im Import-Screen.
- **Gebranntes Rosébeige** (`#b99c8e`, Token `muted`): Bildunterschriften, Sekundärmengen, inaktive Tab-Labels, Hinweistexte, Feldlabels, Screen-Lead-Texte. **Akzeptierter Kontrast-Kompromiss:** `--muted` auf `--bg` misst rund 2,4:1 — unter WCAG AA (4,5:1) für die Textgrößen, in denen es durchgängig läuft (10 px Feldlabel, 10,5 px inaktiver Tab, 12 px Abschnittsüberschrift, 12,5 px Menge, 13 px Hinweis, sogar der 15 px `ScreenHeader`-Lead). Dem Nutzer wurde die Abweichung explizit vorgelegt; er hat den Mockup-Wert bewusst über die Kontrastkorrektur gestellt. Der Wert bleibt unverändert — dies ist eine bestätigte Entscheidung, kein übersehener Fehler, und keine Lizenz, `--muted` auf neue Textrollen auszuweiten.

### Named Rules
**Die Flächen-Gleichheit-Regel.** `--bg` und `--card` sind derselbe Wert. Kein Screen zeichnet eine Karte, indem er einen Farbsprung zur Umgebung erzeugt — Abgrenzung ist immer eine Haarlinie, nie ein Flächenwechsel.

**Die Ein-Ton-Regel.** `--accent` erscheint nur als gefüllte Fläche (Primär-Button, Ziffernkasten der Zubereitung) oder als Kontur/Text auf `--bg`/`--soft`, nie als dünne Linie und nie als reiner Fließtext direkt auf `--bg` — der Kontrast trägt das nicht.

## Typography

**Display/Body/Label-Font:** Hanken Grotesk (Variable Font, `next/font/google`, kein Kursivschnitt), mit `-apple-system, BlinkMacSystemFont, system-ui, sans-serif` als Fallback.

**Character:** Eine einzige Familie für alles — Hierarchie entsteht ausschließlich über Gewicht, Größe und Tracking, nie über einen Schriftwechsel. Kantige, hochgezogene x-Höhe; in schwerem Schnitt bei großer Displaygröße gewählt, weil sie dort nicht ausfranst (freier Ersatz für die kostenpflichtige Referenzschrift PP Neue Montreal Bold).

### Hierarchy
- **Display** (900, 56px, 1.02, uppercase, -0.01em): Riesenversalie der vier Root-Tab-Screens (Rezeptübersicht, Einkaufsliste, Todo, Einstellungen).
- **Hero** (900, 44px, 1.02, uppercase, -0.01em): eigene, dritte Größe ausschließlich für den Rezept-Detail-Titel — bewusst zwischen Display und Title, kein Fehlwert.
- **Title** (800, 28px, 1.05, uppercase, -0.005em): Formulare, Detail- und Unterseiten-Header.
- **Section-Label** (800, 12px, 0.12em, uppercase, Farbe `muted`): wiederkehrende Abschnittsüberschrift innerhalb eines Screens — „ZUTATEN", „ZUBEREITUNG", „NÄHRWERTE", „PORTIONEN". Ist die `<h2>` des Abschnitts selbst, keine Bildunterschrift oder ein Zierelement oberhalb eines eigenen Titels.
- **Body** (400, 15–16px, 1.55): einzige durchgehend normal-case gesetzte Textrolle — Fließtext, Notices, Zubereitungsschritte. 16px ist der Boden für Eingabefeld-Text (iOS-Zoom-Schutz), 15px für sonstigen Fließtext.
- **Caption/Amount** (700–800, 11–12.5px, tracked, uppercase, tabular-nums): Mengenangaben, sekundäre Zahlen.
- **Button-Label** (800, 13px, 0.1em, uppercase): Button-Beschriftung.
- **Navigation** (700 inaktiv / 900 aktiv, 10.5px, 0.08em, uppercase): Tab-Leisten-Labels.

### Named Rules
**Die Versal-Regel.** Jede Überschrift und jedes Label ist uppercase mit positivem Tracking. Fließtext ist die einzige Ausnahme — er bleibt immer normal-case; keine Stelle darf Fließtext nachträglich in Versalien setzen.
**Die Ein-Familie-Regel.** Hierarchie kommt aus Gewicht und Größe derselben Schrift, nie aus einem Schriftwechsel oder Kursivschnitt (die Variable Font liefert bewusst keine Kursive).

## Layout

Eine Spalte, Daumenbreite (`max-w-md`, ~448px), zentriert, für iPhone-Viewports (~375–430px) gebaut, kein breiteres Layout vorgesehen. Standard-Screens (`Screen`-Komponente) tragen 32px vertikalen Rhythmus zwischen Abschnitten (`space-y-8`) und 24px innerhalb eines Abschnitts (`space-y-6`); Safe-Area-Utilities (`pt-safe`/`pb-safe`/`px-safe`) übernehmen Notch und Home-Indikator im installierten PWA-Modus. Ein `bleed`-Modus nimmt Rand und Kopfabstand für den einen Screen, dessen Foto randlos unter die Statusleiste läuft. Die Einkaufslisten-Kacheln laufen als 3-Spalten-Raster (`grid-cols-3`, 8px horizontaler / 12px vertikaler Abstand).

## Elevation & Depth

Kein Schattenvokabular — `--shadow-card` ist explizit `none`. Tiefe/Trennung entsteht ausschließlich über `--border`-Haarlinien (1–2px, `#e4d9d3`) und Weißraum. Das Bottom-Sheet (Einkaufslisten-Detail) markiert seine obere Kante mit einer Haarlinie statt eines Schlagschattens; dasselbe gilt für die bildschirmbreite Tab-Leiste (Haarlinie oben statt freistehender Pille mit Schatten).

### Named Rules
**Die Flach-Regel.** Kein Element im eigenen Formvokabular erzeugt Tiefe über `box-shadow`. Wo eine Fläche sich von ihrer Umgebung absetzen muss, tut sie das über eine Haarlinie oder eine Tonwertänderung (`--soft` auf `--bg`), nie über Schatten.

## Shapes

Radius 0 ist das Signature-Element dieser Richtung — Buttons, Felder, Kacheln, Sheets, Chips, der Ziffernkasten der Zubereitung: alles rechteckig. Drei echte Ausnahmen, alle vollständig zutreffend:

1. **Foto-Kreis** (`rounded-full`, Tailwind): das Zutatenfoto in jeder Einkaufslisten-Kachel sitzt in einem echten Kreis — der einzige Ort, an dem ein Kreis Teil der eigenen Bildsprache ist, unabhängig von den auf 0 gesetzten Radius-Tokens.
2. **Tab-Punkt** (`rounded-full`, 4px): der aktive Marker über dem Tab-Label in der unteren Navigationsleiste.
3. **Lade-Spinner** (`rounded-full`): der rotierende Ring im `loading`-Zustand des Buttons.

Dazu zwei native Browser-Formen, die selbst nicht Teil der eigenen Formsprache sind: der Fokusring (`border-radius: var(--radius-soft)`, also 0) und der Slider-Thumb des Zuschnitt-Zoomreglers (`border-radius: var(--radius-pill)`, ebenfalls auf 0 gesetzt — trotz des Tokennamens „pill" zeichnet er in dieser Richtung kein Rundstück, sondern ein Quadrat).

Der Import-Screen zeichnet seinen Web/Einfügen-Umschalter **nicht** als natives System-Control — der Code (`ImportPanel.tsx`) baut ihn selbst als zwei nebeneinanderliegende `role="tab"`-Buttons mit Rahmen, radiuslos, aktiv gefüllt in `--text`. Es existiert im gebauten Code keine Stelle, an der eine echte native iOS-Segmented-Control mit ihrem System-Radius (8px) verwendet wird — das ist eine web-typisierte Nachbildung, kein System-Control-Verzicht auf Neuzeichnung. Der Radius-0-Anspruch gilt hier also ohne Ausnahme.

## Components

### Buttons
- **Shape:** rechteckig, Radius 0, 52px Höhe (Primär/Sekundär/Danger).
- **Primär:** Fläche `--accent` (Navy), Text `--accent-ink` (Blush), Innenabstand 0 24px, Label-Skala. Faustregel im gebauten Code: höchstens ein Primär-Button pro Screen.
- **Sekundär:** 2px Kontur `--text`, transparente Fläche, 8%-Navy-Tönung (`bg-text/8`) im gedrückten Zustand.
- **Danger:** 2px Kontur `--danger`, transparente Fläche, `--danger-tint`-Fläche gedrückt — nie gefüllt im Ruhezustand.
- **Tertiär:** reiner Text, kein Rahmen, mit angehängtem „→"-Textzeichen (kein SVG), für leichte Aktionen wie „Rezept importieren →".
- **Zustände:** disabled = 30% Deckkraft; loading = zusätzlicher rotierender Ring (`rounded-full`, `border-current`) vor dem Label.

### Chips
- **Style:** Filter-Pillen in `RecipeBrowser` — trotz Bezeichnung „Pille" im Code-Kommentar radiuslos wie alles andere; inaktiv `--soft`-Fläche, aktiv `--text`-Fläche mit `--card`-Text.

### Cards / Containers
- **Corner Style:** Radius 0.
- **Background:** `--bg`/`--card` (identisch) für Screens; `--soft` für Bedienflächen, die eine eigene Fläche brauchen (Kacheln, `RowLink`-Zeilen).
- **Shadow Strategy:** keine — siehe Elevation & Depth.
- **Border:** nur wo eine Zeile/Fläche sich abgrenzen muss (Haarlinie `--border`); Fotos selbst tragen **nie** einen Rahmen.
- **Internal Padding:** Screen-Rahmen 20px (`px-5`) horizontal, Abschnittsabstand 24–32px vertikal.

### Inputs / Fields
- **Style:** kein Kasten — 2px Unterstrich in `--text`, Label darüber in der Section-Label-Skala (10px, extrabold, getrackt), 16px Eingabetext (bewusst über einer im Mockup gezeigten 13px gehalten — harter Produktboden gegen iOS-Auto-Zoom, keine Stilfrage).
- **Focus:** Unterstrich verdickt sich auf 3px.
- **Error/Disabled:** Fehler laufen über `Notice tone="error"`, nicht über eine Feldfarbe; kein eigener Disabled-Stil für Felder im gescannten Code.

### Navigation
- Bildschirmbreite Leiste am unteren Rand, Haarlinie oben (`--border`) statt freistehender Pille mit Schatten. Jeder Eintrag zeigt **nur seinen Namen, kein Symbol** — die eine bewusste Stelle, an der die Richtung Icons verweigert, in Übereinstimmung mit der Referenzseite selbst. Aktiver Eintrag: Gewicht 900 statt 700, plus 4px-Punkt (`rounded-full`) darüber; Spaltenbreite bleibt bei jedem Zustand gleich, damit nichts seitlich springt.

### Zubereitung — nummerierter Schritt (signature component)
Jeder Zubereitungsschritt trägt links ein 24×24px-Quadrat (`size-6`, Radius 0 über `rounded-soft`), gefüllt in `--accent`, mit der Schrittziffer in `--accent-ink`, 13px/700, `font-display`. Ersetzt einen früheren schwarzen Ziffernkasten aus der Vorgängerrichtung — heute bewusst in der Markenfarbe.

## Do's and Don'ts

### Do:
- **Do** Radius 0 für jedes selbst gezeichnete Element verwenden; ein Kreis ist nur für Fotokacheln, den aktiven Tab-Punkt und den Lade-Spinner erlaubt.
- **Do** Trennung über `--border`-Haarlinien und Weißraum lösen, nie über Schatten.
- **Do** `--accent` nur als gefüllte Fläche oder als Kontur einsetzen, nie als dünne Linie oder Fließtext direkt auf `--bg`.
- **Do** Eingabefeld-Text bei mindestens 16px halten, unabhängig davon, was eine Vorlage zeigt.
- **Do** Inline-SVG-Icons (Kontur, 1,75px Strichstärke, `currentColor`, `aria-hidden`, aus `src/components/icons.tsx`) für alle neuen navigierenden/aktionsbezogenen Symbole verwenden, wie es `ChevronRightIcon`, `CloseIcon`, `CheckIcon`, `PlusIcon` bereits tun.

### Don't:
- **Don't** eine Karten-Fläche mit Farbwechsel gegenüber `--bg` erzeugen — `--card` und `--bg` sind derselbe Wert, Trennung läuft über die Haarlinie.
- **Don't** einen Schlagschatten, eine Pillen-Form für Buttons, ein umrahmtes/gefülltes Eingabefeld oder eine gefüllte Notice-Fläche einführen — alle vier sind bestätigt abgelehnte Muster der Vorgängerrichtung.
- **Don't** einen goldenen oder warmen Markenakzent verwenden — `--accent` ist Navy, identisch mit `--text`.
- **Don't** einem Foto oder seiner Fläche einen Rahmen geben — die Fotokante ist die einzige Grenze.
- **Don't** `--muted` (2,4:1-Kontrast) auf weitere Textrollen ausdehnen, um es als allgemein einsetzbaren Grauton zu legitimieren — der Wert bleibt ein bestätigter, aber begrenzter Kompromiss an genau den Stellen, wo er heute steht.
