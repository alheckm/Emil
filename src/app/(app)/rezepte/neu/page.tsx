import { Suspense } from "react";
import Link from "next/link";
import { requireHousehold } from "@/lib/server/household";
import { Notice, Screen } from "@/components/ui";
import { RecipeBodySkeleton } from "@/components/skeletons";
import { RecipeForm } from "../RecipeForm";

export const metadata = { title: "Neues Rezept" };

/**
 * Das leere Rezeptformular.
 *
 * Vom Server kommt hier nur eine einzige Angabe — zu welchem Haushalt das
 * Rezept gehört. Alles andere ist ein leeres Formular und damit statisch, also
 * steht der Screen sofort und nur das Formular selbst rückt nach.
 */
export default function NewRecipePage() {
  return (
    <Screen title="Neues Rezept">
      <Suspense fallback={<RecipeBodySkeleton />}>
        <Form />
      </Suspense>

      <p className="text-center text-[15px]">
        <Link
          href="/rezepte/importieren"
          className="text-muted underline underline-offset-4"
        >
          Stattdessen importieren
        </Link>
      </p>
    </Screen>
  );
}

async function Form() {
  const context = await requireHousehold();
  if (!context.ok) return <Notice tone="error">{context.error}</Notice>;

  return <RecipeForm householdId={context.household.id} />;
}
