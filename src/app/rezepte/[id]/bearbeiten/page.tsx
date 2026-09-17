import { notFound } from "next/navigation";
import { requireHousehold } from "@/lib/server/household";
import { getRecipe } from "@/lib/data/recipes";
import { Notice, Screen } from "@/components/ui";
import { RecipeForm } from "../../RecipeForm";

export const metadata = { title: "Rezept bearbeiten" };

export default async function EditRecipePage(
  props: PageProps<"/rezepte/[id]/bearbeiten">,
) {
  const { id } = await props.params;

  const context = await requireHousehold();
  if (!context.ok) {
    return (
      <Screen title="Rezept bearbeiten">
        <Notice tone="error">{context.error}</Notice>
      </Screen>
    );
  }

  const recipe = await getRecipe(context.supabase, id);
  if (!recipe.ok) {
    return (
      <Screen title="Rezept bearbeiten">
        <Notice tone="error">{recipe.error}</Notice>
      </Screen>
    );
  }
  if (!recipe.value) notFound();

  return (
    <Screen title="Rezept bearbeiten">
      <RecipeForm householdId={context.household.id} recipe={recipe.value} />
    </Screen>
  );
}
