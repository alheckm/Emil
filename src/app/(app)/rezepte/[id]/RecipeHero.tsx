import Link from "next/link";
import { ChevronLeftIcon, PencilIcon } from "@/components/icons";

/**
 * Der obere Teil des Rezept-Screens: Foto und zwei quadratische Knöpfe —
 * sonst nichts. Titel und Kenndaten stehen darunter auf `--bg` (`page.tsx`).
 *
 * Zwei Dinge, die hier nicht Geschmackssache sind:
 *
 * - **Kein Titel auf dem Foto, kein Schleier.** Der Titel steht immer
 *   darunter, nie darüber (DESIGN.md, „Don't ... einem Foto einen Rahmen
 *   geben" gilt sinngemäß auch für Text: das Foto trägt nur seine zwei
 *   Icon-Badges, sonst nichts).
 * - **Das Bett unter dem Foto ist immer da.** Die signierte Bildadresse ist
 *   eine eigene Netzrunde, und ein Rezept muss auch ganz ohne Foto gut
 *   aussehen. Deshalb liegt unter dem Bild `bg-photo` (= `--soft`) — und wenn
 *   das Foto nachkommt, springt nichts.
 *
 * Radius 0 wie überall in der Richtung — `rounded-card` löst über die Tokens
 * in `globals.css` auf 0px auf, das Foto sitzt also eckig, nicht gerundet.
 *
 * Oben rechts steht bewusst **kein Herz**: Emil kennt keine Favoriten, und ein
 * Knopf, der nichts tut, ist schlimmer als keiner. An derselben Stelle sitzt
 * stattdessen der Weg zum Bearbeiten — in `--accent`, weil Bearbeiten eine
 * Aktion ist und Zurück reine Navigation bleibt.
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
    <div className="px-5 pt-safe">
      {/* 4:3, mit demselben Seitenrand wie der restliche Inhalt (`px-safe`)
          — läuft nicht unter die Statusleiste. */}
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-card bg-photo">
        {children}

        {/* p-3 statt p-4: die Trefferflaeche ist 44 px, das sichtbare Badge
            36 px — die 4 px Luft ringsum fehlen dem Abstand, sonst saesse es
            4 px zu weit innen. So stehen 16 px zwischen Fotorand und
            sichtbarem Badge. */}
        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
          <HeroButton href="/rezepte" label="Zurück zu den Rezepten">
            <ChevronLeftIcon />
          </HeroButton>
          <HeroButton
            href={`/rezepte/${recipeId}/bearbeiten`}
            label="Rezept bearbeiten"
            accent
          >
            {/* Einen Tick kleiner: ein Stift füllt sein Quadrat diagonal aus
                und wirkt neben dem Pfeil sonst deutlich schwerer. */}
            <PencilIcon className="h-[17px] w-[17px]" />
          </HeroButton>
        </div>
      </div>
    </div>
  );
}

/**
 * Eines der beiden quadratischen Icon-Badges auf dem Foto (Radius 0 wie
 * überall in der Richtung — `rounded-pill` löst auf 0px auf).
 *
 * Zurück bleibt Milchglas: 36 px sichtbar, `rgba(255,255,255,.72)` mit
 * `backdrop-filter: blur(8px)`, dunkles Symbol — reine Navigation, keine
 * Aktion. Bearbeiten ist eine Aktion und bekommt `--accent` gefüllt (Navy,
 * kein separater Markenton mehr), helles Symbol (`--accent-ink`). Die
 * Trefferfläche ist in beiden Fällen 44 px, deutlich größer als das
 * sichtbare Badge.
 */
function HeroButton({
  href,
  label,
  accent,
  children,
}: {
  href: string;
  label: string;
  accent?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="flex h-11 w-11 items-center justify-center press tap-target focus-on-photo"
    >
      <span
        className={
          "flex h-9 w-9 items-center justify-center rounded-pill " +
          (accent
            ? "bg-accent text-accent-ink"
            : "bg-white/70 text-text backdrop-blur-[8px]")
        }
      >
        {children}
      </span>
    </Link>
  );
}
