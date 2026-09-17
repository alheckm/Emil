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
            className="flex items-center gap-4 rounded-card border border-border bg-surface p-3"
          >
            <Box className="h-16 w-16 shrink-0 rounded-2xl" />
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
            className="flex min-h-14 items-center gap-3 rounded-card border border-border bg-surface px-4 py-3"
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
 * Rezeptbild.
 *
 * Hält exakt dasselbe Seitenverhältnis wie das echte Bild. Ohne diesen
 * Platzhalter würde der ganze Screen nach unten rutschen, sobald die signierte
 * Adresse eintrifft — und zwar genau dann, wenn der Daumen schon unterwegs ist.
 */
export function ImageSkeleton() {
  return (
    <Frame>
      <Box className="aspect-[4/3] w-full rounded-card" />
    </Frame>
  );
}

/** Portionswähler und Zutaten. */
export function RecipeBodySkeleton() {
  return (
    <Frame>
      <div className="rounded-card border border-border bg-surface p-5">
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
