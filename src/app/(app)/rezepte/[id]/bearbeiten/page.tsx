import { Suspense } from "react";
import { notFound } from "next/navigation";
import { requireHousehold } from "@/lib/server/household";
import { getListState } from "@/lib/server/listState";
import { getRecipe } from "@/lib/data/recipes";
import { Notice, Screen } from "@/components/ui";
import { RecipeBodySkeleton } from "@/components/skeletons";
import { RecipeForm } from "../../RecipeForm";
import { DeleteRecipe } from "../RecipeActions";

export const metadata = { title: "Rezept bearbeiten" };

/**
 * Rezept bearbeiten.
 *
 * Wie beim Anlegen steht der Rahmen sofort; das Formular braucht das Rezept
 * und hängt damit an der Adresse, strömt also nach. Der Platzhalter hat die
 * Maße des Formulars, damit nichts springt, wenn es eintrifft.
 */
export default function EditRecipePage(
  props: PageProps<"/rezepte/[id]/bearbeiten">,
) {
  return (
    <Screen title="Rezept bearbeiten">
      <Suspense fallback={<RecipeBodySkeleton />}>
        <Form params={props.params} />
      </Suspense>
    </Screen>
  );
}

type Params = PageProps<"/rezepte/[id]/bearbeiten">["params"];

async function Form({ params }: { params: Params }) {
  const { id } = await params;

  const context = await requireHousehold();
  if (!context.ok) return <Notice tone="error">{context.error}</Notice>;

  const recipe = await getRecipe(context.supabase, id);
  if (!recipe.ok) return <Notice tone="error">{recipe.error}</Notice>;
  if (!recipe.value) notFound();

  // Für die Löschen-Aktion ganz unten: sie nimmt das Rezept vorher von der
  // Liste, falls es dort liegt (siehe DeleteRecipe in RecipeActions.tsx).
  const list = await getListState();

  return (
    <>
      <RecipeForm householdId={context.household.id} recipe={recipe.value} />
      <DeleteRecipe listId={list.listId} recipeId={recipe.value.id} />
    </>
  );
}
