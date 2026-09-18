/**
 * Platzhalter für Inhalte, die noch unterwegs sind.
 *
 * Bewusst zurückhaltend: kein Pulsieren, keine grauen Balken. Das ist ein
 * Web-Muster, und Emil wird als App vom Home-Bildschirm benutzt — dort kennt
 * man es nicht, und es sieht nach Webseite aus.
 *
 * Zwei Dinge machen die Arbeit:
 *
 * - Der **Platz** ist von der ersten Millisekunde an reserviert, damit beim
 *   Eintreffen der Daten nichts springt. Das ist der eigentliche Zweck.
 * - **Sichtbar** wird davon erst nach 320 ms (siehe `placeholder-box` in
 *   globals.css). Seit die App Shell steht, sind die meisten Ladevorgänge
 *   vorher fertig — dann sieht man nie einen Platzhalter, sondern nur, wie der
 *   Inhalt erscheint.
 *
 * `aria-hidden` und `role="status"`: Screenreader sollen „lädt" hören, nicht
 * eine Handvoll leerer Kästen vorgelesen bekommen.
 */
function Box({ className = "" }: { className?: string }) {
  return <span aria-hidden className={"block placeholder-box " + className} />;
}

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div role="status" aria-label="Wird geladen">
      {children}
    </div>
  );
}

/** Kopfzeile eines Screens, dessen Titel aus den Daten kommt. */
export function HeaderSkeleton() {
  return (
    <Frame>
      <Box className="h-9 w-2/3" />
      <Box className="mt-3 h-4 w-24" />
    </Frame>
  );
}

/** Rezeptzeilen: Bildkachel links, zwei Textzeilen rechts. */
export function RowsSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <Frame>
      <ul className="space-y-3">
        {Array.from({ length: rows }, (_, index) => (
          <li
            key={index}
            className="flex items-center gap-4 rounded-soft bg-surface p-3 shadow-card"
          >
            <Box className="h-16 w-16 shrink-0 rounded-soft" />
            <span className="min-w-0 flex-1">
              <Box className="h-4 w-1/2" />
              <Box className="mt-2 h-3 w-1/3" />
            </span>
          </li>
        ))}
      </ul>
    </Frame>
  );
}

/** Einkaufsliste: Abteilungsüberschrift plus Zeilen mit Kästchen. */
export function ListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <Frame>
      <Box className="h-3 w-28" />
      <ul className="mt-3 space-y-2">
        {Array.from({ length: rows }, (_, index) => (
          <li
            key={index}
            className="flex min-h-14 items-center gap-3 rounded-soft bg-surface px-4 py-3 shadow-card"
          >
            <Box className="h-7 w-7 shrink-0 rounded-lg" />
            <Box className="h-4 w-1/2" />
          </li>
        ))}
      </ul>
    </Frame>
  );
}

/**
 * Die Rezeptkarte, solange das Rezept noch unterwegs ist.
 *
 * Maßgleich mit der echten Karte: dieselbe Rundung, dasselbe Seitenverhältnis
 * des Fotos, derselbe Innenabstand. Das Foto-Bett ist hier keine getönte
 * Fläche, sondern schon der dunkle Ton, den die fertige Karte trägt — beim
 * Eintreffen der Daten wechselt also nur der Inhalt, nicht die Farbe.
 */
export function RecipeCardSkeleton() {
  return (
    <Frame>
      <div className="overflow-hidden rounded-card bg-surface shadow-card">
        <div aria-hidden className="aspect-[9/10] w-full bg-photo" />
        <div className="px-5 pb-6 pt-5">
          <div className="flex items-center justify-between gap-4">
            <Box className="h-5 w-24" />
            <Box className="h-10 w-32 rounded-pill" />
          </div>
          <div className="mt-5 flex gap-4">
            {Array.from({ length: 4 }, (_, index) => (
              <Box key={index} className="size-18 shrink-0 rounded-pill" />
            ))}
          </div>
          <ul className="mt-6 space-y-3">
            {Array.from({ length: 6 }, (_, index) => (
              <li key={index} className="flex gap-3">
                <Box className="h-4 w-20 shrink-0" />
                <Box className="h-4 w-full" />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Frame>
  );
}

/**
 * Die Karten der Rezeptübersicht.
 *
 * Zwei reichen: mehr Platzhalter als sichtbare Karten zu zeigen füllt den
 * Bildschirm mit einem Versprechen, das die Daten vielleicht nicht halten.
 */
export function RecipeGridSkeleton({ cards = 2 }: { cards?: number }) {
  return (
    <Frame>
      <ul className="space-y-6">
        {Array.from({ length: cards }, (_, index) => (
          <li
            key={index}
            className="overflow-hidden rounded-card bg-surface shadow-card"
          >
            <div aria-hidden className="aspect-[9/10] w-full bg-photo" />
            <div className="px-5 py-4">
              <Box className="h-4 w-28" />
            </div>
          </li>
        ))}
      </ul>
    </Frame>
  );
}

/** Portionswähler und Zutaten. */
export function RecipeBodySkeleton() {
  return (
    <Frame>
      <div className="rounded-card bg-surface p-5 shadow-card">
        <div className="flex items-center justify-between gap-4">
          <Box className="h-5 w-24" />
          <Box className="h-12 w-32 rounded-pill" />
        </div>
        <ul className="mt-6 space-y-3">
          {Array.from({ length: 6 }, (_, index) => (
            <li key={index} className="flex gap-3">
              <Box className="h-4 w-20 shrink-0" />
              <Box className="h-4 w-full" />
            </li>
          ))}
        </ul>
      </div>
    </Frame>
  );
}

/**
 * Einzelne Textzeile, die noch fehlt — etwa die E-Mail-Adresse im Konto.
 *
 * Hier bleibt der Platz nur frei, ohne getönte Fläche: eine einzelne Zeile
 * mitten in einer Karte als Kasten anzudeuten stört mehr, als es hilft.
 */
export function TextSkeleton({ className = "w-40" }: { className?: string }) {
  return (
    <span role="status" aria-label="Wird geladen" className="placeholder-space">
      <span aria-hidden className={"inline-block h-4 " + className} />
    </span>
  );
}
