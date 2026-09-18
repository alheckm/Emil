# Emil wird eine echte iPhone-App

## Kontext

Emil läuft heute als Next.js-PWA (Supabase-Backend, ~7.000 Zeilen) und ist
funktional fertig — P0 bis P7 sind durch. Drei Dinge sollen sich ändern:

1. **Eine echte iPhone-App** statt einer Web-App auf dem Home-Bildschirm.
2. **Ein Aufbau, in dem neue Features billig und lesbar bleiben.** Heute liegen
   Layout, Zustand und Logik in denselben Dateien — `RecipeForm.tsx` hat 529
   Zeilen, `ListView.tsx` 491. Jede Änderung erfordert, die ganze Datei zu
   verstehen.
3. **Ein deutlich moderneres Design.** Das ist heute praktisch nicht vorhanden:
   9 Farbvariablen in 61 Zeilen CSS, kein Abstands-, Radius-, Schrift- oder
   Schattensystem, kein einziger Schatten in der ganzen App, keine Animation
   außer `active:opacity-70`, keine Tab-Bar, kein Header, keine Lade- oder
   Fehlerzustände.

Die Vorarbeit von damals zahlt sich jetzt aus: `src/lib/core` (1.645 Zeilen
Parser, Einheiten, Skalierung, Merge) ist per `dependency-cruiser` und einem
DOM-freien zweiten Typcheck erzwungen **pur** und mit 1.183 Zeilen Tests
abgedeckt. `src/lib/data` bekommt den Supabase-Client **übergeben** statt ihn
zu importieren. Beide Schichten wandern unverändert in die App — das ist
genau der Fall, für den die Regeln gebaut wurden.

### Entschieden

| Thema | Entscheidung |
|---|---|
| Plattform | **Nur noch nativ.** Expo / React Native (SDK 57, RN 0.86). Die Next.js-App wird archiviert, nicht weitergepflegt. Eine Oberfläche, ein Code. |
| Verteilung | **Ohne Apple-Konto** (Personal Team). Siehe den Abschnitt darunter — das hat zwei harte Folgen, nicht nur Komfortnachteile. |
| Design | **Eigenständig, redaktionell.** Kochbuch-Anmutung: große Rezeptbilder, ausdrucksstarke Typografie, eigene Bewegungssprache. Bewusst nicht wie Standard-iOS. |
| Nativ in v1 | Teilen-Weg („An Emil senden") + echte lokale Datenbank (offline-first) |
| Nicht in v1 | Push, Widgets, Live Activities, Wochenplan, Vorratsschrank |

### Was „ohne Apple-Konto" konkret bedeutet

Das Personal Team (Signieren mit der normalen Apple-ID, 0 €) hat Grenzen, die
den Plan an zwei Stellen formen — nicht nur den Komfort:

- **Provisionierung läuft nach 7 Tagen ab.** Die App auf dem iPhone hört
  danach auf zu starten und muss neu installiert werden (Kabel + Xcode bzw.
  `npx expo run:ios --device`). Maximal 3 Geräte, 3 Apps pro Gerät.
- **Keine Entitlements** — also **keine App Groups**. Eine echte iOS-Share-
  Extension braucht eine App Group, um die geteilte URL an die App zu
  übergeben. Sie ist damit **nicht baubar**, solange kein bezahltes Konto da
  ist.
- Der **Simulator ist unbegrenzt und kostenlos.** Deshalb wird alles, was im
  Simulator prüfbar ist, dort geprüft, und Geräte-Installationen werden
  gebündelt (siehe Phasen N3 und N7).

**Der Ersatz für die Share-Extension, der ohne Konto funktioniert:** die App
registriert das URL-Schema `emil://`. Ein iOS-Kurzbefehl im Teilen-Menü öffnet
`emil://import?url=…`. Für dich ist die Geste identisch zu heute (Teilen → „An
Emil senden"), nur landet sie jetzt in der **nativen App** statt in Safari.
Sobald ein Apple-Konto da ist, kommt die echte Extension als Aufsatz dazu —
ohne Umbau, weil der Deep-Link-Empfänger schon steht.

Xcode 26.6 liegt bereits in `/Applications` (4 GB, iPhoneOS- und
Simulator-SDK vorhanden). Es fehlt nur `sudo xcode-select -s
/Applications/Xcode.app` — heute zeigt der aktive Pfad noch auf die Command
Line Tools.

---

## Zielaufbau

**Kein Monorepo, keine Workspaces.** Es gibt künftig genau eine App; ein
`packages/`-Verzeichnis würde nur harte Modulgrenzen bringen, die
`dependency-cruiser` schon durchsetzt — bezahlt mit Metro- und
Hoisting-Konfiguration. Ein Projekt, flache Struktur.

**Die Pfade `src/lib/core` und `src/lib/data` bleiben, wie sie sind.** Nicht
umbenannt, nicht verschoben: dann bleiben alle Importe, die bestehenden Tests,
`tsconfig.core.json` und `.dependency-cruiser.cjs` unverändert gültig. Dass
diese beiden Ordner den Plattformwechsel ohne Anfassen überleben, ist der
Beweis, dass die Grenze getragen hat.

```
app/                        expo-router: nur Routing, dünne Dateien
  (tabs)/liste/ …
  (tabs)/rezepte/ …
  (tabs)/mehr/ …
  anmelden.tsx, registrieren.tsx, …
src/
  lib/core/                 UNVERÄNDERT übernommen (pur, getestet)
  lib/data/                 übernommen, drei kleine Anpassungen (s. u.)
  design/                   NEU  Tokens: Farbe, Abstand, Radius, Schrift,
                                 Tiefe, Bewegung — eine Quelle der Wahrheit
  ui/                       NEU  Primitive, lesen ausschließlich aus design/
  db/                       NEU  Drizzle-Schema + Migrationen (SQLite)
  sync/                     NEU  Pull/Push-Motor, Outbox
  session/                  NEU  Supabase-Client, Auth-Zustand, Deep Links
  features/                 NEU  je Fachthema ein Ordner
    liste/     { screen, hooks, components }
    rezepte/   { screen, hooks, components }
    haushalt/  …
    konto/     …
supabase/                   Migrationen, Seeds + NEU: Edge Function
```

### Die vier Regeln, die Änderungen künftig billig halten

Sie ersetzen nicht die zwei bestehenden Regeln (`core` bleibt pur,
Supabase-Queries nur in `lib/data`) — sie kommen dazu, und wie die
bestehenden werden sie von `npm test` erzwungen, nicht nur zugesagt.

1. **Ein Screen enthält nur Layout.** Zustand lebt in genau einem
   `use…()`-Hook je Screen, Logik in `lib/core`. Erzwungen per eslint
   `max-lines` auf `app/**` und `src/features/**/*Screen.tsx` (Obergrenze
   200 Zeilen). Das ist die Regel, die `RecipeForm.tsx` mit 529 Zeilen
   verhindert hätte.
2. **Kein Screen und keine Komponente liest Farben, Abstände oder Schriften
   direkt.** Alles kommt aus `src/design/`. Erzwungen per
   `dependency-cruiser`: nur `src/ui` und `src/design` dürfen
   `src/design/tokens` importieren.
3. **Kein Screen spricht mit dem Netz.** Screens lesen aus SQLite, schreiben
   in die Outbox. Nur `src/sync` ruft `src/lib/data`. Erzwungen per
   `dependency-cruiser`: `src/features` und `app` dürfen `src/lib/data` nicht
   importieren.
4. **Ein Feature-Ordner ist der einzige Ort, den man für ein Feature anfassen
   muss.** Neue Funktion = ein Ordner mehr, nicht Änderungen an sechs Stellen.

---

## Änderungen an bestehendem Code

### `src/lib/data` — drei Anpassungen, sonst nichts

Nachgezählt: in `src/lib/core` und `src/lib/data` zusammen gibt es **genau
zwei** Stellen, die eine Web-Plattform voraussetzen — beide in derselben
Datei. Das ist der Ertrag der Grenze von damals.

- **`recipeImages.ts:38`** — `uploadRecipeImage(…, file: File)`: `File` ist ein
  DOM-Typ, den React Native nicht hat. Signatur auf `ArrayBuffer` plus
  explizites `contentType` weiten (der von Supabase für RN dokumentierte Weg;
  `Blob` in RNs `fetch` ist unzuverlässig).
- **`recipeImages.ts:31`** — `buildImagePath` ruft `crypto.randomUUID()`.
  Hermes hat kein `crypto`. Entweder `expo-crypto` im App-Einstieg als Polyfill
  setzen oder — sauberer, weil es die Funktion pur macht — die UUID als
  Argument hereingeben. Ihre Tests bleiben in beiden Fällen gültig.
- **`auth.ts:22,59`** — `redirectTo` wird schon als String übergeben, nicht
  gebaut. Die Aufrufer liefern künftig `emil://auth/callback` statt
  `window.location.origin`. Die Datenschicht selbst ändert sich nicht.
- **Tests dazu.** `auth.ts`, `households.ts`, `recipes.ts`, `shoppingList.ts`
  haben heute **keine** Tests, weil kein Supabase-Mock existiert. Mit SQLite
  davor werden diese Funktionen zur Sync-Grenze und damit zur Stelle, an der
  Fehler teuer werden. Ein schlanker Fake-Client (die `rpc`/`from`-Aufrufe
  aufzeichnen, feste Antworten liefern) reicht und kostet wenig.

### Was ersatzlos verschwindet

| Weg | Warum |
|---|---|
| `src/proxy.ts`, `src/lib/server/session.ts`, `app/auth/callback/route.ts` | Cookie-Sitzungen. Nativ hält das Supabase-SDK die Sitzung selbst. |
| `public/sw.js`, `src/lib/client/offline/db.ts` | Kein Service Worker, kein IndexedDB nativ — SQLite ersetzt beides, und iOS räumt eine native Datenbank nicht nach 7 Tagen ab. Das war der stärkste Alltagsgrund für die native App. |
| `src/app/api/v1/import/url/route.ts` | **Nativer `fetch` kennt kein CORS.** Die App lädt die Rezeptseite selbst und lässt das pure `extractRecipeFromHtml` darüber laufen. Der SSRF-Schutz entfällt mit dem Server, der ihn brauchte — es ist das eigene Gerät, das eine selbst gewählte Adresse abruft. Die **Zeichensatz-Erkennung aus `fetchPage.ts:120-125` wandert mit** (siehe offene Punkte). |
| `src/app`, `src/components/ui.tsx`, `globals.css`, `next.config.ts`, `eslint-config-next`, `@supabase/ssr`, `tailwindcss`, `browser-image-compression` | Ersetzt durch `app/`, `src/ui`, `src/design`, `expo-image-manipulator`. |
| Tabelle `household_tokens` (Migration 0013) | Seit 0001 im Schema, von keiner Zeile TypeScript je benutzt. Der Deep-Link nutzt die Sitzung der App. Weg damit, statt sie als Rätsel stehen zu lassen. |

**Nebenwirkung, die ein bekanntes Problem löst:** Der README führt „Das Bild
einer importierten Webseite wird nicht übernommen" als CORS-bedingt
unbehebbar. Nativ ist es behebbar — die App lädt das `og:image` direkt und
legt es in Storage.

### Was serverseitig bleiben muss

`DELETE /api/v1/account` ist die einzige Route, die wirklich einen Server
braucht: nur die Service-Rolle darf die Zeile in `auth.users` löschen. Sie
wird zur **Supabase Edge Function `delete-account`** — die Reihenfolge bleibt
zwingend: erst `delete_own_household_data()` im Nutzerkontext, dann
`auth.admin.deleteUser`. Damit ist `SUPABASE_SECRET_KEY` aus der App heraus.

RLS, alle RPCs und Realtime bleiben **unangetastet**. Die Policies hängen an
`auth.uid()` und wissen nichts von Cookies — ein nativer Client bekommt
dieselben Garantien.

---

## Design: von 9 Farbvariablen zu einem System

Die warme Papier-Palette ist gut und bleibt als Ausgangspunkt. Alles andere
entsteht neu. `src/design/tokens.ts` definiert in einer Datei:

- **Farbe** — die 9 bestehenden Werte, ergänzt um Ebenen (`surface`,
  `surfaceRaised`, `surfaceSunken`), Zustände und ein echtes Dunkelschema.
- **Abstand** — eine 4-pt-Skala mit Namen. Heute: keine.
- **Radius, Tiefe** — heute existiert **kein einziger Schatten** in der App;
  das ist der Hauptgrund, warum sie flach und webseitig wirkt. Eine
  dreistufige Höhenskala.
- **Schrift** — der eigentliche Träger des redaktionellen Charakters: eine
  variable Serif für Titel und Rezeptnamen, eine ruhige Sans für Bedienung,
  über `expo-font` gebündelt. Dazu eine benannte Skala statt der heutigen
  `text-[13px]`/`text-[15px]`-Einzelfälle.
  **Dynamic Type muss von Anfang an mitgedacht werden** — eine
  typografiegetriebene App, die bei großer Systemschrift bricht, ist auf dem
  iPhone unbenutzbar, und das nachträglich einzuziehen ist teuer.
- **Bewegung** — Dauern und Kurven als Tokens, damit die Bewegungssprache
  überall dieselbe ist. Umgesetzt mit `react-native-reanimated`.

Darauf `src/ui/`: `Text`, `Button`, `Card`, `Field`, `Sheet`, `ListRow`,
`Chip`, `Notice`, `Skeleton`, `Stepper`, `Sektionsheader`. Haptik
(`expo-haptics`) und Druckfeedback stecken **in** den Primitiven, nicht in den
Aufrufern — dann fühlt sich die App überall gleich an, ohne dass jeder Screen
daran denkt.

Die redaktionelle Richtung konkret: randlose Rezeptbilder als Kopf,
Seriftitel über dem Bild, viel Weißraum, Zutatenlisten als gesetzte Tabelle
statt als Formularzeilen, geteilte Elementübergänge vom Rezeptbild in der
Liste zum Detail.

**Prüffläche:** ein Screen `app/(dev)/katalog.tsx`, der jedes Primitiv in
beiden Schemata und bei drei Schriftgrößen zeigt. Damit ist Design im
Simulator beurteilbar, ohne durch die App zu navigieren.

---

## Lokale Datenbank und Sync

`expo-sqlite` mit **Drizzle**; `useLiveQuery` macht Lesevorgänge reaktiv —
schreibt der Sync in SQLite, rendert der Screen neu. SQLite ist die
Wahrheit für die Oberfläche, nicht ein Cache daneben.

Warum das der größte Aufräumgewinn ist: `ListView.tsx` hält heute **fünf sich
überlagernde Quellen derselben Wahrheit** — die Server-Props, `shownEntries`,
`checkedNow`, `pending` und `mirrored` (`src/app/liste/ListView.tsx:51-77`) —
zusammengehalten von vier Effekten und einem Kommentar, der erklärt, warum
eine Zuweisung beim Rendern statt im Effekt passieren muss (Zeile 60-68). Die
Logik darin ist richtig und sorgfältig, aber sie ist nur als Ganzes
verständlich. Mit SQLite als Wahrheit bleibt: lesen aus SQLite, schreiben nach
SQLite plus Outbox. Ein Screen, eine Quelle.

Kein PowerSync, kein TanStack Query: die Schreibwege sind bereits
Postgres-RPCs, die Konfliktregel ist bereits pur und getestet
(`src/lib/core/pendingToggles.ts`, gespiegelt in `set_entry_checked`). Ein
eigener, kleiner Motor über den vorhandenen RPCs ist weniger Gesamtaufwand als
eine Sync-Schicht dazwischen.

- **Pull** — bei Realtime-Ereignis, App-Vordergrund und Wiederverbindung. Grob
  wie heute: vollständig neu laden und in einer Transaktion in SQLite
  spiegeln, statt Zeilen zu rekonstruieren.
- **Push** — eine `outbox`-Tabelle in SQLite, abgearbeitet über die
  bestehenden `lib/data`-Funktionen. Für Häkchen bleibt die heutige Regel:
  ein offener Wunsch je Zeile, `clientUpdatedAt` entscheidet.
- **Der Rezept-Schreibweg ist der riskante Teil.** `save_recipe` ist *eine*
  Transaktion mit verschachtelten Zutatenzeilen und gibt zurück, auf welcher
  Liste das Rezept lag, damit `refreshRecipeOnLists` es neu rechnen kann. Das
  offline in eine Outbox zu legen und später abzuspielen, heißt diese
  Nachlogik offline nachzubauen.
  **Deshalb, und das ist eine bewusste Grenze: offline schreibbar ist nur die
  Einkaufsliste** (Häkchen und von Hand ergänzte Zeilen) — genau der Fall, der
  im Supermarkt zählt. Rezepte anlegen und bearbeiten brauchen Netz und sagen
  das klar, statt eine Synchronisierung zu versprechen, die in Sonderfällen
  falsch rechnet. Rezepte werden offline **gelesen** (gespiegelt), nicht
  geschrieben.
- Der Motor selbst ist ein purer Reduzierer (Serverstand + Outbox → nächster
  Zustand) und wird wie `pendingToggles` mit Vitest getestet, ohne SQLite.

---

## Phasen

Jede Phase endet in etwas Vorführbarem. Reihenfolge ist von der
7-Tage-Provisionierung diktiert: alles, was im Simulator prüfbar ist, kommt
vor der ersten Geräte-Installation.

Gearbeitet wird auf dem Branch `nativ`; `main` bleibt bis zum Schluss die
laufende, benutzbare PWA — die Verpflegung läuft weiter, während die Küche
umgebaut wird. `src/lib/core` und `src/lib/data` wandern per `git mv`, damit
die Historie erhalten bleibt.

| Phase | Inhalt | Geprüft auf |
|---|---|---|
| **N0 Fundament** | `xcode-select` umstellen. Expo-App (SDK 57) auf Branch `nativ`, Next.js-Teile dort entfernt, `lib/core`+`lib/data` unverändert übernommen. expo-router-Gerüst mit Tab-Bar. Supabase-Client mit SecureStore-Adapter, `autoRefreshToken` an `AppState` gekoppelt. Anmelden/Registrieren/Passwort. Deep Link `emil://` registriert und in der Supabase-Redirect-Erlaubnisliste. | Simulator |
| **N1 Design-Fundament** | `src/design/tokens.ts`, Schriften, `src/ui/`-Primitive mit Bewegung und Haptik, Katalog-Screen. Kein Fachinhalt. | Simulator, hell + dunkel, 3 Schriftgrößen |
| **N2 Datenbank + Sync** | Drizzle-Schema, Outbox, Pull/Push-Motor, Realtime-Anbindung. Purer Reduzierer mit Tests. Noch ohne neue Oberfläche. | Vitest + Simulator |
| **N3 Einkaufsliste** | Der Screen, der den Alltag trägt: Abschnitte nach Abteilung, Wischen zum Abhaken mit Haptik, Zeile ergänzen, Herkunft aufklappen, Offline-Hinweis. **Erste Geräte-Installation**: beide iPhones, Realtime unter 2 s, Flugmodus-Test. | **Gerät** |
| **N4 Rezepte** | Liste als redaktionelle Karten mit Bild, Suche und Schlagwörter, Detail mit Portionswähler und geteiltem Bildübergang, „Auf die Einkaufsliste". Formular zerlegt: die puren Umformungen (`toRow`, `rowsFromRecipe`, `rowsFromText`, `RecipeForm.tsx:79-130`) wandern als testbare Funktionen ins Feature, der Zustand in `useRecipeForm`, `save()` (heute 108 Zeilen, `RecipeForm.tsx:204-312`) in eine eigene Datei. Aus einer 397-Zeilen-Funktion werden sechs benennbare Teile. | Simulator |
| **N5 Import & Kamera** | URL-Import auf dem Gerät inklusive `og:image` (behebt den bekannten offenen Punkt). Einfügen-Import (JSON/Freitext) mit „Prompt kopieren". Kamera und Fotoauswahl, Verkleinern über `expo-image-manipulator`. Deep-Link-Empfänger `emil://import?url=…` plus neuer Kurzbefehl „An Emil senden". | Simulator + **Gerät** (Kamera, Kurzbefehl) |
| **N6 Haushalt, Konto, Recht** | Mitglieder, Einladungscodes, Abmelden. Edge Function `delete-account` und Konto löschen. Datenschutz als Screen. Migration 0013 entfernt `household_tokens`. | Simulator, Löschung gegen Testkonto |
| **N7 Politur & Umschaltung** | Lade-, Leer- und Fehlerzustände überall, App-Icon und Startbildschirm, Barrierefreiheit (Dynamic Type, VoiceOver), deutscher Textdurchgang. `nativ` → `main`, letzter Web-Stand als Tag `web-pwa-final`, README neu. | **Gerät**, beide iPhones |

**Später, sobald ein Apple-Konto da ist** (99 €/Jahr, ändert am Code nichts):
echte Share-Extension mit App Group, TestFlight statt Wochenkabel, Push,
Widgets, App Store.

---

## Verifikation

**Automatisiert (`npm test`, bleibt das eine Kommando)**
- Die bestehenden 1.183 Zeilen Core-Tests laufen **unverändert** durch. Genau
  das ist der Nachweis, dass die Portierbarkeitsregel getragen hat — wäre an
  `lib/core` etwas zu ändern, wäre die Regel gebrochen worden.
- `dependency-cruiser` mit den zwei bestehenden plus drei neuen Regeln
  (`design`-Tokens nur in `ui`, `lib/data` nicht aus `features`/`app`,
  weiterhin keine Zyklen).
- `tsconfig.core.json`: der DOM-freie Typcheck bleibt.
- eslint `max-lines` (200) auf Screens.
- Neu: Sync-Reduzierer, und `lib/data` gegen einen Fake-Client.

**Auf dem Gerät (die Punkte, die kein Test ersetzt)**
- **Zwei-Geräte-Test:** Häkchen auf Handy A erscheint auf B in unter 2 s.
- **Echter Flugmodus** — nicht nur den lokalen Server abschalten, das ist laut
  README ausdrücklich kein Offline-Test: drei Häkchen und eine ergänzte Zeile
  im Flugmodus, danach Flugmodus aus, nichts doppelt, nichts verloren.
- **Der 7-Tage-Beweis:** App eine Woche liegen lassen, dann öffnen. Liste
  vollständig aus SQLite da (bei der PWA räumte iOS hier den Speicher).
- **Teilen-Weg:** Safari → Teilen → „An Emil senden" → native App öffnet den
  Prüf-Screen mit gelesenem Rezept, Bild inklusive.
- Rezeptimport gegen die geprüfte Chefkoch-URL aus dem Ursprungsplan: 12
  Zutaten, 4 Portionen, Anleitung vorhanden.
- RLS: zweites Testkonto in anderem Haushalt sieht null Zeilen.
- Konto löschen über die Edge Function: Rezepte, Listenzeilen, Bilder und
  Mitgliedschaft weg, ein zweites Haushaltsmitglied behält alles.
- Dynamic Type auf der größten Stufe, VoiceOver durch Liste und Rezeptdetail.

## Offene Punkte, die du kennen solltest

- **Die Wochen-Neuinstallation ist echte Reibung**, nicht nur Theorie: zwei
  iPhones, jede Woche, per Kabel oder im WLAN. Ab dem Moment, wo Emil im
  Alltag wieder das Werkzeug fürs Einkaufen ist, sind die 99 €/Jahr vor allem
  der Kauf dieser Reibung, nicht des App Stores. Der Plan hält beide Wege
  offen; die Entscheidung kann bis N3 warten, wenn die App das erste Mal aufs
  Gerät soll.
- **Ein SecureStore-Wert darf nur 2048 Byte groß sein.** Supabase-Sitzungen
  können darüber liegen. Der dokumentierte Weg: Schlüssel in SecureStore,
  verschlüsselte Sitzung in AsyncStorage. Wird in N0 gleich so gebaut.
- **`useLiveQuery` läuft bei expo-router weiter, wenn ein Screen nicht
  abgebaut wird.** Bei einer Liste unter 60 Zeilen und ~100 Rezepten
  unkritisch, aber die Abfragen werden an den Fokus gekoppelt, damit es nicht
  später als Rätsel auftaucht.
- **Zeichensätze beim Import auf dem Gerät.** `fetchPage.ts:120-125` liest den
  Zeichensatz aus dem `Content-Type` und dekodiert per
  `new TextDecoder(charset)`. Hermes bringt `TextDecoder` nur eingeschränkt mit
  und kennt `iso-8859-1`/`windows-1252` nicht zuverlässig — genau die
  Zeichensätze älterer deutscher Rezeptseiten. Lösung: ein kleines,
  abhängigkeitsfreies Polyfill (`@borewit/text-codec` deckt exakt diese Fälle).
  Falls sich das im Praxistest als brüchig erweist, ist der Ausweg eine zweite
  Edge Function `import-url` — dort ist `fetchPage.ts` ein
  Eins-zu-eins-Umzug nach Deno, das vollen `TextDecoder` hat. Der Bild-Download
  bleibt in beiden Fällen auf dem Gerät, das ist die CORS-Seite des Gewinns.
- **Zwei Wochen ohne sichtbaren Fortschritt.** N0 bis N2 bauen Fundament; die
  App wird erst in N3 wieder nützlich. Das ist die Reihenfolge, die
  Doppelarbeit vermeidet, aber es fühlt sich zwischendurch nach Rückschritt
  an.
