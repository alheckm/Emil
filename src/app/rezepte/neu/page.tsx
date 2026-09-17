import Link from "next/link";
import { requireHousehold } from "@/lib/server/household";
import { Notice, Screen } from "@/components/ui";
import { RecipeForm } from "../RecipeForm";

export const metadata = { title: "Neues Rezept" };

export default async function NewRecipePage() {
  const context = await requireHousehold();
  if (!context.ok) {
    return (
      <Screen title="Neues Rezept">
        <Notice tone="error">{context.error}</Notice>
      </Screen>
    );
  }

  return (
    <Screen title="Neues Rezept">
      <RecipeForm householdId={context.household.id} />
      <p className="text-center text-[15px]">
        <Link
          href="/rezepte/importieren"
          className="text-muted underline underline-offset-4"
        >
          Stattdessen importieren
        </Link>
        <span className="px-2 text-muted">·</span>
        <Link href="/rezepte" className="text-muted underline underline-offset-4">
          Alle Rezepte
        </Link>
      </p>
    </Screen>
  );
}
