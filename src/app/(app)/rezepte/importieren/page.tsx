import { Suspense } from "react";
import { requireHousehold } from "@/lib/server/household";
import { Notice, Screen } from "@/components/ui";
import { RecipeBodySkeleton } from "@/components/skeletons";
import { ImportPanel } from "./ImportPanel";

export const metadata = { title: "Rezept importieren" };

/**
 * Rezept importieren.
 *
 * Überschrift und Erklärtext sind statisch und stehen sofort. Das Feld
 * darunter braucht den Haushalt und — beim Weg über den iOS-Kurzbefehl — die
 * Adresse aus der Anfrage; beides zusammen hinter einer Grenze.
 */
export default function ImportPage(props: PageProps<"/rezepte/importieren">) {
  return (
    <Screen
      title="Rezept importieren"
      lead="Von einer Webseite holen oder Text einfügen. Gespeichert wird erst nach der Kontrolle."
    >
      <Suspense fallback={<RecipeBodySkeleton />}>
        <Panel searchParams={props.searchParams} />
      </Suspense>
    </Screen>
  );
}

type SearchParams = PageProps<"/rezepte/importieren">["searchParams"];

async function Panel({ searchParams }: { searchParams: SearchParams }) {
  // Vom iOS-Kurzbefehl: Safari teilt die Rezeptseite, der Kurzbefehl öffnet
  // Emil mit ?url=… und das Feld ist schon ausgefüllt.
  const { url } = await searchParams;
  const prefill = typeof url === "string" ? url : null;

  const context = await requireHousehold();
  if (!context.ok) return <Notice tone="error">{context.error}</Notice>;

  return (
    <ImportPanel householdId={context.household.id} prefillUrl={prefill} />
  );
}
