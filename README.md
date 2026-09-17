# Emil

Rezepte aus Kochbuch, Webseite oder App sammeln, Portionen exakt umrechnen und
die Einkaufsliste im Haushalt auf mehreren Handys teilen.

Progressive Web App (Next.js) mit Supabase als Backend. Kein API-Key, keine
laufenden Kosten. Der Plan liegt in
`~/.claude/plans/ich-m-chte-eine-iphone-cozy-cascade.md`.

## Stand

| Phase | Inhalt | Status |
|---|---|---|
| P0 | Gerüst, PWA-Manifest, iOS-Icons, Build | **fertig** |
| P1 | Login, Haushalt, RLS, Konto löschen | **fertig**, 44 Durchläufe gegen das echte Projekt |
| P2 | Parser, Einheiten, Skalierung, Merge | **fertig**, 144 Tests |
| P3 | Rezepte & Einkaufsliste (Oberfläche) | **fertig**, live geprüft |
| P4 | Webseiten-Import | **fertig** — Kern live geprüft, Oberfläche unter `/rezepte/importieren` |
| P5 | Einfügen-Import & Rezeptbilder | **fertig** — JSON + Freitext, „Prompt kopieren“, Bild-Upload mit Verkleinern |
| P6 | Offline, Suche, Tags | **fertig** — Offline-Liste, Häkchen-Puffer, Suche, Schlagwörter (live geprüft) |
| P7 | iOS-Kurzbefehl, Datenschutz, Politur | offen |

## Offline-Betrieb

Die Einkaufsliste funktioniert im Supermarkt auch ohne Empfang.

- **`public/sw.js`** — von Hand geschriebener Service Worker. Seitenaufrufe
  „Netz zuerst, sonst zuletzt gesehene Fassung"; gehashte Dateien dauerhaft aus
  dem Speicher. `/api/` und Supabase werden **nie** zwischengespeichert.
  Bewusst kein Build-Plugin: `@serwist/next` unterstützt Turbopack nicht, und
  Next 16 baut standardmäßig damit.
- **`src/lib/client/offline/`** — lokaler Spiegel der Liste und Puffer für noch
  nicht gesendete Häkchen (IndexedDB). Ein offener Häkchen-Wunsch je Zeile:
  mehrfaches Antippen überschreibt sich, statt eine Warteschlange aufzustauen.
- **`src/lib/core/pendingToggles.ts`** — die Konfliktregel, pur und getestet:
  ein Puffereintrag wird übergangen, sobald der Server für dieselbe Zeile etwas
  Neueres kennt. Dieselbe Regel steht in `set_entry_checked`.
- Angemeldet wird der Service Worker **nur im Produktionsbetrieb**. Zum Prüfen
  also `npm run build && npm run start` — im Entwicklungsbetrieb würde der
  Dateispeicher das Neuladen aushebeln.

Wichtig beim Testen: den lokalen Server abzuschalten ist **kein** Offline-Test.
Supabase liegt in der Cloud und bleibt erreichbar, Schreibvorgänge gelingen
also weiterhin. Echtes Funkloch heißt: beide unerreichbar.

## Bekannte offene Punkte

- **Das Bild einer importierten Webseite wird nicht übernommen.** Chefkoch
  liefert eine Bild-URL, aber der Browser darf sie wegen CORS nicht selbst
  laden; das bräuchte eine eigene Server-Route mit Größenbegrenzung. Ein
  eigenes Foto lässt sich jederzeit setzen.
- **Zusammengesetzte Zutatennamen landen in „Sonstiges".** „Knoblauchzehe"
  trifft den Seed-Eintrag „Knoblauch" nicht (Ähnlichkeit unter 0,85). Einmal
  die Abteilung antippen genügt, danach bleibt sie gespeichert.

## Einrichten

```bash
npm install
cp .env.example .env.local     # und ausfüllen, siehe unten
npm run dev
```

### Supabase-Projekt

Das Projekt läuft (`seuwevdlnumhdynjzlvt`, Frankfurt), Schema und Stammdaten
sind eingespielt: 12 Kategorien, 31 Einheiten, 350 Zutaten. `.env.local` ist
vollständig.

Drei Schlüssel, drei Rollen:

| Variable | Typ | Darf ins Browser-Bundle? |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Adresse | ja |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `sb_publishable_…` | ja — kommt nur durch RLS hindurch |
| `SUPABASE_SECRET_KEY` | `sb_secret_…` | **nie** — umgeht RLS vollständig |

Der Secret Key hat in der ganzen App genau einen Aufrufer: das Löschen des
Kontos (`src/lib/server/supabaseAdmin.ts`). Den Eintrag in `auth.users` kann
kein Code im Nutzerkontext entfernen. Gegenüber dem alten
`service_role`-JWT lässt er sich einzeln widerrufen, ohne die übrigen
Schlüssel mitzudrehen.

Bei den *Authentication → Providers* ist bereits nur **Email** aktiv (kein
Google/Apple — dann verlangt Apple später auch kein „Sign in with Apple", falls
eine App-Store-App dazukommt). E-Mail-Bestätigung ist an: nach dem Registrieren
muss der Link aus der Mail **auf demselben Gerät** geöffnet werden, auf dem das
Formular ausgefüllt wurde (PKCE, siehe `src/app/auth/callback/route.ts`).

Für ein **neues** Projekt von vorn: im SQL-Editor `supabase/setup.sql` einfügen
und ausführen — eine Datei, eine Transaktion (Migrationen und Seeds in der
richtigen Reihenfolge). Entweder steht danach alles, oder nichts; ein halb
eingespieltes Schema kann es nicht geben.

## Befehle

| Befehl | Zweck |
|---|---|
| `npm run dev` | Entwicklungsserver |
| `npm test` | Architektur-Grenze + Core-Typcheck + Tests |
| `npm run verify` | alles: Typcheck, Lint, Grenze, Tests |
| `npm run seed` | erzeugt Seeds und `setup.sql` neu aus den Quelldateien |
| `npm run build` | Produktionsbuild |

## Aufbau

```
src/lib/core/     Parser, Einheiten, Skalierung, Merge — pur und getestet
src/lib/data/     Repository-Schicht: der einzige Ort mit Supabase-Queries
src/lib/server/   Seitenabruf, Supabase-Server-Client, Konfiguration
src/lib/client/   Supabase-Browser-Client, Realtime, Offline
src/components/   die paar geteilten Bausteine der Oberfläche
src/proxy.ts      frischt die Sitzung bei jedem Request auf
src/app/          Oberfläche und /api/v1-Routen
supabase/         Migrationen und Seeds
```

### Bildschirme

| Pfad | Zweck |
|---|---|
| `/` | Weiche: nicht angemeldet → `/anmelden`, kein Haushalt → `/haushalt/start` |
| `/anmelden`, `/registrieren` | E-Mail + Passwort |
| `/passwort-vergessen`, `/passwort-neu` | Zurücksetzen per E-Mail-Link |
| `/auth/callback` | löst den Code aus der E-Mail gegen eine Sitzung ein |
| `/haushalt/start` | Haushalt anlegen **oder** Einladungscode einlösen |
| `/haushalt` | Mitglieder, Einladungscodes erzeugen und zurücknehmen |
| `/konto` | Abmelden, Konto löschen |
| `/rezepte` | Alle Rezepte, mit Vermerk, was auf der Liste liegt |
| `/rezepte/neu`, `/rezepte/[id]/bearbeiten` | Formular und Prüf-Screen in einem |
| `/rezepte/[id]` | Portionswähler, umgerechnete Zutaten, „Auf die Einkaufsliste" |
| `/liste` | Einkaufsliste: abhaken, ergänzen, Herkunft, Abteilung |

### Wie ein Rezept auf die Liste kommt

`add_recipe_to_list` bekommt die Positionen **fertig gerechnet** aus
`buildListItems` (`src/lib/core/mergeList.ts`) und ist nur die
Transaktionsgrenze. Skalieren und Umrechnen zweimal zu implementieren — einmal
in TypeScript, einmal in SQL — würde unweigerlich auseinanderlaufen, und der
Fehler fiele erst im Supermarkt auf.

Drei Eigenheiten, die daraus folgen:

- **Dasselbe Rezept erneut auflegen ersetzt seinen Anteil**, statt ihn zu
  verdoppeln. Portionszahl ändern und noch einmal tippen ist deshalb der Weg,
  eine Liste zu korrigieren.
- **Ein geändertes Rezept muss neu aufgelegt werden.** Beim Speichern werden
  die Zutatenzeilen ersetzt, und die Herkunftszeilen der Liste hängen per
  Kaskade daran. `save_recipe` gibt darum zurück, auf welcher Liste das Rezept
  mit wie vielen Portionen lag; `refreshRecipeOnLists` legt es sofort frisch
  gerechnet wieder drauf.
- **Von Hand ergänzte Zeilen tragen `is_manual`.** Ohne die Markierung wäre
  „Zahnpasta" (keine Menge, kein Rezept dahinter) nicht von einer leer
  gewordenen Rezeptzeile zu unterscheiden und würde beim nächsten Aufräumen
  stillschweigend verschwinden.

### Beide Handys gleichzeitig

`shopping_list_entries` **und** `shopping_list_sources` liegen in der
Publikation `supabase_realtime`; die Oberfläche lädt bei jeder Meldung neu,
statt einzelne Zeilen nachzupflegen (`src/lib/client/realtime.ts`). Beide
Tabellen, weil ein Rezept auf eine schon vorhandene Zeile nur die Summe darunter
ändert. Beide stehen außerdem auf `replica identity full` — sonst enthält das
Ereignis einer gelöschten Zeile nur den Primärschlüssel, die RLS-Prüfung von
Realtime fällt durch, und auf dem zweiten Handy bliebe eine längst entfernte
Zeile stehen.

### Unbekannte Zutaten

`resolve_ingredient` bildet einen Namen auf `ingredients` ab: exakter Name →
Alias → Ähnlichkeit ab 0.85 → sonst neu, dem Haushalt gehörend, in
„Sonstiges". Die Schwelle ist streng: `similarity('zwiebeln', 'zwiebel')` ist
0.7, „Zwiebeln" wird also **nicht** zur Zwiebel aus dem Seed, sondern zu einer
eigenen Zutat. Das ist die bewusste Seite des Kompromisses — lieber zwei Zeilen
als eine falsch zusammengerechnete. Wer es zusammen haben will, hängt einen
Alias ein; die Abteilung tippt man einmal auf der Liste an, danach bleibt sie.

### E-Mail-Links: Weiterleitungsziel muss erlaubt sein

Supabase akzeptiert als `emailRedirectTo` nur Adressen aus der Erlaubnisliste
(*Authentication → URL Configuration → Redirect URLs*). Steht eine Adresse
nicht drin, wird sie **stillschweigend** durch die Site URL ersetzt — der Link
in der Mail funktioniert dann scheinbar nicht, obwohl die Bestätigung selbst
längst geklappt hat.

`localhost` ist in jedem Port vorab erlaubt. Alles andere nicht:

| Wo Emil läuft | Eintrag nötig |
|---|---|
| `localhost:3000/3001` | nein |
| Handy im WLAN, z. B. `192.168.2.109:3001` | `http://192.168.2.109:3001/**` |
| Vercel | `https://<domain>/**` |

Die Site URL zeigt derzeit auf `http://localhost:3000` und ist das Ziel, auf
dem alles Nicht-Erlaubte landet.

### Nutzer nur über die App löschen

`delete_own_household_data()` räumt den Haushalt mit weg, wenn danach niemand
mehr darin ist. Wer stattdessen im Supabase-Dashboard einen Auth-Nutzer
löscht, umgeht das: die Mitgliedschaft verschwindet per Kaskade, der Haushalt
bleibt mit null Mitgliedern stehen und ist für niemanden mehr erreichbar.
Beim Aufräumen also `DELETE /api/v1/account` benutzen, nicht das Dashboard.

### Zwei Regeln, die `npm test` erzwingt

1. **`src/lib/core` bleibt portabel.** Keine Importe von React, Next, DOM,
   Supabase oder App-Code — geprüft per `dependency-cruiser`, zusätzlich ein
   zweiter Typcheck ohne DOM-Typen (`tsconfig.core.json`). Damit könnte eine
   spätere App-Store-App (Expo) Parser, Einheiten, Skalierung und Merge-Logik
   unverändert übernehmen.
2. **Supabase-Queries nur in `src/lib/data`.** Ein nativer Client tauscht dann
   eine Schicht statt die halbe App.

### Warum Mengen Strings sind

Mengen sind durchgehend Dezimal-**Strings**, nicht `number`. Sie werden
skaliert, über mehrere Rezepte summiert und in Postgres `numeric` gespeichert;
mit Fließkommazahlen summiert sich der Fehler auf, und das fällt beim Einkaufen
auf. Gerechnet wird mit `decimal.js-light`, gerundet wird ausschließlich in der
Anzeige.

Gespeichert wird immer die **Basismenge** samt `base_servings`, nie eine
skalierte Menge — nur so kommt ein Weg von 4 auf 6 und zurück auf 4 Portionen
wieder bei der Originalmenge heraus.
