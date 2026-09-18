"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { startTransition, useOptimistic } from "react";

/**
 * Die feste Leiste am unteren Rand.
 *
 * Sie steht unten, weil die App einhändig und in Bewegung bedient wird — oben
 * käme der Daumen nicht hin. Und sie liegt im Layout und nicht in den Seiten,
 * damit sie beim Wechsel stehen bleibt: nur der Bereich darüber wird neu
 * gerendert.
 *
 * Der Kern gegen die gefühlte Trägheit ist `useOptimistic`: der angetippte Tab
 * wird im selben Frame aktiv, statt erst wenn der Server geantwortet hat.
 * Bis die neue Seite da ist, meldet `data-pending` nach oben, dass etwas läuft
 * — das Layout dimmt darüber nur den Inhalt und tauscht ihn nicht gegen ein
 * Skelett aus. Ein Tab-Wechsel, bei dem der halbe Bildschirm verschwindet,
 * fühlt sich langsamer an als einer, bei dem der alte Inhalt kurz blass wird.
 *
 * Nur noch zwei Einträge: Konto und Haushalt sind in die Einstellungen
 * gewandert. Tabs sind für Orte, an denen gearbeitet wird — nicht für
 * Konfiguration, die man dreimal im Jahr anfasst.
 */

/**
 * Die Symbole.
 *
 * Bewusst inline und nicht aus einer Bibliothek: es sind zwei Stück, und ein
 * Paket dafür wären ein paar hundert Kilobyte für zwei Pfade. Einfarbig über
 * `currentColor`, damit der aktive Zustand allein über die Textfarbe läuft und
 * das Symbol nie gegen sein Label verrutscht.
 *
 * 24er-Raster wie bei iOS-Symbolen, damit beide optisch gleich schwer wirken.
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

const TABS = [
  { href: "/liste", label: "Einkauf", Icon: BasketIcon },
  { href: "/rezepte", label: "Rezepte", Icon: BookIcon },
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
      className="sticky bottom-0 z-10 border-t border-border bg-bg/95 px-safe pb-safe backdrop-blur"
    >
      <ul className="mx-auto flex w-full max-w-md">
        {TABS.map((tab) => {
          const current = active === tab.href;
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                aria-current={current ? "page" : undefined}
                onClick={() => onSelect?.(tab.href)}
                className={
                  "flex min-h-14 flex-col items-center justify-center gap-0.5 " +
                  "pt-1.5 pb-1 text-[11px] font-medium press-flat tap-target " +
                  // Aktiv trägt allein die Farbe: Symbol und Wort werden
                  // zusammen dunkel. Vorher lag darunter ein farbiger Punkt —
                  // mit Symbolen wäre das ein drittes Element in 11 px Höhe.
                  (current ? "text-text" : "text-muted")
                }
              >
                <tab.Icon />
                {tab.label}
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
  // noch zu „Rezepte“, sonst wäre beim Blättern in ein Rezept kein Tab aktiv.
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
