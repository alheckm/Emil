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
 */
const TABS = [
  { href: "/liste", label: "Liste" },
  { href: "/rezepte", label: "Rezepte" },
  { href: "/haushalt", label: "Haushalt" },
  { href: "/konto", label: "Konto" },
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
      className="sticky bottom-0 z-10 border-t border-border bg-surface/95 px-safe pb-safe backdrop-blur"
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
                  "flex min-h-14 flex-col items-center justify-center gap-1 " +
                  "text-[11px] font-medium press-flat tap-target " +
                  (current ? "text-text" : "text-muted")
                }
              >
                {/* Der aktive Tab bekommt die helle Koralle als Punkt statt
                    eingefärbter Schrift. Ein farbiges Wort in 11 px ist auf
                    Creme schlechter zu lesen als ein schwarzes — die Marke
                    trägt hier die Form, nicht die Schriftfarbe. */}
                <span
                  aria-hidden
                  className={
                    "h-1.5 w-1.5 rounded-pill transition-colors " +
                    (current ? "bg-brand" : "bg-transparent")
                  }
                />
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
