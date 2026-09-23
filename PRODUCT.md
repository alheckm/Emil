# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Mitglieder eines Haushalts (2 oder mehr Personen), die gemeinsam kochen und
einkaufen — auf mehreren Handys gleichzeitig. Emil ist bewusst so gebaut, dass
er für **beliebige Haushalte** funktioniert (Einladungscodes, Haushalt-Beitritt,
RLS-getrennte Daten je Haushalt), nicht nur für den Haushalt der Bauenden.

Zwei Situationen decken die meiste Nutzung ab:

- **In der Küche:** ein Rezept nachschlagen, Portionen anpassen, Zutaten auf
  die gemeinsame Einkaufsliste legen.
- **Im Supermarkt:** die Liste abhaken — oft ohne oder mit schlechtem Empfang,
  während ein zweites Haushaltsmitglied möglicherweise zeitgleich auf einem
  anderen Handy dieselbe Liste bearbeitet.

## Product Purpose

Rezepte aus Kochbuch, Webseite oder App an einem Ort sammeln, Portionen exakt
umrechnen (nicht nur linear skaliert, sondern mit korrekter Einheiten- und
Mengenlogik) und daraus eine Einkaufsliste erzeugen, die der ganze Haushalt in
Echtzeit teilt. Erfolg heißt: die Liste stimmt (keine doppelten oder falsch
zusammengerechneten Zutaten), sie lässt sich im Supermarkt auch offline
bedienen, und zwei Handys sehen zeitgleich denselben Stand.

## Positioning

Die Umrechnungs- und Zusammenführungslogik (Parser, Einheiten, Skalierung,
Merge) ist einmal in TypeScript implementiert, getestet (144 Tests) und
sowohl von der Oberfläche als auch von der Datenbank-Transaktion
(`add_recipe_to_list`) über fertig berechnete Werte genutzt — nie zweimal
implementiert, weil das unweigerlich auseinanderliefe und der Fehler erst im
Supermarkt auffiele. Dazu kommt echte Offline-Fähigkeit (IndexedDB-Spiegel,
Konfliktregel für gepufferte Häkchen) und Mehrgeräte-Realtime-Sync — nicht nur
„funktioniert meistens online". Kein API-Key, keine laufenden Kosten, keine KI-
Abhängigkeit im Betrieb. Als PWA vom Homescreen installiert misst sich Emil an
nativen iOS-Apps, nicht an Web-Konventionen.

## Operating Context

- **Küche** beim Kochen: Portionswähler, umgerechnete Zutaten, „Auf die
  Einkaufsliste".
- **Supermarkt** beim Einkaufen: Liste abhaken, oft offline; Häkchen-Puffer
  löst Konflikte, sobald wieder Netz da ist.
- **Rezept-Import** aus drei Quellen: Einfügen (JSON/Freitext), Webseiten-
  Import (`/rezepte/importieren`), iOS-Kurzbefehl aus dem Safari-Teilen-Menü
  direkt von einer Rezeptseite.
- **Mehrgeräte-Haushalt:** zwei oder mehr Handys greifen gleichzeitig auf
  denselben Haushalt zu (Realtime-Publikation auf `shopping_list_entries` und
  `shopping_list_sources`).
- Durchgängig deutschsprachige Oberfläche.

## Capabilities and Constraints

- **Backend:** Supabase (Postgres, RLS). Drei Schlüssel-Rollen; der Secret Key
  hat in der ganzen App genau einen Aufrufer (Konto löschen).
- **Auth:** nur E-Mail/Passwort (kein Google/Apple absichtlich), E-Mail-
  Bestätigung muss auf demselben Gerät geöffnet werden (PKCE).
- **Zutaten-Zuordnung:** `resolve_ingredient` matcht auf exakten Namen → Alias
  → Ähnlichkeit ab 0,85, sonst neue Zutat in „Sonstiges" — bewusst streng:
  lieber zwei getrennte Zeilen als eine falsch zusammengerechnete.
- **Listenlogik:** dasselbe Rezept erneut auflegen ersetzt seinen Anteil
  (verdoppelt nicht); ein geändertes Rezept muss neu aufgelegt werden; von
  Hand ergänzte Zeilen tragen `is_manual` und überleben Aufräum-Läufe.
- **Offline:** von Hand geschriebener Service Worker (kein Build-Plugin, da
  `@serwist/next` kein Turbopack unterstützt), nur in Produktion aktiv;
  `/api/` und Supabase werden nie zwischengespeichert.
- **Bekannte Lücke:** Bild einer importierten Webseite wird wegen CORS nicht
  übernommen — eigenes Foto lässt sich jederzeit setzen.
- **Kein Dark Mode, keine i18n** — ausschließlich Deutsch, ausschließlich
  Hell (Designentscheidung, siehe `DESIGN.md`).
- **Keine laufenden API-Kosten**, keine KI-Anbindung im Produktivbetrieb.

## Brand Commitments

Name „Emil". Deutschsprachiges Produkt. PWA mit eigenem iOS-Icon-Set
(`public/icons`), vom Homescreen installiert. Die visuelle Identität ist
bereits eigenständig dokumentiert und verbindlich in `DESIGN.md` (Farb-,
Typo- und Formtokens, aus dem gebauten Code abgeleitet) — dieses Dokument
ist bestehende Design-Autorität, nicht neu zu erfinden.

## Evidence on Hand

Bestehende, im Browser gegen `docs/app_redesign.jpg` geprüfte Oberfläche
(Stand 19.09.2026) — als Ist-Zustand zu behandeln, nicht als leere Fläche.
Supabase-Projekt seedet mit 12 Kategorien, 31 Einheiten, 350 Zutaten. Keine
Kundenstimmen, Fallstudien oder Presse vorhanden — nicht zutreffend, kein
kommerziell vermarktetes Produkt.

## Product Principles

1. Lieber zwei getrennte Zutatenzeilen als eine falsch zusammengerechnete —
   ein Fehler fällt sonst erst im Supermarkt auf.
2. Mengen- und Umrechnungslogik existiert genau einmal (TypeScript-Kern);
   Oberfläche und Datenbank nutzen fertig berechnete Werte.
3. Echtes Offline heißt: Gerät **und** Supabase beide unerreichbar — ein
   gestoppter lokaler Server ist kein Offline-Test.
4. Gebaut für beliebige Haushalte, nicht nur den eigenen — Einladungscode,
   Haushalt-Trennung per RLS.
5. Keine laufenden Kosten, keine Abhängigkeit von einer bezahlten API im
   Betrieb.

## Accessibility & Inclusion

Keine bekannten produktspezifischen Anforderungen. Standard-Bedienbarkeit
gilt (44 px Trefferfläche, 16 px Eingabetext, 15 px Fließtext — siehe
`DESIGN.md`, Abschnitt „Components").
