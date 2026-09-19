import Link from "next/link";
import { ChevronLeftIcon, PencilIcon } from "@/components/icons";

/**
 * Der obere Teil des Rezept-Screens: Foto und zwei runde Knöpfe — sonst
 * nichts. Titel und Kenndaten stehen darunter auf `--bg` (`page.tsx`).
 *
 * Drei Dinge, die hier nicht Geschmackssache sind:
 *
 * - **Kein Titel auf dem Foto, kein Schleier.** Die Referenz
 *   (docs/app_redesign.jpg) legt den Titel in beiden Screens unter bzw. neben
 *   das Foto, nie darüber — design-system.md, Abschnitt 4, Regel 5.
 * - **Das Foto ist eingerückt und gerundet, nicht randlos.** Zweiter
 *   Screenshot der Referenz: das Foto sitzt mit demselben Seitenrand wie der
 *   restliche Inhalt (`px-safe`) und großzügig gerundeten Ecken
 *   (`--radius-card`) — läuft nicht unter die Statusleiste. Das war beim
 *   ersten Durchgang falsch übertragen (vom alten, randlosen System
 *   übernommen, ohne die neue Referenz an dieser Stelle noch einmal zu
 *   prüfen).
 * - **Das Bett unter dem Foto ist immer da.** Die signierte Bildadresse ist
 *   eine eigene Netzrunde, und ein Rezept muss auch ganz ohne Foto gut
 *   aussehen. Deshalb liegt unter dem Bild `bg-photo` (= `--soft`) — und wenn
 *   das Foto nachkommt, springt nichts.
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
      {/* 4:3 (design-system.md, Abschnitt 7): an beiden Screens der Referenz
          gemessen. Gerundet und eingerückt wie im zweiten Screenshot, nicht
          randlos. */}
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-card bg-photo">
        {children}

        {/* p-3 statt p-4: die Trefferflaeche ist 44 px, der sichtbare Kreis
            36 px — die 4 px Luft ringsum fehlen dem Abstand, sonst saesse der
            Kreis 4 px zu weit innen. So stehen 16 px zwischen Fotorand und
            sichtbarem Kreis, wie im Entwurf. */}
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
 * Einer der beiden runden Knöpfe auf dem Foto.
 *
 * Zurück bleibt Milchglas wie im Entwurf: 36 px sichtbar,
 * `rgba(255,255,255,.72)` mit `backdrop-filter: blur(8px)`, dunkles Symbol —
 * reine Navigation, keine Aktion. Bearbeiten ist eine Aktion und bekommt
 * `--accent` gefüllt, dunkles Symbol (`--accent-ink`) — dieselbe Rolle wie
 * die gold gefüllten Kontakt-Icons auf dem Foto der Referenz. Die
 * Trefferfläche ist in beiden Fällen 44 px, deutlich größer als der Kreis
 * (Design-System, Abschnitt 6).
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
