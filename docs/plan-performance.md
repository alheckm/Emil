# Emil: Zero-Latency-Umbau (Next.js 16.3.5)

## Context

Emil läuft als PWA vom iPhone-Homescreen. Jeder Klick reagiert merklich verzögert — das zerstört das App-Gefühl.

**Die Ursache ist strukturell, nicht Feintuning.** Der Code enthält heute:

- **0** `loading.tsx`, **0** `<Suspense>`-Grenzen, **0** `useOptimistic`/`useTransition` (verifiziert per grep über `src/`)
- jede Seite ist eine eigenständige, voll dynamische Server-Komponente ohne gemeinsames Layout
- jede Mutation endet in `router.refresh()` — 15 Fundstellen

Damit ist **jeder Klick ein synchroner Server-Roundtrip mit eingefrorener Oberfläche**. Die Latenzkette für einen Tipp auf ein Rezept (`src/app/rezepte/[id]/page.tsx`):

| # | Ort | Aufruf | Art |
|---|---|---|---|
| 1 | `src/proxy.ts:4` → `session.ts:40` | `supabase.auth.getUser()` | Netz → Supabase Auth |
| 2 | `page.tsx:13` → `household.ts:22` → `supabase.ts:40` | `supabase.auth.getUser()` | Netz → Supabase Auth (**zweites Mal**) |
| 3 | `household.ts:28` | `listHouseholds()` | Netz → Postgres |
| 4 | `page.tsx:23` | `getRecipe()` | Netz → Postgres |
| 5 | `page.tsx:34` | `getActiveListId()` | Netz → Postgres |
| 6 | `page.tsx:35` | `listPlannedRecipes()` | Netz → Postgres (hängt an 5) |
| 7 | `page.tsx:37` | `getRecipeImageUrl()` | Netz → Supabase Storage (signierte URL) |

Sieben überwiegend **sequentielle** Roundtrips, bevor ein einziges Pixel erscheint. Bei 100 ms RTT über Mobilfunk sind das ~700 ms, in denen die UI nichts tut. Danach löst jede Mutation dieselbe Kette erneut aus — `ListView.tsx:83` sogar bei jedem Realtime-Ereignis vom zweiten Handy.

**Ziel:** Navigation und Mutation reagieren im Klick-Frame; Serverarbeit streamt nach.

**Entschieden (vom Nutzer):** Cache Components + Partial Prefetching aktivieren, und eine persistente Tab-Leiste unten einführen.

---

## Vorbemerkung zur Next-Version

Next 16.3.5 weicht von älterem Wissen ab. Gelesen und maßgeblich sind hier:

- `node_modules/next/dist/docs/01-app/02-guides/instant-navigation.md`
- `node_modules/next/dist/docs/01-app/02-guides/interactive-apps.md` (Schritt-für-Schritt-Katalog für genau diese vier Anforderungen)
- `node_modules/next/dist/docs/01-app/02-guides/authentication-with-cache-components.md`
- `node_modules/next/dist/docs/01-app/02-guides/adopting-partial-prefetching.md` und `optimizing-prefetching.md`

Zentrale Aussage für Emil: **`cookies()` bindet einen Prefetch nicht an eine URL.** Session-Inhalte landen deshalb im App Shell und sind schon *vor* dem Klick da — genau das, was eine durchweg angemeldete App braucht.

---

## Phase 0 — Messgrundlage (vor jeder Änderung)

Ohne Vorher-Wert lässt sich später nicht belegen, dass es besser wurde.

1. `mcp__vercel__get_web_analytics` für das Projekt: INP und LCP der Routen `/liste`, `/rezepte`, `/rezepte/[id]` festhalten.
2. `mcp__vercel__get_runtime_logs`: Server-Renderdauer derselben Routen notieren.
3. Auf dem iPhone in Safari (LAN-Origin ist in `next.config.ts:13` bereits freigegeben) eine Referenzaufnahme machen.

Die Zahlen kommen in `docs/plan-performance.md` (Memory-Regel: Pläne gehören ins Repo).

---

## Phase 1 — Fundament: Flags und Data Access Layer

### 1a. `next.config.ts`

```ts
cacheComponents: true,
partialPrefetching: true,
```

`allowedDevOrigins` bleibt unverändert.

> **Achtung, größtes Risiko des Umbaus:** Mit `cacheComponents` wird jedes `cookies()` außerhalb einer `<Suspense>`-Grenze zum Build-Fehler — in *allen* 12 Routen gleichzeitig, auch in den Auth-Seiten. Deshalb: sofort nach dem Flag in **jede** `page.tsx` ein `export const instant = false` setzen und es Route für Route wieder entfernen, sobald die Route umgebaut ist. So bleibt das Projekt durchgehend baubar.

### 1b. `requireHousehold` aufspalten — `src/lib/server/household.ts`

Hier liegt eine Falle, die den naiven Ansatz scheitern lässt: **`requireHousehold` gibt heute einen `SupabaseClient` zurück (`household.ts:18`). Ein Client ist nicht serialisierbar und kann keine Cache-Grenze überqueren.**

Aufteilen in zwei Funktionen:

```ts
// Nur serialisierbare Daten -> darf privat gecacht werden
export async function getHousehold(): Promise<Household> {
  'use cache: private'
  cacheLife({ stale: 300, revalidate: 60, expire: 900 })
  // redirect() wirft und wird deshalb nicht mitgecacht (siehe auth-Guide)
  ...
}
```

Der Supabase-Client bleibt ungecacht über `getServerSupabase()` (`src/lib/server/supabase.ts:13`) — das ist nur ein Cookie-Lesevorgang ohne Netzverkehr und damit billig.

`stale: 300` ist kein beliebiger Wert: **unter 5 Minuten fällt der Eintrag aus dem App Shell, unter 30 Sekunden ganz aus dem Prefetching.**

Erleichterung: `context.user` wird von **keiner** Seite benutzt (geprüft) — nur `supabase` und `household`. Das Feld entfällt ersatzlos und macht den Rückgabewert sauber serialisierbar.

### 1c. Die doppelten Auth-Roundtrips beseitigen

Schritte 1 und 2 der Latenztabelle sind zwei volle Netzrunden zum Auth-Server **pro Navigation**. `@supabase/auth-js` 2.116.0 bietet `getClaims()`, das die JWT-Signatur bei asymmetrischen Signing Keys lokal per WebCrypto prüft — ohne Netzrunde, und **sicherheitsgleichwertig** zu `getUser()` (im Gegensatz zu `getSession()`, das dem Cookie blind glaubt).

- `src/lib/server/session.ts:40`: `getUser()` → `getClaims()`
- `src/lib/server/supabase.ts:40`: dito

**Vorher zu prüfen** (sonst fällt `getClaims()` auf eine Netzrunde zurück und der Gewinn ist null): Nutzt das Projekt asymmetrische JWT Signing Keys? Über die Supabase-MCP-Tools bzw. das Dashboard verifizieren. Falls symmetrisch: auf asymmetrisch umstellen oder diesen Schritt streichen.

Zusätzlich den Proxy-Matcher (`src/proxy.ts:11`) prüfen — er läuft aktuell auch auf jedem RSC-Prefetch.

---

## Phase 2 — App Shell mit Tab-Leiste

Neue Route Group `src/app/(app)/` mit `layout.tsx`; `liste/`, `rezepte/`, `haushalt/`, `konto/` ziehen hinein. Die Auth-Seiten (`anmelden`, `registrieren`, `passwort-*`) bleiben außerhalb.

Das Layout enthält die fixe Tab-Leiste (Liste · Rezepte · Haushalt · Konto) und bleibt bei jedem Wechsel stehen — nur der Inhalt darunter wird neu gerendert.

Zwei Regeln aus dem Auth-Guide, die hier zählen:

- **Kein `await` auf die Session im Layout-Rumpf.** Das hielte `{children}` komplett hinter dem Request fest. Der Session-Zugriff gehört in eine Komponente innerhalb einer `<Suspense>`-Grenze.
- Die Tab-Leiste selbst ist statisch und landet damit im Shell.

Tab-Wechsel bekommt sofortiges Feedback über das `useOptimistic`-Muster aus `interactive-apps.md` Schritt 3: der angetippte Tab wird im Klick-Frame aktiv, der Inhaltsbereich dimmt über `data-pending` + `group-has-data-pending:opacity-50`, statt durch ein Skelett ersetzt zu werden.

`src/components/ui.tsx` `Screen` (Zeile 102) wird entsprechend entschlackt — Titel/Safe-Areas wandern teils ins Layout.

---

## Phase 3 — Suspense-Grenzen und Skeletons je Route

Muster für jede Route (aus `interactive-apps.md` Schritt 1): **Die `page.tsx` wird synchron** und gibt sofort die Hülle zurück; jeder Datenabschnitt wird in eine eigene async-Komponente hinter `<Suspense>` gezogen.

Konkret, mit bewusst unterschiedlicher Frische-Strategie:

**`/rezepte`** (`src/app/rezepte/page.tsx`) — verträgt Caching gut:
- Hülle (Import/Von-Hand-Knöpfe, `SearchBar`-Rahmen) statisch → App Shell
- Rezeptliste und Tags in `'use cache: private'` mit `cacheLife('minutes')`, hinter `<Suspense>` mit Zeilen-Skeleton
- `searchRecipes` + `listHouseholdTags` laufen bereits parallel (`page.tsx:25`) — beibehalten
- `getActiveListId` → `listPlannedRecipes` (`page.tsx:39-40`) sind sequentiell und blockieren die Liste: in eine **eigene** Suspense-Grenze, damit „auf der Liste (4)" nachstreamt statt die ganze Liste aufzuhalten

**`/liste`** (`src/app/liste/page.tsx`) — **bewusst nicht gecacht.** Eine 5 Minuten alte Einkaufsliste im Supermarkt ist genau der Fehler, den die App vermeiden soll. Stattdessen:
- Hülle („Etwas ergänzen"-Karte, Kategorieköpfe) in den App Shell
- `listEntries` bleibt ungecacht hinter `<Suspense>` und streamt frisch bei jeder Navigation
- `ListView` bringt mit `applyPendingToggles` (`ListView.tsx:232`) und dem Offline-Spiegel bereits eine eigene Frische-Schicht mit — die bleibt unangetastet

**`/rezepte/[id]`** (`src/app/rezepte/[id]/page.tsx`) — die schlimmste Kette (7 Roundtrips):
- `getRecipe` hinter Suspense #1 (Titel, Zutaten)
- `getActiveListId` + `listPlannedRecipes` hinter Suspense #2 (nur der Portionswähler-Zustand)
- `getRecipeImageUrl` hinter Suspense #3 mit `aspect-[4/3]`-Platzhalter — die signierte Storage-URL darf das Rezept nie aufhalten
- Diese Route liest `params`, also brauchen die Links aus `/rezepte` (`page.tsx:83`, `RowLink`) **`prefetch={true}`** für Per-Link-Prefetching

> Zu `prefetch={true}`: Das kostet eine Server-Invocation **pro sichtbarem Link**. Bei ~100 Rezepten in einer Liste ist das zu teuer. Deshalb entweder nur auf die ersten sichtbaren Einträge anwenden oder das in `optimizing-prefetching.md` beschriebene Hover-/Intent-Prefetching nutzen. Hier bewusst messen statt pauschal setzen.

Skeletons als eigene Exporte neben den Komponenten (`RecipeListSkeleton`, `ListSkeleton`), damit `instant()`-Tests sie greifen können.

---

## Phase 4 — Optimistic UI für alle Mutationen

Wichtig: Emil mutiert **nicht** über Server Actions, sondern direkt über den Browser-Supabase-Client. `refresh()` aus `next/cache` ist deshalb nicht anwendbar (nur in Server Actions erlaubt) — `router.refresh()` bleibt korrekt und gültig. Es wandert nur aus dem kritischen Pfad heraus, in eine Transition.

**`ListView.tsx` — Häkchen (`toggle`, Zeile 132):**
Die Funktion ist bereits optimistisch über `checkedNow` (Zeile 134), aber `router.refresh()` in Zeile 174 blockiert danach. Umbau auf `useOptimistic` + `startTransition`:
- `setCheckedNow`/`useState` → `useOptimistic` über `visibleEntries`; `useState`-Setter werden in einer Transition ohnehin aufgeschoben, `useOptimistic`-Setter greifen im aktuellen Frame
- Der Outbox-Puffer (`rememberToggle`, Zeile 147) und das Rollback-Verhalten bleiben **unverändert** — die Begründung in den Kommentaren Zeile 160-163 ist richtig und trägt die Fehlerresistenz bereits

**`ListView.tsx` — Zeile löschen / Abteilung ändern (`run`, Zeile 177):**
Heute: `setBusy(true)` → Server → `router.refresh()`. Das ist der klassische Einfrierer. Umbau auf das Muster aus `interactive-apps.md` Schritt 7: Zeile fadet im Klick-Frame auf 30 % Deckkraft und verschwindet, wenn der Server bestätigt. Bei Fehlschlag kommt sie zurück und `Notice` erklärt.

**`ListView.tsx` — von Hand ergänzen (`addByHand`, Zeile 190):**
Muster aus Schritt 4: `useOptimistic([])` für noch nicht bestätigte Einträge, Formular sofort per `formRef.current?.reset()` leeren (direkte DOM-Aufrufe greifen im aktuellen Frame, `useState` nicht).

**`RecipeActions.tsx` — „Auf die Liste" (Zeile 49) / „Runter" (Zeile 75):**
Heute `setBusy` → Server → `router.refresh()`. Auf `useOptimistic` umstellen: Der Knopf wechselt sofort in den Zustand „liegt auf der Liste (6)".

**`SearchBar.tsx`:**
- **Tag-Chips (Zeile 51):** lösen heute pro Tipp eine volle Server-Navigation aus. Bei der Größenordnung von Emil ist das reine Verschwendung — clientseitig über die bereits geladene Liste filtern, dann ist es instantan und ohne Netz.
- **Textsuche (Zeile 40):** bleibt serverseitig (Postgres-FTS über Zutaten lässt sich lokal nicht nachbilden), aber in `startTransition` mit `data-pending`-Dimming statt eingefrorener Liste. Die 300-ms-Entprellung bleibt.

**`RecipeForm.tsx` (Zeile 310):** `router.push` + `router.refresh` in eine Transition; der Speichern-Knopf zeigt über `useActionState` Pending/Fehler statt über manuelles `setBusy`.

---

## Phase 5 — Touch-Feedback (iOS)

`active:opacity-70` ist auf den meisten Elementen bereits vorhanden — das Fundament stimmt. Es fehlen die iOS-spezifischen Punkte:

**`src/app/globals.css`:**
```css
button, a, [role="button"], select {
  touch-action: manipulation;        /* kein Doppeltipp-Zoom-Delay */
  -webkit-tap-highlight-color: transparent;
  -webkit-touch-callout: none;       /* kein Langdruck-Menü auf Listenzeilen */
  cursor: pointer;                   /* iOS Safari wendet :active sonst unzuverlässig an */
}
```
Plus `user-select: none` gezielt auf die Tap-Flächen der Listenzeilen (`ListView.tsx:344`) — nicht global, der Rezepttext muss markierbar bleiben.

**`src/components/ui.tsx` `Button` (Zeile 64):** `transition-opacity` lässt den Aktiv-Zustand *einblenden* — genau die Trägheit, die weg soll. Beim Drücken ohne Übergang, beim Loslassen weich zurück:
```css
transition: opacity 120ms ease-out;
&:active { transition-duration: 0ms; }
```
Dazu `active:scale-[0.98]` als taktilere Rückmeldung.

**`RowLink` (`ui.tsx:177`):** zusätzlich `useLinkStatus()` aus `next/link` für den Fall, dass der Prefetch noch nicht fertig ist — dann zeigt die angetippte Zeile selbst einen Pending-Zustand, statt dass die ganze Seite stillsteht.

---

## Phase 6 — Verifikation

Rein lokale Checks reichen hier nicht; die Latenz ist real und muss auf dem Gerät gemessen werden.

1. **`npm run verify`** (typecheck + lint + depcruise + vitest) — die 1183 Zeilen Core-Tests müssen grün bleiben. Der Umbau fasst `src/lib/core/` nicht an; bleibt dort etwas rot, ist etwas schiefgegangen.
2. **Dev-Overlay:** `npm run dev`, dann jede Route aufrufen. Cache Components validiert in Entwicklung automatisch jede Page und meldet blockierende Navigationen mitsamt der schuldigen Komponente. Ziel: null Insights, ohne dass irgendwo noch `instant = false` steht.
3. **Navigation Inspector** (Next DevTools → „Pause on navigations"): für `/liste`, `/rezepte` und `/rezepte/[id]` je einmal Direktaufruf und Client-Navigation einfrieren und prüfen, was wirklich im Shell liegt. Beide Fälle liefern unterschiedliche Shells — beide ansehen.
4. **`instant()`-Tests** (`@next/playwright`, neu als devDependency) für die zwei wichtigen Navigationen: `/` → `/liste` und `/rezepte` → `/rezepte/[id]`. Diese Tests sind die Regressionsbremse; ohne sie schleicht sich die Latenz zurück.
5. **Auf dem iPhone**, gegen `npm run build && npm run start` über die LAN-Adresse, mit gedrosseltem Netz: Häkchen, Zeile löschen, Tab-Wechsel, Rezept öffnen. Kriterium ist nicht eine Zahl, sondern ob es sich wie eine App anfühlt.
6. **Nach dem Deploy:** `mcp__vercel__get_web_analytics` gegen die Phase-0-Werte halten. INP ist die Kennzahl, die „reagiert auf Klick" misst.

Der Service Worker (`public/sw.js`) braucht keine Änderung: er greift nur bei `request.mode === "navigate"`, RSC-Anfragen laufen unberührt durch.

---

## Reihenfolge und Risiko

| Phase | Nutzen | Risiko | Einzeln auslieferbar |
|---|---|---|---|
| 0 Messung | — | keins | — |
| 1 Flags + DAL | groß | **hoch** (app-weit) | ja, mit `instant = false` |
| 2 Tab-Leiste | groß (gefühlt) | mittel (Routen ziehen um) | ja |
| 3 Suspense | groß | gering, pro Route | ja, routenweise |
| 4 Optimistic | groß | gering | ja, pro Komponente |
| 5 Touch | klein, sofort spürbar | sehr gering | ja |

Phase 5 ist in einer halben Stunde erledigt und sofort auf dem Gerät spürbar — sinnvoll, sie **vorzuziehen**, um früh ein Erfolgserlebnis und einen Vergleichspunkt zu haben.

Phasen 1 und 2 sind der eigentliche Umbau und gehören in einen eigenen, gut getesteten Branch.

---

# Umsetzung — was tatsächlich passiert ist

Stand: 17.09.2026, Branch `perf/zero-latency`. Alle Phasen umgesetzt.

## Abweichungen vom Plan

**Phase 0 (Messgrundlage) ist ausgefallen.** Web Analytics ist für das Vercel-Projekt
(`prj_57JdQk1A43QqKMUWgFoA8D6dbuXb`) nicht eingeschaltet — es gibt also keine
Vorher-Werte für INP und LCP, und damit auch keinen ehrlichen Vorher-Nachher-Vergleich.
**Vor dem Deploy einschalten**, sonst ist der Effekt nicht belegbar.

**`getClaims()` wurde vorab geprüft und ist anwendbar.** Das JWKS des Projekts liefert
einen ES256-Schlüssel, die Signaturprüfung läuft also lokal per WebCrypto ohne Netzrunde.
Wäre das Projekt auf symmetrischem Signieren geblieben, hätte der Schritt nichts gebracht.

**Die Startseite `/` ist jetzt nur noch eine Weiche.** Mit der Tab-Leiste wäre ein eigener
Startbildschirm mit denselben vier Verweisen eine Sackgasse — wer von dort auf einen Tab
tippt, käme nie zurück. `/` leitet deshalb direkt auf `/liste` weiter. Das ist eine
Verhaltensänderung, die aus der Tab-Entscheidung folgt.

**`/haushalt/start` liegt außerhalb der Tab-Gruppe.** Dort würden die Tabs auf Screens
führen, die sofort wieder dorthin zurückleiten.

**Der Tag-Filter arbeitet jetzt im Browser, nicht auf dem Server.** `searchRecipes` bekommt
kein Schlagwort mehr übergeben; `RecipeBrowser` filtert über die schon geladenen
`recipe.tags` und zieht die Adresse per `history.replaceState` nach — ohne Navigation. Die
Volltextsuche bleibt serverseitig, weil sie über Titel *und* Zutaten geht und im Browser
nicht gleich aussähe.

**In `ListView` steht der vorgezogene Zustand in `useState`, nicht in `useOptimistic`.**
Grund: `router.refresh()` gibt kein Versprechen zurück. Eine Transition wäre zu Ende,
bevor die frischen Daten da sind — die abgehakte Zeile blitzte kurz wieder auf. Der
vorgezogene Stand fällt hier stattdessen erst beim Rendern, wenn `entries` wirklich neu
ist. In `RecipeActions` und der Tab-Leiste ist `useOptimistic` dagegen richtig, weil dort
kein solcher Übergabepunkt liegt.

**`busy` in `RecipeForm` bleibt.** Das ist keine Verlegenheitssperre, sondern verhindert,
dass ein zweites Antippen mitten in Rezept → Bild → Liste das Rezept doppelt anlegt.

## Ergebnis im Build

Vorher waren 15 von 20 Routen `ƒ` (bei jedem Aufruf komplett auf dem Server gerendert).
Jetzt sind alle Routen hinter der Tab-Leiste `◐` — statische Hülle plus nachströmender
Inhalt:

| Route | vorher | nachher |
|---|---|---|
| `/liste`, `/rezepte`, `/konto`, `/haushalt` | `ƒ` | `◐` |
| `/rezepte/[id]`, `/rezepte/[id]/bearbeiten` | `ƒ` | `◐` |
| `/rezepte/neu`, `/rezepte/importieren` | `ƒ` | `◐` |
| `/`, Anmeldung, Registrierung, Passwort | `ƒ` | `ƒ` (mit Absicht, siehe unten) |

Die verbliebenen `ƒ` tragen `instant = false` mit dauerhafter Begründung: sie entscheiden
über Weiterleitungen und werden einmal beim Start durchlaufen, nicht in der Schleife aus
Tippen und Warten.

Belegt am laufenden Produktionsbuild: `/liste` liefert nach 5 ms Überschrift, Tab-Leiste
und Skelett aus, die Sitzungsprüfung strömt danach nach.

## Was noch offen ist

1. **Web Analytics einschalten** und nach dem Deploy INP gegen die Vorher-Werte halten.
2. **`instant()`-Tests** (`@next/playwright`) für `/` → `/liste` und `/rezepte` →
   `/rezepte/[id]`. Ohne sie schleicht sich die Latenz mit der Zeit zurück.
3. **Auf dem iPhone prüfen**, gegen `npm run build && npm run start` über die LAN-Adresse
   mit gedrosseltem Netz. Nur dort zeigt sich, ob es sich wie eine App anfühlt.
4. **`prefetch` auf den Rezeptzeilen beobachten.** Das kostet eine Server-Runde pro
   sichtbarem Verweis. Bei der aktuellen Rezeptzahl der richtige Tausch — wenn die Liste
   deutlich wächst, auf Prefetch bei Berührungsabsicht umstellen.
5. **Die Icons der Tab-Leiste sind Emoji.** Ein Platzhalter, der funktioniert, aber auf
   Android anders aussieht als auf iOS.
