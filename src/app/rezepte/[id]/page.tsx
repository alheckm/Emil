import Link from "next/link";
import { notFound } from "next/navigation";
import { requireHousehold } from "@/lib/server/household";
import { getRecipe } from "@/lib/data/recipes";
import { getActiveListId, listPlannedRecipes } from "@/lib/data/shoppingList";
import { getRecipeImageUrl } from "@/lib/data/recipeImages";
import { Card, Notice, Screen } from "@/components/ui";
import { RecipeActions } from "./RecipeActions";

export default async function RecipePage(props: PageProps<"/rezepte/[id]">) {
  const { id } = await props.params;

  const context = await requireHousehold();
  if (!context.ok) {
    return (
      <Screen title="Rezept">
        <Notice tone="error">{context.error}</Notice>
      </Screen>
    );
  }

  const { supabase, household } = context;
  const recipe = await getRecipe(supabase, id);
  if (!recipe.ok) {
    return (
      <Screen title="Rezept">
        <Notice tone="error">{recipe.error}</Notice>
      </Screen>
    );
  }
  // Ein Rezept aus einem fremden Haushalt kommt wegen RLS gar nicht erst an;
  // für den Bildschirm ist beides dasselbe: es gibt hier nichts.
  if (!recipe.value) notFound();

  const list = await getActiveListId(supabase, household.id);
  const planned = list.ok ? await listPlannedRecipes(supabase, list.value) : null;
  // Signiert und kurzlebig, weil der Bucket privat ist — ein Rezeptbild soll
  // nicht über eine erratene Adresse im Netz stehen.
  const imageUrl = await getRecipeImageUrl(supabase, recipe.value.imagePath);

  return (
    <Screen
      title={recipe.value.title}
      lead={
        recipe.value.totalTimeMin
          ? `${recipe.value.totalTimeMin} Minuten`
          : undefined
      }
    >
      {!list.ok && <Notice tone="error">{list.error}</Notice>}

      {imageUrl && (
        /* Kein next/image: die Adresse ist signiert und läuft nach einer Stunde
           ab — der Optimierer würde daraus nur wechselnde Cache-Einträge machen. */
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={imageUrl}
          alt=""
          className="aspect-[4/3] w-full rounded-2xl border border-border object-cover"
        />
      )}

      <RecipeActions
        listId={list.ok ? list.value : null}
        recipe={recipe.value}
        plannedServings={
          planned?.ok ? (planned.value[recipe.value.id] ?? null) : null
        }
      />

      {recipe.value.instructions.length > 0 && (
        <Card>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
            Zubereitung
          </h2>
          <ol className="mt-3 space-y-3 text-[15px] leading-relaxed">
            {recipe.value.instructions.map((step, index) => (
              <li key={index} className="flex gap-3">
                <span className="shrink-0 text-muted">{index + 1}.</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </Card>
      )}

      {recipe.value.notes && (
        <Card>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
            Notizen
          </h2>
          <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed">
            {recipe.value.notes}
          </p>
        </Card>
      )}

      {(recipe.value.tags.length > 0 || recipe.value.sourceUrl) && (
        <div className="space-y-3 text-[13px] text-muted">
          {recipe.value.tags.length > 0 && (
            <p>{recipe.value.tags.join(" · ")}</p>
          )}
          {recipe.value.sourceUrl && (
            <p className="truncate">
              <a
                href={recipe.value.sourceUrl}
                className="underline underline-offset-4"
                rel="noreferrer noopener"
                target="_blank"
              >
                Quelle
              </a>
            </p>
          )}
        </div>
      )}

      <p className="text-center text-[15px]">
        <Link href="/rezepte" className="text-muted underline underline-offset-4">
          Alle Rezepte
        </Link>
      </p>
    </Screen>
  );
}
