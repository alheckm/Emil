# Konto-Seite neu, plus Wechsel zwischen Haushalten

## Context

Der Konto-Tab (`/einstellungen`) ist heute eine nackte Verteilerseite mit zwei
Textzeilen. Dahinter liegt `/einstellungen/konto` als Formular:

- die E-Mail als fetter Titel
- ein offenes Namensfeld
- eine graue Lösch-Karte
- Abmelden als Knopf

Formular, Gefahrenzone und Navigation stehen gleichrangig untereinander. Die
Seite wirkt deshalb wie ein Entwickler-Formular und nicht wie ein App-Profil.
Das Canvas-Artboard `Konto.dc.html` zeigt stattdessen **einen** ruhigen Screen:
Profilkopf mit „Bearbeiten", Abschnitt HAUSHALT mit Mitgliedern, Abschnitt
KONTO mit Zeilen, „Konto löschen" als rote Zeile und „Abmelden" als
Umriss-Pille. Übernommen wird davon nur die **Struktur**. Bei Details gilt
DESIGN.md, denn das Artboard ist teils veraltet (Tabbar mit Punkt, 64 px).

Außerdem ist geklärt: Rezepte, Einkaufsliste und Aufgaben hängen am Haushalt
(`household_id`), und eine Person kann über `household_members` schon heute in
mehreren Haushalten sein. Es fehlt nur die Wahl, welcher Haushalt gerade
**aktiv** ist. Heute ist das stillschweigend der zuletzt beigetretene
(`households[0]` in `loadHousehold()`), und wechseln kann man nur, indem man
die anderen verlässt. Damit verliert man aber deren Rezepte. Deshalb kommt ein
Wechsler dazu, wie der Account-Wechsler bei Instagram.

## Konzept (Wireframes, 393 px)

**`/einstellungen` – Konto-Tab**
```
Konto                                    ← Unbounded 20/700
(●64)  Mira                   Bearbeiten ← Unbounded 17/700 · 13/600-Link
       mira@beispiel.de                  ← 13 px inkSecondary
────────────────────────────────────────
HAUSHALT
[ WG Kastanienallee            ⌄ ]       ← Button, öffnet den Wechsler (Sheet)
(●32) Mira                          Du   ← Zeilen 52 px
(●32) Theo                           ›
(+ gestrichelt) Jemanden einladen    ›   → /einstellungen/haushalt
────────────────────────────────────────
KONTO
Passwort ändern                      ›   → /passwort-neu
Datenschutz                          ›   → /datenschutz
────────────────────────────────────────
Konto löschen                            ← signal-rot → /einstellungen/konto/loeschen
(       Abmelden        )                ← 48 px Umriss-Pille
```
Fehlt der Klarname, wird die E-Mail zum Titel. Darunter steht dann ein
Link „Namen hinzufügen", die E-Mail erscheint also nicht doppelt.

**Wechsler (Bottom-Sheet über dem Konto-Tab)**
```
      ───                                   Griff
Haushalt wechseln                           ← Unbounded 17/700
(W) WG Kastanienallee   Eigentümer:in   ✓   ← aktiv: Haken in accent
(E) Eltern              Mitglied
────────────────────────────────────────
Haushalt beitreten                   ›   → /einstellungen/haushalt (Code)
Neuen Haushalt anlegen               ›   → /haushalt/start
```
- Umgesetzt als natives `<dialog>` (`showModal()`, Fokusfalle und Esc
  gratis), das von unten hereinfährt: 200 ms `ease-out`, bei
  `prefers-reduced-motion` ohne Bewegung.
- Die Initialen-Kreise entstehen aus dem Haushaltsnamen (`Avatar` mit
  `initial`).
- Es gibt immer eine Kopfzeile. Ein ⌄ zeigt sie nur bei mehr als einem
  Haushalt. Bei genau einem Haushalt öffnet das Sheet trotzdem, damit man
  beitreten oder anlegen kann.

**`/einstellungen/konto` – „Profil bearbeiten"**: Avatar mit 96 px zentriert,
darunter „Foto ändern" und „Foto entfernen", Feld NAME (16 px, Radius
12–14), E-MAIL nur lesbar, schwarze Pille „Speichern".

**`/einstellungen/konto/loeschen`**: der bestehende LÖSCHEN-Ablauf
unverändert, nur ohne Karte.

**`/einstellungen/haushalt`**: bleibt die Seite für Einladen, Beitreten und
Verlassen, im neuen Zeilenstil. „Deine Haushalte" markiert den aktiven, und
„Verlassen" bleibt dort.

## Umsetzung

**Schritt 0.** Die schon vorhandene, uncommittete Arbeit wird als eigener
Commit gepusht: `profile.ts`, `(app)/layout.tsx`, `konto/*` und
`einstellungen/page.tsx` (getMyProfile, Foto entfernen). Nichts davon wird
zurückgedreht. `todo/TodoView.tsx` bleibt draußen, weil es fremde Arbeit ist.

### A. Aktiver Haushalt (Daten)

1. **`supabase/migrations/0026_aktiver_haushalt.sql`**
   - `alter table profiles add column active_household_id uuid references households (id) on delete set null;`
   - Die Policy `profiles_update` bekommt zusätzlich im `with check`:
     `active_household_id is null or active_household_id in (select current_household_ids())`.
   - Kommentarstil wie in `0024_profil.sql`.
   - Anwenden über den Supabase-MCP-Aufruf `apply_migration`, danach
     `get_advisors` für Sicherheit und Performance.
2. **`src/lib/data/profiles.ts`**: `setActiveHousehold(supabase, userId,
   householdId)` als Upsert auf `profiles`, im selben Result-Muster wie
   `setDisplayName`. `getProfile` liest die neue Spalte mit.
3. **`src/lib/server/household.ts` → `loadHousehold()`**:
   - Die Profilzeile wird mitgelesen.
   - Aktiv ist `households.find(h => h.id === active_household_id) ?? households[0]`.
   - Wer die Mitgliedschaft im aktiven Haushalt verloren hat, fällt so still
     auf den Rückfall zurück. Für alle mit nur einem Haushalt ändert sich
     nichts.
   - Den Kommentar zu `listHouseholds` passe ich an („neueste zuerst" ist
     jetzt nur noch der Rückfall).
4. **Wechseln** im Client: `setActiveHousehold` und danach `router.refresh()`,
   dasselbe Muster wie `HouseholdsList.leave`. `use cache: private` wird
   serverseitig nicht über Anfragen hinweg gehalten (siehe
   `node_modules/next/dist/docs/01-app/03-api-reference/01-directives/use-cache-private.md`),
   der Refresh lädt also neu. Das prüfe ich in der Verifikation auf allen vier
   Tabs, weil der Client-Router-Cache (stale 300) sonst alte Tabs zeigen
   könnte.
5. **`/beitreten/[code]`** (`page.tsx`, `JoinHousehold.tsx`):
   - Nach dem Einlösen wird `setActiveHousehold(neuer Haushalt)` gesetzt.
     Kommt die ID nicht aus `redeemInvite` zurück, wird sie per
     `listHouseholds` ermittelt.
   - Der Hinweistext lautet neu: „Dein bisheriger Haushalt bleibt, du kannst
     unter Konto jederzeit wechseln."
   - Die Weiterleitung geht immer auf `/liste`. Das Gleiche gilt für
     `JoinByCode.tsx`.
   - `/haushalt/start` (Haushalt anlegen) macht den neuen Haushalt ebenfalls
     zum aktiven.

### B. Konto-Redesign (Oberfläche)

Zuerst lese ich `node_modules/next/dist/docs/` zu `use cache: private`,
Suspense und `instant`, weil der Hub jetzt Daten lädt.

6. **`src/components/ui.tsx`**: neue Bausteine `SettingsRow` (52 px,
   optionaler führender Slot, Label, Zusatz rechts, Chevron in `inactive`,
   Variante `danger` ohne Chevron) und `SectionEyebrow`. Das Eyebrow-`<h2>`
   ist heute auf der Haushalt-Seite dupliziert und nutzt künftig ebenfalls die
   Komponente. `RowLink` bleibt.
7. **`einstellungen/page.tsx`**:
   - Der statische Rahmen enthält die Überschriften, die Konto-Zeilen,
     „Konto löschen" und „Abmelden".
   - Drei Suspense-Grenzen:
     - `ProfileHeader` über `getMyProfile()` und `getCurrentUser()`
     - `HouseholdSwitcher` über `requireHousehold()` und `listHouseholds()`
     - `MemberRows` über `listMembersWithProfiles()`
   - Die Fallbacks sind höhengleich und statisch, kein Puls. Den Kommentar
     „vollständig statisch" passe ich an.
8. **`einstellungen/HouseholdSwitcher.tsx`** (Client): Kopfzeilen-Button und
   `<dialog>`-Sheet wie oben. Fehler zeigt `Notice` im Sheet.
9. **`AccountActions.tsx` wird aufgeteilt** in `SignOutButton.tsx` (Hub) und
   `konto/loeschen/DeleteAccount.tsx` samt neuer `page.tsx`. Der
   LÖSCHEN-Schutz und sein Begründungskommentar bleiben erhalten.
10. **`konto/page.tsx` und `AccountProfile.tsx`** werden zu „Profil
    bearbeiten" nach dem Wireframe. Die Logik bleibt, und
    `AccountProfileFallback` wird exakt nachgebaut.
11. **`/passwort-neu`**: Für Angemeldete kommt ein Zurück-Link aufs Konto
    dazu. Den Text prüfe ich auf die reinen Mail-Formulierungen.
12. **`haushalt/HouseholdsList.tsx` und `haushalt/page.tsx`**: Die Karten
    werden zu Zeilen, der aktive Haushalt bekommt „Aktiv" statt „wird gerade
    angezeigt". Die Erklärtexte werden auf das Wechseln umgeschrieben statt
    auf „verlassen, falls nicht gebraucht".
13. **Links**: `datenschutz/page.tsx:94` zeigt künftig auf
    `/einstellungen/konto/loeschen`.

### C. Dokumentation und Abschluss

14. **`DESIGN.md`**:
    - Abschnitt „Konto" mit Struktur, `SettingsRow`, `SectionEyebrow` und dem
      Wechsler-Sheet.
    - Die Abweichungen vom Canvas: keine „Benachrichtigungen", zusätzlich
      Datenschutz, Löschen als Unterseite, Haushalts-Wechsler.
15. **Plan**: nach `docs/plan-konto.md` kopieren, dann nach jedem Block (A, B,
    C) committen und direkt nach `main` pushen.
16. Das Canvas-Artboard fasse ich nicht an. Am Ende biete ich an, es
    anzugleichen.

## Verifikation

- `npx tsc --noEmit`, `npm run lint`, `npm run build`, dabei auf Meldungen
  von `instant` achten.
- Supabase: Die Migration ist angewendet, `get_advisors` meldet nichts
  Neues. Per SQL prüfen, dass ein Update auf einen fremden Haushalt als
  `active_household_id` an der Policy scheitert.
- Dev-Server, Chrome auf 393 px, mit einem Testkonto in zwei Haushalten:
  - Nach dem Wechsel im Sheet zeigen Home, Liste, Aufgaben und Konto den
    neuen Haushalt, auch nach einem Tab-Wechsel und nach einem Neuladen.
  - Nach dem Zurückwechseln stimmt wieder alles.
  - Verlässt man den aktiven Haushalt, landet man ohne Fehler im
    verbleibenden.
  - Beitreten per Code macht den neuen Haushalt aktiv, der alte bleibt in
    der Liste.
- Bei der Konto-Seite prüfen:
  - Kein Layoutsprung beim Laden.
  - Ansicht mit und ohne Namen und Foto.
  - Name speichern und Foto ändern bzw. entfernen, danach zeigen Tabbar und
    Hub-Kopf den neuen Stand.
  - Der Löschen-Knopf wird erst nach „LÖSCHEN" aktiv. Nicht wirklich löschen.
  - Abmelden führt nach `/anmelden`.
- Grenzen: Trefferflächen ≥ 44 px, Eingabefelder mit 16 px, das Sheet mit
  `prefers-reduced-motion`, Esc und Tippen außerhalb schließen es.
