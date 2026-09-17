import { requireHousehold } from "@/lib/server/household";
import { Notice, Screen } from "@/components/ui";
import { ImportPanel } from "./ImportPanel";

export const metadata = { title: "Rezept importieren" };

export default async function ImportPage() {
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
      <ImportPanel householdId={context.household.id} />
    </Screen>
  );
}
