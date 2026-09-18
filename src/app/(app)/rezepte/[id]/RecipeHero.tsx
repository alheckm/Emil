import Link from "next/link";
import { ChevronLeftIcon, PencilIcon } from "@/components/icons";

/**
 * Der obere Teil des Rezept-Screens: Foto, zwei runde Knöpfe, Titel.
 *
 * Drei Dinge, die hier nicht Geschmackssache sind:
 *
 * - **Der Titel steht auf dem Foto**, nicht darüber. Das ist der auffälligste
 *   Zug des Entwurfs — er macht aus einem Bild mit Überschrift eine Karte. Die
 *   Kopfzeile, die vorher über dem Bild stand, entfällt damit ersatzlos.
 * - **Das Bett unter dem Foto ist immer da.** Die signierte Bildadresse ist
 *   eine eigene Netzrunde, und ein Rezept muss auch ganz ohne Foto gut
 *   aussehen. Deshalb liegt unter dem Bild eine dunkle Fläche (`bg-photo`), auf
 *   der der weiße Titel in beiden Fällen lesbar ist — und wenn das Foto
 *   nachkommt, springt nichts.
 * - **Zwei Schleier**, oben und unten. Im Entwurf ist das Foto an beiden Enden
 *   leicht abgedunkelt; hier ist es zusätzlich eine Notwendigkeit, weil das
 *   Foto vom Nutzer kommt und auch strahlend weiß sein kann.
 *
 * Auf dem Foto steht **nur der Titel** — so wie im Entwurf. Die Kochzeit stand
 * hier zwischendurch als zweite Zeile und ist wieder raus: 13-px-Weiß auf
 * einem hellen Foto kommt auch mit Schleier nicht über 4,5:1. Sie steht jetzt
 * unten bei den Schlagwörtern, wo sie auf dem Off-White sitzt.
 *
 * Oben rechts steht bewusst **kein Herz**: Emil kennt keine Favoriten, und ein
 * Knopf, der nichts tut, ist schlimmer als keiner. An derselben Stelle, in
 * derselben Form, sitzt stattdessen der Weg zum Bearbeiten — die einzige
 * Aktion, die auf diesem Screen sonst nirgends hingehört.
 */
export function RecipeHero({
  title,
  recipeId,
  children,
}: {
  title: string;
  recipeId: string;
  /** Das Foto selbst — strömt hinter einer eigenen Suspense-Grenze nach. */
  children?: React.ReactNode;
}) {
  return (
    /* 9:10 — im Entwurf gemessen: das Foto ist etwas höher als breit und nimmt
       knapp die Hälfte des Screens ein. Volle Bildschirmbreite, keine Rundung,
       kein Rahmen: im Entwurf läuft es bis an die Gerätekanten und unter die
       Statusleiste. */
    <div className="relative aspect-[9/10] w-full overflow-hidden bg-photo">
      {children}

      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-scrim/45 to-transparent"
      />
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-scrim via-scrim/30 to-transparent"
      />

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

      <div className="absolute inset-x-0 bottom-0 px-5 pb-5">
        {/* 32/1,15 im regulären Schnitt (Design-System, Abschnitt 5). Bei
            dieser Größe trägt der Strichkontrast der Playfair allein; 600
            wirkte daneben plump. Zwei Zeilen sind vorgesehen und erwünscht —
            deutsche Rezepttitel sind Komposita. */}
        <h1 className="font-display text-[32px] font-normal leading-[1.15] text-white [text-wrap:balance]">
          {title}
        </h1>
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
