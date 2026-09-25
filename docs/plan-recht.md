# Plan: emil rechtssicher öffentlich betreiben (Abmahn-Schutz)

> Stand 2026-09-25. **Keine Rechtsberatung.** Das ist eine sorgfältige Prüfung mit
> konservativen Annahmen. Die finalen Texte (Impressum, Datenschutz,
> Nutzungsbedingungen) vor dem öffentlichen Start einmal von einer Anwältin/einem
> Anwalt oder mit einem Generator (z. B. e-recht24, Dr. Schwenke) gegenprüfen.
> Nach Freigabe diesen Plan nach `docs/plan-recht.md` kopieren.

## Kontext

emil wird **öffentlich** angeboten: jeder kann sich registrieren, der App Store
ist geplant. Damit reicht die Ausnahme „privat“ nicht mehr.

Das größte Abmahnrisiko ist nicht, was fehlt, sondern was die
Datenschutzerklärung **falsch behauptet**. Sie sagt „keine Analyse-, Tracking-
oder Werbedienste … keine Weitergabe an Dritte“. Tatsächlich laufen Vercel Speed
Insights, Vercel-Funktionen vermutlich in den USA und ein KI-Lauf über
Anthropic/Google.

Entscheidungen des Nutzers:
- öffentlich, jeder kann sich registrieren
- Rezept-Pflege nur für den eigenen Haushalt, Bilder per mflux statt Gemini

## Befund

| # | Thema | Status | Risiko |
|---|---|---|---|
| 1 | **Google Fonts** | ✅ ok: `next/font/google` (`src/app/layout.tsx:2`) lädt beim Build und liefert von der eigenen Domain. Kein Treffer auf `fonts.googleapis`/`gstatic` in `src` oder `.next/static`. Die Abmahnwelle (LG München I, 20.01.2022, 3 O 17493/20) betraf die dynamische Einbindung mit IP-Übertragung an Google zur Laufzeit. | nur am Live-Deploy noch bestätigen |
| 2 | **Vercel Speed Insights** (`layout.tsx:4, :87`) | ❌ widerspricht der Datenschutzerklärung. Liest Gerätedaten für einen nicht unbedingt nötigen Zweck, also §25 TDDDG (Einwilligung nötig). | hoch |
| 3 | **Impressum** (§5 DDG) | ❌ fehlt ganz | hoch (klassischer Abmahngrund, §3a UWG) |
| 4 | **Datenschutzerklärung** (Art. 13 DSGVO) | ⚠️ Platzhalter `[Name]…`. Es fehlen Rechtsgrundlagen, Speicherdauern, Betroffenenrechte, Beschwerderecht, Drittlandtransfer, Server-Logs/IP, Auth-Mails, Realtime-Verbindung zu supabase.co. „Privat, nicht kommerziell“ stimmt so nicht mehr. | hoch |
| 5 | **Vercel-Region** | ⚠️ kein `vercel.json`/`preferredRegion`, also Standard `iad1` (USA): Server-Renders mit Personendaten laufen in den USA | mittel |
| 6 | **Rezept-Pflege-KI** | ❌ `scripts/rezept-pflege/pflege.mjs:201` liest `recipes` aller Haushalte und gibt sie an Claude. `lauf.sh:24` erlaubt `gemini-image` (Google). Das ist eine undokumentierte Weitergabe. | hoch |
| 7 | **Datenschutz-Link bei Registrierung** | ❌ nur auf `/anmelden` und in Einstellungen, nicht auf `/registrieren` (dem Ort der Erhebung) | mittel |
| 8 | **Nutzungsbedingungen / DSA** | ❌ fehlen. emil speichert Nutzerinhalte (Hosting-Dienst): Kontaktstelle (Art. 11/12 DSA) und Meldeweg für rechtswidrige Inhalte (Art. 16) | niedrig–mittel |
| 9 | **AV-Verträge** (Art. 28) | ? mit Supabase und Vercel prüfen/akzeptieren | intern |
| 10 | **Mindestalter** | fehlt. Einwilligungsalter Art. 8 DSGVO in DE: 16 | niedrig |

**Nicht nötig** (damit du dir darüber keine Sorgen machst):
- **Cookie-Banner:** entfällt, sobald Speed Insights weg ist. Auth-Cookie, Service Worker und IndexedDB-Offline-Spiegel sind „unbedingt erforderlich“ (§25 Abs. 2 Nr. 2 TDDDG).
- **BFSG:** kein E-Commerce, Kleinstunternehmen.
- **DSA-Transparenzberichte:** Kleinstunternehmen sind ausgenommen.
- **`wa.me`-Teilen-Link:** reiner Klick-Link, keine Einbindung.
- **Importierte Rezeptbilder:** `imageUrl` wird extrahiert, aber nie gespeichert oder angezeigt, also kein Bild-Urheberrecht. Rezepttexte: Import auf ausdrücklichen Wunsch des Nutzers für den eigenen Haushalt. Die Nutzungsbedingungen legen die Verantwortung für Inhalte beim Nutzer fest.

## Umsetzung

### 1. Speed Insights entfernen
- `src/app/layout.tsx`: Import und `<SpeedInsights />` streichen.
- `package.json`: `@vercel/speed-insights` deinstallieren.
- Im Vercel-Dashboard Speed Insights deaktivieren.

### 2. Vercel-Region auf Frankfurt
- Tatsächliche Region prüfen (`mcp__vercel__get_project`, read-only).
- `vercel.json` mit `{"regions": ["fra1"]}` anlegen. Vorher in `node_modules/next/dist/docs/` gegenprüfen, ob Next 16 dafür lieber Segment-Config vorsieht.

### 3. Impressum `/impressum` (neu: `src/app/impressum/page.tsx`)
- Aufbau wie `src/app/datenschutz/page.tsx` (`Screen`, `Section`, `tabbar={false}`, statisch, ohne Login).
- Pflichtangaben nach §5 DDG: Name, ladungsfähige Anschrift (kein Postfach; wer die Privatadresse nicht zeigen will: c/o-Impressum-Dienst), E-Mail plus zweiter schneller Kontaktweg (Telefon oder Kontaktformular).
- Verantwortlich nach §18 Abs. 2 MStV.
- Hinweis: keine Teilnahme an Verbraucherschlichtung (§36 VSBG freiwillig/informativ).
- DSA-Kontaktstelle (Art. 11/12).
- Echte Angaben aus dem Abschnitt „Angaben“ unten eintragen. Nur der zweite Kontaktweg bleibt als sichtbarer Platzhalter stehen.

### 4. Datenschutzerklärung neu schreiben (`src/app/datenschutz/page.tsx`)
Knapp und konkret bleiben, aber vollständig:
- **Verantwortlicher** (wie Impressum). Den Satz „privat, nicht kommerziell“ streichen.
- **Je Verarbeitung Zweck + Rechtsgrundlage:**
  - Konto, Haushalt, Rezepte, Liste, Profil: Art. 6 Abs. 1 lit. b
  - Server-/Zugriffslogs mit IP bei Vercel und Supabase, Sicherheit: lit. f
  - Auth-E-Mails (Bestätigung, Passwort) über Supabase: lit. b
  - Speicherung auf dem Gerät: §25 Abs. 2 TDDDG
- **Empfänger/Auftragsverarbeiter:**
  - Supabase (Frankfurt; Supabase Inc. USA)
  - Vercel Inc. (USA), Transfer über EU-US Data Privacy Framework + SCC
  - Hinweis: der Browser verbindet sich für Realtime direkt mit `*.supabase.co`
- **Speicherdauer:** bis zur Kontolöschung; Logs nach Anbieterfrist (Werte aus den Supabase-/Vercel-Docs nachschlagen, nicht raten).
- **Betroffenenrechte** Art. 15–21, Widerspruch nach Art. 21 hervorgehoben.
- **Beschwerderecht** bei einer Aufsichtsbehörde (Art. 77), zuständige Landesbehörde nach Wohnsitz des Betreibers.
- **Keine automatisierte Entscheidung**, keine Pflicht zur Bereitstellung außer E-Mail/Passwort für das Konto.
- **Mindestalter 16.**
- **Stand-Datum.**
- Satz „keine Tracking-Dienste, keine Weitergabe“ nur behalten, wenn er nach Schritt 1 und 5 wirklich stimmt.

### 5. Rezept-Pflege auf eigenen Haushalt begrenzen
- `scripts/rezept-pflege/pflege.mjs`: `liste` und alle Schreibpfade filtern hart auf eine Pflicht-Umgebungsvariable `PFLEGE_HOUSEHOLD_ID` (`.eq("household_id", …)`).
- `schreibe`/`bild` prüfen, dass das Ziel-Rezept zu diesem Haushalt gehört. Ohne gesetzte ID bricht das Skript ab (fail closed).
- `lauf.sh:24`: `mcp__gemini-image__generate_image` aus `--allowedTools` entfernen. Bildgenerierung über mflux (Memory „Bildgenerierung immer mflux“). `SKILL.md` von `rezepte-pflegen` entsprechend anpassen.
- `.env.example`: `PFLEGE_HOUSEHOLD_ID` dokumentieren.
- Read-only prüfen, ob schon Revisionen fremder Haushalte existieren: `select household_id, count(*) from recipe_revisions group by 1`. Falls ja, dir melden. Nichts automatisch löschen.

### 6. Nutzungsbedingungen `/nutzungsbedingungen` (neu)
Kurz:
- Leistungsbeschreibung: kostenlos, ohne Verfügbarkeitsgarantie
- Mindestalter 16
- Nutzer ist für importierte und hochgeladene Inhalte verantwortlich (Urheberrecht)
- Nutzungsrecht nur soweit nötig für den Betrieb
- Verbotene Inhalte; Meldeweg (Art. 16 DSA: E-Mail mit Pflichtangaben)
- Sperre/Kündigung mit Begründung (Art. 17)
- Haftung beschränkt, soweit gesetzlich zulässig (Vorsatz, grobe Fahrlässigkeit und Leben/Körper ausgenommen)
- Deutsches Recht
- Stand-Datum

### 7. Verlinkung überall erreichbar (PWA hat keine Browserleiste)
- `/registrieren/page.tsx`: Hinweiszeile unter dem Formular: „Mit dem Anlegen akzeptierst du die Nutzungsbedingungen. Wie wir Daten verarbeiten: Datenschutz.“ Kein Häkchen nötig, da Rechtsgrundlage lit. b.
- `/anmelden/page.tsx`: neben „Datenschutz“ auch Impressum und Nutzungsbedingungen.
- `src/app/(app)/einstellungen/page.tsx:64`: `SettingsRow` für Impressum und Nutzungsbedingungen ergänzen.
- `src/proxy.ts`: prüfen, dass `/impressum` und `/nutzungsbedingungen` ohne Login erreichbar sind wie `/datenschutz`.
- Gestaltung nach `DESIGN.md` (15 px Fließtext, 44 px Trefferfläche).

### 8. Organisatorisch (du, nicht Code)
- DPA von Supabase (Dashboard → Legal) und Vercel (Teil der ToS/DPA-Seite) akzeptieren bzw. herunterladen und ablegen.
- **Vercel Hobby-Plan** ist laut Fair Use nur für nicht-kommerzielle Nutzung. Solange emil kostenlos ist, passt das. Bei Monetarisierung auf Pro wechseln.
- Kurzes Verarbeitungsverzeichnis (Art. 30) als `docs/verarbeitungsverzeichnis.md`: eine Tabelle, die aus Schritt 4 entsteht.
- Vor dem App Store: Apple verlangt Datenschutz-URL, Kontodatenlöschung (vorhanden: `src/app/api/v1/account/route.ts`) und die Privacy-„Nutrition Labels“ passend zu dieser Erklärung.

## Verifikation
1. `npm run verify` (Typecheck, Lint, Tests).
2. `npm run build`, danach `grep -r "fonts.g" .next/static`: muss leer sein.
3. **Live-Deploy mit Chrome-MCP:** `/anmelden`, `/registrieren`, eingeloggt Rezepte und Liste öffnen, `read_network_requests`. Erlaubt sind nur die eigene Domain und `*.supabase.co`. Kein Google, kein `vitals`/Speed-Insights-Intake, keine `_vercel/speed-insights`.
4. `/impressum`, `/datenschutz`, `/nutzungsbedingungen` ausgeloggt erreichbar, von Registrierung, Anmeldung und Einstellungen verlinkt, auf 375 px lesbar.
5. `node scripts/rezept-pflege/pflege.mjs liste --offen` ohne `PFLEGE_HOUSEHOLD_ID` bricht ab, mit gesetzter ID zeigt es nur eigene Rezepte.
6. Vercel-Projekt zeigt Function Region `fra1`.
7. Commit und Push nach `main` je Schritt (laut Memory).

## Angaben (geliefert 2026-09-25)
- Verantwortlich / Anbieter: **Alexander Heckmann, Herzenstr. 15, 78315 Radolfzell**
- E-Mail: **alexander.heckmann(at)outlook.com** (so im Impressum, Datenschutz, DSA-Kontaktstelle und Meldeweg eintragen)
- Aufsichtsbehörde: **Landesbeauftragter für den Datenschutz und die Informationsfreiheit Baden-Württemberg (LfDI BW)**, Lautenschlagerstraße 20, 70173 Stuttgart
- Offen: ein zweiter schneller Kontaktweg (EuGH C-298/07), also Telefonnummer oder Kontaktformular. Bis dahin bleibt der Platzhalter `[Telefon]` sichtbar. In der Abschlussmeldung darauf hinweisen.
