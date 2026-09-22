"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { startTransition, useOptimistic } from "react";

/**
 * Die freistehende Leiste am unteren Rand.
 *
 * Sie steht unten, weil die App einhändig und in Bewegung bedient wird — oben
 * käme der Daumen nicht hin. Und sie liegt im Layout und nicht in den Seiten,
 * damit sie beim Wechsel stehen bleibt: nur der Bereich darüber wird neu
 * gerendert.
 *
 * Bauform nach docs/app_redesign.jpg (design-system.md, Abschnitt 7): keine
 * bildschirmbreite, sticky Leiste mit Haarlinie mehr, sondern eine
 * freistehende, vollgerundete Fläche (`--card` mit `--shadow-card`), mit
 * sichtbarem `--bg`-Rand ringsum. Alle vier Einträge sind gleich breit
 * (`flex-1`) und zeigen **nur ihr Symbol, kein Label** — auf Wunsch, siehe
 * design-system.md Abschnitt 7 für die Abgrenzung zum früher verbotenen
 * Fall (Label nur beim aktiven Eintrag plus wachsende Spaltenbreite): hier
 * ändert sich die Spaltenbreite nie, also kann auch nichts springen. Der
 * aktive Eintrag bekommt eine helle `--well`-Sitzfläche (44 px, mittig in der
 * Spalte statt über deren volle Breite — die volle Breite ergab nur mit
 * Label einen Sinn) und darin ein eigenes, dunkles Icon-Badge. Der inaktive
 * Eintrag zeigt sein Symbol in `--icon-muted` — heller als `--muted`, weil er
 * auf `--card` steht, nicht auf `--bg`. Ohne sichtbaren Text trägt `aria-label`
 * je Eintrag den Namen für Screenreader.
 *
 * Der Kern gegen die gefühlte Trägheit ist `useOptimistic`: der angetippte Tab
 * wird im selben Frame aktiv, statt erst wenn der Server geantwortet hat.
 * Bis die neue Seite da ist, meldet `data-pending` nach oben, dass etwas läuft
 * — das Layout dimmt darüber nur den Inhalt und tauscht ihn nicht gegen ein
 * Skelett aus. Ein Tab-Wechsel, bei dem der halbe Bildschirm verschwindet,
 * fühlt sich langsamer an als einer, bei dem der alte Inhalt kurz blass wird.
 *
 * Vier Einträge: Einkauf, Rezepte, Todo — und Konto/Haushalt, das vorher als
 * runder Knopf oben rechts auf den beiden Haupt-Tabs saß. Zusammengelegt in
 * die Tab-Leiste, auf Wunsch, statt an zwei Stellen (Kopfzeile und Leiste)
 * nach Navigation zu suchen.
 */

/**
 * Die Symbole.
 *
 * Bewusst inline und nicht aus einer Bibliothek: es sind vier Stück, und ein
 * Paket dafür wären ein paar hundert Kilobyte für vier Pfade. Einfarbig über
 * `currentColor`, damit der aktive Zustand allein über Textfarbe und
 * Sitzfläche läuft, nie über eine zweite Symbolvariante.
 *
 * 24er-Raster wie bei iOS-Symbolen, damit alle vier optisch gleich schwer
 * wirken.
 */
function BasketIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden>
      <path
        fill="currentColor"
        d="M4.6 8.4h14.8l.85 11.6a1.6 1.6 0 0 1-1.6 1.7H5.35a1.6 1.6 0 0 1-1.6-1.7L4.6 8.4Z"
      />
      {/* Der Henkel als Kontur — als Fläche wäre der Beutel ein Klumpen. */}
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        d="M8.6 8.9V6.6a3.4 3.4 0 0 1 6.8 0v2.3"
      />
    </svg>
  );
}

function BookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden>
      {/* Zwei Hälften mit Spalt dazwischen: als ein Pfad wäre es ein Rechteck
          und kein aufgeschlagenes Buch. */}
      <path
        fill="currentColor"
        d="M11.2 6.9C9.7 5.7 7.9 5.1 5.9 5.1H3.6a.85.85 0 0 0-.85.85v11.5c0 .47.38.85.85.85h2.3c2 0 3.8.6 5.3 1.8V6.9Z"
      />
      <path
        fill="currentColor"
        d="M12.8 6.9c1.5-1.2 3.3-1.8 5.3-1.8h2.3c.47 0 .85.38.85.85v11.5a.85.85 0 0 1-.85.85h-2.3c-2 0-3.8.6-5.3 1.8V6.9Z"
      />
    </svg>
  );
}

/**
 * Zwei Häkchen-Zeilen — gefüllt wie Korb und Buch, keine Kontur (Abschnitt 8:
 * Tab-Symbole sind die eine Ausnahme von der sonst konturierten Symbolsprache,
 * eine dünne Linie wirkt bei 24 px in der Leiste zerbrechlich).
 */
function ChecklistIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden>
      <path
        fill="currentColor"
        d="M4.4 6.4a1.6 1.6 0 1 1 3.2 0 1.6 1.6 0 0 1-3.2 0Zm5.4-1.1a1 1 0 0 1 1-1h8.8a1 1 0 1 1 0 2h-8.8a1 1 0 0 1-1-1Z"
      />
      <path
        fill="currentColor"
        d="M4.4 12a1.6 1.6 0 1 1 3.2 0 1.6 1.6 0 0 1-3.2 0Zm5.4-1.1a1 1 0 0 1 1-1h8.8a1 1 0 1 1 0 2h-8.8a1 1 0 0 1-1-1Z"
      />
      <path
        fill="currentColor"
        d="M4.4 17.6a1.6 1.6 0 1 1 3.2 0 1.6 1.6 0 0 1-3.2 0Zm5.4-1.1a1 1 0 0 1 1-1h8.8a1 1 0 1 1 0 2h-8.8a1 1 0 0 1-1-1Z"
      />
    </svg>
  );
}

/** Kopf und Schultern — derselbe Weg wie vorher im Knopf oben rechts. */
function PersonIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden>
      <path
        fill="currentColor"
        d="M12 12.4a4.2 4.2 0 1 0 0-8.4 4.2 4.2 0 0 0 0 8.4Z"
      />
      <path
        fill="currentColor"
        d="M12 14.1c-3.9 0-7.1 2.2-7.1 4.9 0 .6.5 1 1.1 1h12c.6 0 1.1-.4 1.1-1 0-2.7-3.2-4.9-7.1-4.9Z"
      />
    </svg>
  );
}

const TABS = [
  { href: "/liste", label: "Einkauf", Icon: BasketIcon },
  { href: "/rezepte", label: "Rezepte", Icon: BookIcon },
  { href: "/todo", label: "Todo", Icon: ChecklistIcon },
  { href: "/einstellungen", label: "Konto", Icon: PersonIcon },
] as const;

type TabHref = (typeof TABS)[number]["href"];

function Frame({
  active,
  pending,
  onSelect,
}: {
  active: TabHref | null;
  pending?: boolean;
  onSelect?: (href: TabHref) => void;
}) {
  return (
    <nav
      aria-label="Hauptbereiche"
      data-pending={pending ? "" : undefined}
      className="sticky bottom-0 z-10 px-safe pb-safe"
    >
      <ul className="mx-auto mb-3 flex w-full max-w-md items-center gap-1 rounded-pill bg-card p-1.5 shadow-card">
        {TABS.map((tab) => {
          const current = active === tab.href;
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                aria-current={current ? "page" : undefined}
                aria-label={tab.label}
                onClick={() => onSelect?.(tab.href)}
                className={
                  // Jede Spalte gleich breit, immer — nur Farbe/Sitzfläche
                  // wechseln mit dem aktiven Zustand, nie die Größe, sonst
                  // springt das Symbol beim Tab-Wechsel zur Seite.
                  "flex min-h-11 w-full items-center justify-center press-flat tap-target " +
                  (current ? "text-text" : "text-icon-muted")
                }
              >
                <span
                  className={
                    "flex h-11 w-11 items-center justify-center rounded-pill " +
                    (current ? "bg-well" : "")
                  }
                >
                  <span
                    className={
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-pill " +
                      (current ? "bg-text text-card" : "")
                    }
                  >
                    <tab.Icon />
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/**
 * Was im statischen Rahmen steht, solange die Adresse noch nicht bekannt ist.
 *
 * `usePathname()` sind URL-Daten: beim Vorausrendern gibt es sie noch nicht,
 * deshalb hängt die eigentliche Leiste hinter einer Suspense-Grenze. Wichtig
 * ist, dass hier dieselbe Leiste steht — nur ohne Hervorhebung. Die Maße
 * stimmen damit von der ersten Millisekunde an, und nichts springt, wenn die
 * Markierung nachträglich erscheint.
 */
export function TabBarFallback() {
  return <Frame active={null} />;
}

export function TabBar() {
  const pathname = usePathname();

  // Welcher Tab gehört zur aktuellen Adresse? `/rezepte/17/bearbeiten` zählt
  // noch zu „Rezepte“, `/einstellungen/konto` noch zu „Konto“ — sonst wäre
  // beim Blättern in eine Unterseite kein Tab aktiv.
  const current =
    TABS.find(
      (tab) => pathname === tab.href || pathname.startsWith(`${tab.href}/`),
    )?.href ?? null;

  const [optimistic, setOptimistic] = useOptimistic(current);
  const [pending, setPending] = useOptimistic(false);

  return (
    <Frame
      active={optimistic}
      pending={pending}
      onSelect={(href) => {
        // Der Wechsel selbst läuft über den Link; hier wird nur die Anzeige
        // vorgezogen. `useOptimistic`-Setter greifen im aktuellen Frame,
        // `useState`-Setter würden in der Transition aufgeschoben — genau der
        // Unterschied, um den es hier geht.
        startTransition(() => {
          setOptimistic(href);
          setPending(true);
        });
      }}
    />
  );
}
