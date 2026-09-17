import { requireHousehold } from "@/lib/server/household";
import { Notice, Screen } from "@/components/ui";
import { ImportPanel } from "./ImportPanel";

export const metadata = { title: "Rezept importieren" };

export default async function ImportPage(
  props: PageProps<"/rezepte/importieren">,
) {
  // Vom iOS-Kurzbefehl: Safari teilt die Rezeptseite, der Kurzbefehl öffnet
  // Emil mit ?url=… und das Feld ist schon ausgefüllt.
  const { url } = await props.searchParams;
  const prefill = typeof url === "string" ? url : null;

  const context = await requireHousehold();
  if (!context.ok) {
    return (
      <Screen title="Rezept importieren">
        <Notice tone="error">{context.error}</Notice>
      </Screen>
    );
  }

  return (
    <Screen
      title="Rezept importieren"
      lead="Von einer Webseite holen oder Text einfügen. Gespeichert wird erst nach der Kontrolle."
    >
      <ImportPanel householdId={context.household.id} prefillUrl={prefill} />
    </Screen>
  );
}
