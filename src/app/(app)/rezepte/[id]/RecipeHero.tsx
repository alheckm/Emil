import Link from "next/link";
import { ChevronLeftIcon, PencilIcon } from "@/components/icons";

/**
 * Der Kopf des Rezept-Screens (DESIGN.md „Rezeptdetail"): ein randloses Foto
 * bis unter die Statusleiste, mit Milchglas-Knöpfen darauf — Zurück links,
 * Bearbeiten rechts. Kein Titel auf dem Foto: der steht darunter auf `--bg`
 * (`page.tsx`).
 *
 * Zwei Dinge, die hier nicht Geschmackssache sind:
 *
 * - **Kein „Merken"/Herz und kein „⋯"-Menü**, obwohl der Design-Canvas beides
 *   an dieser Stelle zeigt: Emil kennt keine Favoriten, und ein Überlauf-Menü
 *   ohne echten zweiten Eintrag wäre nur ein Knopf, der nichts Eigenes tut.
 *   Bearbeiten bleibt die einzige Aktion hier, wie schon vor diesem Redesign.
 * - **Das Bett unter dem Foto ist immer da.** Die signierte Bildadresse ist
 *   eine eigene Netzrunde, und ein Rezept muss auch ganz ohne Foto gut
 *   aussehen. Deshalb liegt unter dem Bild `bg-photo` (mit einem dezenten
 *   Besteck-Symbol), und wenn das Foto nachkommt, springt nichts.
 *
 * Radius 0 wie überall im Feed (DESIGN.md „Abstand & Form") — das Foto sitzt
 * eckig, randlos über die volle Breite.
 */
export function RecipeHero({
  recipeId,
  children,
}: {
  recipeId: string;
  /** Das Foto selbst — strömt hinter einer eigenen Suspense-Grenze nach. */
  children?: React.ReactNode;
}) {
  return (
    <div className="relative aspect-[393/420] w-full overflow-hidden bg-photo">
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 flex items-center justify-center text-white/50"
      >
        <UtensilsGlyph />
      </span>

      {children}

      <div
        className="absolute inset-x-0 top-0 flex items-start justify-between p-3"
        style={{ paddingTop: "max(12px, env(safe-area-inset-top))" }}
      >
        <HeroButton href="/rezepte" label="Zurück zu den Rezepten">
          <ChevronLeftIcon className="h-[18px] w-[18px]" strokeWidth={2.2} />
        </HeroButton>
        <HeroButton href={`/rezepte/${recipeId}/bearbeiten`} label="Rezept bearbeiten">
          <PencilIcon className="h-4 w-4" />
        </HeroButton>
      </div>
    </div>
  );
}

/** Dezentes Besteck-Symbol im Foto-Bett, solange kein Bild da ist. */
function UtensilsGlyph() {
  return (
    <svg
      width="56"
      height="56"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeOpacity="0.6"
      strokeWidth="1.2"
      aria-hidden
    >
      <path d="M6 3v6a3 3 0 0 0 3 3h0a3 3 0 0 0 3-3V3M9 12v9M17 3c-1.7 0-3 2-3 5s1.3 5 3 5V3zM17 13v8" />
    </svg>
  );
}

/**
 * Milchglas-Badge auf dem Foto: 36 px sichtbar, `rgba(21,22,26,.38)` mit
 * `backdrop-filter: blur(10px)`, 44 px Trefferfläche — sichtbare Größe und
 * Trefferfläche sind zwei verschiedene Maße.
 */
function HeroButton({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="flex h-11 w-11 items-center justify-center press tap-target focus-on-photo"
    >
      <span
        className="flex h-9 w-9 items-center justify-center rounded-full text-white backdrop-blur-[10px]"
        style={{ background: "rgba(21,22,26,0.38)" }}
      >
        {children}
      </span>
    </Link>
  );
}
