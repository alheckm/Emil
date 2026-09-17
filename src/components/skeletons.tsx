/**
 * Platzhalter für Inhalte, die noch unterwegs sind.
 *
 * Der Punkt dieser Bausteine ist nicht Dekoration, sondern dass beim Klick
 * sofort etwas dasteht, statt dass die Oberfläche einfriert. Sie sind deshalb
 * bewusst formgleich mit dem, was sie ersetzen — ein Skelett, das andere Maße
 * hat als der echte Inhalt, lässt die Seite beim Eintreffen springen, und das
 * wirkt langsamer als gar kein Skelett.
 *
 * `aria-hidden` und `role="status"`: Screenreader sollen „lädt“ hören, nicht
 * eine Handvoll leerer Kästen vorgelesen bekommen.
 */
function Bar({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={"block animate-pulse rounded bg-border " + className}
    />
  );
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
      <Bar className="h-9 w-2/3" />
      <Bar className="mt-3 h-4 w-24" />
    </Frame>
  );
}

/** Liste aus Zeilen — Rezeptübersicht, Mitglieder, alles in der Form. */
export function RowsSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <Frame>
      <ul className="space-y-2">
        {Array.from({ length: rows }, (_, index) => (
          <li
            key={index}
            className="rounded-xl border border-border bg-surface px-4 py-3"
          >
            <Bar className="h-4 w-1/2" />
            <Bar className="mt-2 h-3 w-1/3" />
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
      <Bar className="h-4 w-28" />
      <ul className="mt-2 space-y-2">
        {Array.from({ length: rows }, (_, index) => (
          <li
            key={index}
            className="flex min-h-14 items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3"
          >
            <Bar className="h-7 w-7 shrink-0 rounded-md" />
            <Bar className="h-4 w-1/2" />
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
      <Bar className="aspect-[4/3] w-full rounded-2xl" />
    </Frame>
  );
}

/** Portionswähler und Zutaten. */
export function RecipeBodySkeleton() {
  return (
    <Frame>
      <div className="rounded-2xl border border-border bg-surface p-5">
        <div className="flex items-center justify-between gap-4">
          <Bar className="h-5 w-24" />
          <Bar className="h-12 w-32 rounded-xl" />
        </div>
        <ul className="mt-5 space-y-3">
          {Array.from({ length: 6 }, (_, index) => (
            <li key={index} className="flex gap-3">
              <Bar className="h-4 w-20 shrink-0" />
              <Bar className="h-4 w-full" />
            </li>
          ))}
        </ul>
      </div>
    </Frame>
  );
}

/** Die Knöpfe unter dem Rezept, solange der Listenstand noch fehlt. */
export function ButtonsSkeleton() {
  return (
    <Frame>
      <Bar className="h-12 w-full rounded-xl" />
    </Frame>
  );
}

/**
 * Einzelne Textzeile, die noch fehlt — etwa die E-Mail-Adresse im Konto.
 *
 * Als `<span>` und nicht als Block, damit er dort stehen kann, wo gleich der
 * echte Text steht, ohne die Zeile umzubrechen.
 */
export function TextSkeleton({ className = "w-40" }: { className?: string }) {
  return (
    <span role="status" aria-label="Wird geladen">
      <Bar className={"h-4 " + className} />
    </span>
  );
}
