"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { startTransition, useOptimistic } from "react";
import { HomeIcon, BagIcon, ChecklistIcon } from "@/components/icons";
import { Avatar } from "@/components/ui";

/**
 * Die schwebende Glas-Leiste am unteren Rand (DESIGN.md, „Tabbar").
 *
 * Sie liegt im Layout und nicht in den Seiten, damit sie beim Wechsel stehen
 * bleibt: nur der Bereich darüber wird neu gerendert. Als `fixed` Element
 * außerhalb des normalen Flusses — der Inhalt darunter braucht deshalb
 * `pb-tabbar` (siehe `Screen` in `components/ui.tsx`), damit nichts unter der
 * Leiste verschwindet.
 *
 * Bauform nach DESIGN.md: 16 px Seitenabstand, 56 px hoch, `999px`-Pille,
 * Milchglas (`rgba(255,255,255,.72)` + `blur(24px) saturate(180%)` —
 * `saturate` ist Pflicht, sonst wirkt es milchig statt Glas). Genau vier
 * Ziele: Home, Einkaufsliste, Aufgaben, Konto. Konto zeigt den echten
 * Nutzer-Avatar, kein generisches Icon.
 *
 * Aktiv/inaktiv unterscheidet sich laut Entwurf **nicht** über die Iconfarbe
 * (die bleibt überall `--text`) — Signal ist ein runder Hintergrund
 * (`bg-tabbar-active`, siehe globals.css) hinter dem Icon (Instagram-Vorbild
 * statt Punkt darunter, 2026-09-24). Das erlaubt eine dünnere Leiste, weil
 * kein Platz mehr für einen Punkt unter dem Icon reserviert werden muss, und
 * der Konto-Kreis sitzt dadurch mittig statt nach oben verschoben.
 *
 * Der Kern gegen die gefühlte Trägheit ist `useOptimistic`: der angetippte Tab
 * wird im selben Frame aktiv, statt erst wenn der Server geantwortet hat.
 * Bis die neue Seite da ist, meldet `data-pending` nach oben, dass etwas läuft
 * — das Layout dimmt darüber nur den Inhalt und tauscht ihn nicht gegen ein
 * Skelett aus.
 */

const TABS = [
  { href: "/rezepte", label: "Home", Icon: HomeIcon },
  { href: "/liste", label: "Einkaufsliste", Icon: BagIcon },
  { href: "/todo", label: "Aufgaben", Icon: ChecklistIcon },
] as const;

type TabHref = (typeof TABS)[number]["href"] | "/einstellungen";

function Frame({
  active,
  pending,
  avatarInitial,
  avatarUrl,
  onSelect,
}: {
  active: TabHref | null;
  pending?: boolean;
  /** Erster Buchstabe des Klarnamens (oder der E-Mail-Adresse), sonst `null`. */
  avatarInitial?: string | null;
  avatarUrl?: string | null;
  onSelect?: (href: TabHref) => void;
}) {
  const kontoActive = active === "/einstellungen";

  return (
    <nav
      aria-label="Hauptbereiche"
      data-pending={pending ? "" : undefined}
      className="fixed inset-x-4 z-40 h-14 rounded-pill glass-bar"
      style={{ bottom: "max(16px, env(safe-area-inset-bottom))" }}
    >
      <ul className="flex h-full items-center justify-around px-1.5">
        {TABS.map(({ href, label, Icon }) => {
          const current = active === href;
          return (
            <li key={href}>
              <Link
                href={href}
                aria-label={label}
                aria-current={current ? "page" : undefined}
                onClick={() => onSelect?.(href)}
                className={
                  "flex h-11 w-11 items-center justify-center rounded-full press-flat tap-target " +
                  (current ? "bg-tabbar-active" : "")
                }
              >
                <Icon className="h-[22px] w-[22px] text-text" />
              </Link>
            </li>
          );
        })}
        <li>
          <Link
            href="/einstellungen"
            aria-label="Konto"
            aria-current={kontoActive ? "page" : undefined}
            onClick={() => onSelect?.("/einstellungen")}
            className={
              "flex h-11 w-11 items-center justify-center rounded-full press-flat tap-target " +
              (kontoActive ? "bg-tabbar-active" : "")
            }
          >
            <Avatar url={avatarUrl} initial={avatarInitial} size={26} />
          </Link>
        </li>
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
  return <Frame active={null} avatarInitial={null} />;
}

export function TabBar({
  avatarInitial,
  avatarUrl,
}: {
  avatarInitial: string | null;
  avatarUrl: string | null;
}) {
  const pathname = usePathname();

  // Welcher Tab gehört zur aktuellen Adresse? `/rezepte/17/bearbeiten` zählt
  // noch zu „Home“, `/einstellungen/konto` noch zu „Konto“ — sonst wäre beim
  // Blättern in eine Unterseite kein Tab aktiv.
  const current: TabHref | null =
    pathname === "/einstellungen" || pathname.startsWith("/einstellungen/")
      ? "/einstellungen"
      : (TABS.find(
          (tab) => pathname === tab.href || pathname.startsWith(`${tab.href}/`),
        )?.href ?? null);

  const [optimistic, setOptimistic] = useOptimistic(current);
  const [pending, setPending] = useOptimistic(false);

  return (
    <Frame
      active={optimistic}
      pending={pending}
      avatarInitial={avatarInitial}
      avatarUrl={avatarUrl}
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
