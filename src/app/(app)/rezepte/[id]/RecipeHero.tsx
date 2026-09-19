import Link from "next/link";
import { ChevronLeftIcon, PencilIcon } from "@/components/icons";

/**
 * Der obere Teil des Rezept-Screens: Foto und zwei runde Knöpfe — sonst
 * nichts. Titel und Kenndaten stehen darunter auf `--bg` (`page.tsx`).
 *
 * Zwei Dinge, die hier nicht Geschmackssache sind:
 *
 * - **Kein Titel auf dem Foto, kein Schleier.** Die Referenz
 *   (docs/app_redesign.jpg) legt den Titel in beiden Screens unter bzw. neben
 *   das Foto, nie darüber — design-system.md, Abschnitt 4, Regel 5. Das
 *   macht den Scrim überflüssig, der vorher nötig war, um weißen Text auf
 *   einem hellen Nutzerfoto lesbar zu halten.
 * - **Das Bett unter dem Foto ist immer da.** Die signierte Bildadresse ist
 *   eine eigene Netzrunde, und ein Rezept muss auch ganz ohne Foto gut
 *   aussehen. Deshalb liegt unter dem Bild `bg-photo` (= `--soft`) — und wenn
 *   das Foto nachkommt, springt nichts.
 *
 * Oben rechts steht bewusst **kein Herz**: Emil kennt keine Favoriten, und ein
 * Knopf, der nichts tut, ist schlimmer als keiner. An derselben Stelle, in
 * derselben Form, sitzt stattdessen der Weg zum Bearbeiten — die einzige
 * Aktion, die auf diesem Screen sonst nirgends hingehört.
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
    /* 4:3 statt 9:10 (design-system.md, Abschnitt 7): an beiden Screens der
       Referenz gemessen, unabhängig von der tatsächlichen Gerätehöhe. Volle
       Bildschirmbreite, keine Rundung, kein Rahmen: läuft bis an die
       Gerätekanten und unter die Statusleiste. */
    <div className="relative aspect-[4/3] w-full overflow-hidden bg-photo">
      {children}

      {/* p-3 statt p-4: die Trefferflaeche ist 44 px, der sichtbare Kreis
          36 px — die 4 px Luft ringsum fehlen dem Abstand, sonst saesse der
          Kreis 4 px zu weit innen. So stehen 16 px zwischen Fotorand und
          sichtbarem Kreis, wie im Entwurf.

          `pt-safe` kommt dazu, seit das Foto bis an den oberen Bildschirmrand
          laeuft: ohne den Inset saessen die beiden Kreise auf einem iPhone
          hinter der Uhr. */}
      <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3 pt-safe">
        <HeroButton href="/rezepte" label="Zurück zu den Rezepten">
          <ChevronLeftIcon />
        </HeroButton>
        <HeroButton
          href={`/rezepte/${recipeId}/bearbeiten`}
          label="Rezept bearbeiten"
        >
          {/* Einen Tick kleiner: ein Stift füllt sein Quadrat diagonal aus und
              wirkt neben dem Pfeil sonst deutlich schwerer. */}
          <PencilIcon className="h-[17px] w-[17px]" />
        </HeroButton>
      </div>
    </div>
  );
}

/**
 * Einer der beiden runden Knöpfe auf dem Foto.
 *
 * Milchglas wie im Entwurf: 36 px sichtbar, `rgba(255,255,255,.72)` mit
 * `backdrop-filter: blur(8px)`. Die Trefferfläche ist mit 44 px deutlich
 * größer als der Kreis — sichtbare Größe und Trefferfläche sind zwei
 * verschiedene Maße (Design-System, Abschnitt 6).
 *
 * Das Symbol darin ist **dunkel**, nicht weiß. Der Entwurf zeigt eine weiße
 * Kontur, und auf seinem mitteldunklen Foto geht das auf — ein Rezeptfoto vom
 * Nutzer kann aber strahlend weiß sein, und weiß auf 72 % Weiß ist schlicht
 * nicht da. Der dunkle Strich steht auf der Milchglasfläche in beiden Fällen.
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
      <span className="flex h-9 w-9 items-center justify-center rounded-pill bg-white/70 text-text backdrop-blur-[8px]">
        {children}
      </span>
    </Link>
  );
}
