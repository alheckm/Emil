/**
 * Die Symbole der App.
 *
 * Alle im 24er-Raster, alle als **Kontur**, keins gefüllt (DESIGN.md,
 * „Niemals": keine Emojis als Icons, ausschließlich Strich-SVGs). Die Pfade
 * kommen 1:1 aus dem Design-Canvas (Instagram-Baseline), damit App und Entwurf
 * exakt übereinstimmen — inline und nicht als Paket (`lucide-react` & Co.
 * wären ein paar hundert Kilobyte Abhängigkeit für eine Handvoll Pfade, die im
 * Supermarkt über Mobilfunk geladen werden wollen).
 *
 * `currentColor` und `aria-hidden` durchgängig: die Farbe kommt vom Elternteil,
 * nie aus dem Pfad, und die Bedeutung steht im `aria-label` des Knopfes — ein
 * Screenreader soll „Zurück" hören und nicht „Grafik".
 */
import type { SVGProps } from "react";

function Icon({
  children,
  className = "h-5 w-5",
  strokeWidth = 1.8,
  ...props
}: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
      {...props}
    >
      {children}
    </svg>
  );
}

export function ChevronLeftIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon strokeWidth={2.2} {...props}>
      <path d="M15 5l-7 7 7 7" />
    </Icon>
  );
}

export function ChevronRightIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon strokeWidth={2} {...props}>
      <path d="M9 6l6 6-6 6" />
    </Icon>
  );
}

export function PencilIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    </Icon>
  );
}

export function PlusIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon strokeWidth={2.2} {...props}>
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </Icon>
  );
}

export function MinusIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon strokeWidth={2.2} {...props}>
      <path d="M5 12h14" />
    </Icon>
  );
}

export function CheckIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon strokeWidth={3} {...props}>
      <path d="M5 13l4 4L19 7" />
    </Icon>
  );
}

export function CloseIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon strokeWidth={2} {...props}>
      <path d="M6 6l12 12" />
      <path d="M18 6 6 18" />
    </Icon>
  );
}

export function TrashIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M4 7h16" />
      <path d="M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13" />
      <path d="M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" />
    </Icon>
  );
}

/** Tabbar: Rezepte/Home. */
export function HomeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon strokeWidth={2} {...props}>
      <path d="M4 11l8-7 8 7" />
      <path d="M6 10v9a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-9" />
    </Icon>
  );
}

/** Tabbar: Einkaufsliste. */
export function BagIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon strokeWidth={2} {...props}>
      <path d="M5 8h14l-1.2 11a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8L5 8z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </Icon>
  );
}

/** Tabbar: Aufgaben. */
export function ChecklistIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon strokeWidth={2} {...props}>
      <rect x="6" y="4" width="12" height="17" rx="2" />
      <path d="M9 3.5h6v2H9z" />
      <path d="M9 12l2 2 4-4" />
    </Icon>
  );
}

export function SearchIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon strokeWidth={2} {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </Icon>
  );
}

export function ShareIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon strokeWidth={1.8} {...props}>
      <path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7" />
      <path d="M16 6l-4-4-4 4" />
      <path d="M12 2v14" />
    </Icon>
  );
}

/** „Weitere Optionen" — drei Punkte, waagerecht. */
export function MoreIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 6"
      fill="currentColor"
      aria-hidden
      className="h-1 w-4"
      {...props}
    >
      <circle cx="3" cy="3" r="2.4" />
      <circle cx="12" cy="3" r="2.4" />
      <circle cx="21" cy="3" r="2.4" />
    </svg>
  );
}

export function ClockIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </Icon>
  );
}

/** Home: Feed-Ansicht (Zeilen). */
export function RowsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon strokeWidth={2} {...props}>
      <rect x="4" y="4.5" width="16" height="4" rx="1.4" />
      <rect x="4" y="10" width="16" height="4" rx="1.4" />
      <rect x="4" y="15.5" width="16" height="4" rx="1.4" />
    </Icon>
  );
}

/** Home: Kachel-Ansicht (Raster). */
export function GridIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon strokeWidth={2} {...props}>
      <rect x="4" y="4" width="7" height="7" rx="1.3" />
      <rect x="13" y="4" width="7" height="7" rx="1.3" />
      <rect x="4" y="13" width="7" height="7" rx="1.3" />
      <rect x="13" y="13" width="7" height="7" rx="1.3" />
    </Icon>
  );
}

export function ImportIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon strokeWidth={1.8} {...props}>
      <rect x="3" y="3" width="18" height="18" rx="6" />
      <path d="M12 8v8M8 12h8" />
    </Icon>
  );
}

export function BookmarkIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon strokeWidth={2} {...props}>
      <path d="M6 4h12v16l-6-4-6 4V4z" />
    </Icon>
  );
}

export function FilterIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon strokeWidth={1.8} {...props}>
      <path d="M4 6h16M7 12h10M10 18h4" />
    </Icon>
  );
}

export function InfoIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon strokeWidth={1.8} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 16v-4M12 8h.01" />
    </Icon>
  );
}

export function AlertIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M12 9v4M12 17h.01" />
      <circle cx="12" cy="12" r="9" />
    </Icon>
  );
}
