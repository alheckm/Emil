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
 * Maßgleich mit den echten Screens der Instagram-Baseline-Richtung
 * (DESIGN.md): Story-Ring-Kreise für die Einkaufsliste, randloses Foto für
 * Feed/Rezeptdetail — kein eckiger Kasten mehr.
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
      <Box className="h-5 w-1/2" />
      <Box className="mt-2 h-3.5 w-20" />
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
            className="flex items-center gap-4 rounded-soft bg-soft p-3"
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

/**
 * Aufgaben: flache Zeilen mit Kreis-Checkbox — maßgleich mit `TodoRow`
 * (TodoView.tsx).
 */
export function TodoSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <Frame>
      <ul>
        {Array.from({ length: rows }, (_, index) => (
          <li
            key={index}
            className="flex items-center gap-3.5 border-b border-border py-3.5"
          >
            <Box className="h-[26px] w-[26px] shrink-0 rounded-full" />
            <Box className="h-4 w-1/2" />
          </li>
        ))}
      </ul>
    </Frame>
  );
}

/**
 * Einkaufsliste: Story-Ring-Kreise im 3er-Raster — maßgleich mit
 * `renderEntry` (ListView.tsx).
 */
export function ShoppingListSkeleton({ rows = 9 }: { rows?: number }) {
  return (
    <Frame>
      <Box className="h-3.5 w-32" />
      <ul className="mt-5 grid grid-cols-3 gap-x-3.5 gap-y-5">
        {Array.from({ length: rows }, (_, index) => (
          <li key={index} className="flex flex-col items-center gap-[7px]">
            <Box className="aspect-square w-full rounded-full" />
            <Box className="h-3.5 w-2/3" />
          </li>
        ))}
      </ul>
    </Frame>
  );
}

/**
 * Der Rezept-Screen, solange das Rezept noch unterwegs ist.
 *
 * Maßgleich mit dem echten: randloses Foto (DESIGN.md „Rezeptdetail" —
 * `aspect-[393/420]`, Radius 0), derselbe Seitenrand darunter. Beim
 * Eintreffen der Daten wechselt so nur der Inhalt, nicht die Fläche.
 */
export function RecipeCardSkeleton() {
  return (
    <Frame>
      <div>
        <div aria-hidden className="aspect-[393/420] w-full bg-photo" />
        <div className="px-5 pt-[18px] pb-6">
          <Box className="h-6 w-3/4" />
          <div className="mt-3.5 flex gap-2">
            <Box className="h-7 w-24 rounded-pill" />
            <Box className="h-7 w-16 rounded-pill" />
          </div>
          <div className="mt-6 flex items-center justify-between gap-4">
            <Box className="h-5 w-24" />
            <Box className="h-11 w-28 rounded-pill" />
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
 * Der Home-Feed (DESIGN.md „Rezepte — Home"): Titel, randloses Foto, Meta-
 * Zeile — maßgleich mit den echten Feed-Karten in `RecipeBrowser.tsx`.
 */
export function RecipeGridSkeleton({ cards = 2 }: { cards?: number }) {
  return (
    <Frame>
      <ul>
        {Array.from({ length: cards }, (_, index) => (
          <li key={index}>
            <div className="px-5 pt-3.5 pb-2.5">
              <Box className="h-4 w-2/3" />
            </div>
            <div aria-hidden className="aspect-[393/340] w-full bg-photo" />
            <div className="flex items-center justify-between gap-3 px-5 pt-3.5 pb-4">
              <Box className="h-4 w-16" />
              <Box className="h-9 w-24 rounded-pill" />
            </div>
            <div className="h-px bg-border" />
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
      <div className="px-5">
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
 * mitten im Text als Kasten anzudeuten stört mehr, als es hilft.
 */
export function TextSkeleton({ className = "w-40" }: { className?: string }) {
  return (
    <span role="status" aria-label="Wird geladen" className="placeholder-space">
      <span aria-hidden className={"inline-block h-4 " + className} />
    </span>
  );
}
