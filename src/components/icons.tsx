/**
 * Die Symbole der App.
 *
 * Alle im 24er-Raster, alle als **Kontur** mit 1,75 px Strichstärke, keins
 * gefüllt. Das ist die Vorgabe aus dem Entwurf: dünn und zurückhaltend, damit
 * kein Symbol schwerer wiegt als der Text daneben. Die Form folgt Lucide —
 * aber inline und nicht als Paket.
 *
 * Warum kein `lucide-react`: es sind fünf Pfade. Ein Paket dafür wären ein
 * paar hundert Kilobyte Abhängigkeit, die im Supermarkt über Mobilfunk geladen
 * werden wollen, und die Tab-Leiste macht es aus demselben Grund schon so.
 *
 * `currentColor` und `aria-hidden` durchgängig: die Farbe kommt vom Elternteil,
 * nie aus dem Pfad, und die Bedeutung steht im
 * `aria-label` des Knopfes — ein Screenreader soll „Zurück" hören und nicht
 * „Grafik".
 */
import type { SVGProps } from "react";

function Icon({
  children,
  className = "h-5 w-5",
  ...props
}: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
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
    <Icon {...props}>
      <path d="m15 18-6-6 6-6" />
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
    <Icon {...props}>
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </Icon>
  );
}

export function MinusIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M5 12h14" />
    </Icon>
  );
}

export function CheckIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="m20 6-11 11-5-5" />
    </Icon>
  );
}
