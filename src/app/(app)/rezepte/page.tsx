import { Suspense } from "react";
import Link from "next/link";
import { requireHousehold } from "@/lib/server/household";
import { getListState } from "@/lib/server/listState";
import { listHouseholdTags, searchRecipes } from "@/lib/data/recipes";
import { getRecipeImageUrls } from "@/lib/data/recipeImages";
import { Notice, Screen } from "@/components/ui";
import { RowsSkeleton } from "@/components/skeletons";
import { RecipeBrowser } from "./RecipeBrowser";

export const metadata = { title: "Rezepte" };

/**
 * Die Rezeptübersicht.
 *
 * Der Rahmen — Überschrift und die beiden Knöpfe zum Anlegen — ist statisch
 * und landet damit in der App Shell: er steht, sobald der Tab angetippt wird.
 * Nur die Treffer strömen nach, und die hängen am Suchtext in der Adresse,
 * sind also URL-Daten und können gar nicht vorab im Shell liegen.
 */
export default function RecipesPage(props: PageProps<"/rezepte">) {
  return (
    <Screen title="Rezepte">
      <div className="grid grid-cols-2 gap-2">
        <Link
          href="/rezepte/importieren"
          className="flex h-12 items-center justify-center rounded-pill bg-brand px-5 text-base font-medium text-brand-text press tap-target"
        >
          Importieren
        </Link>
        <Link
          href="/rezepte/neu"
          className="flex h-12 items-center justify-center rounded-card border border-border bg-surface px-4 text-base font-medium press tap-target"
        >
          Von Hand
        </Link>
      </div>

      <Suspense fallback={<RowsSkeleton />}>
        <Results searchParams={props.searchParams} />
      </Suspense>
    </Screen>
  );
}

type SearchParams = PageProps<"/rezepte">["searchParams"];

async function Results({ searchParams }: { searchParams: SearchParams }) {
  const { q } = await searchParams;
  const query = typeof q === "string" ? q : null;

  const context = await requireHousehold();
  if (!context.ok) return <Notice tone="error">{context.error}</Notice>;

  const { supabase, household } = context;

  // Das Schlagwort geht bewusst **nicht** mit an den Server: danach filtert der
  // Browser (siehe RecipeBrowser). Sonst wären Chips wieder eine Netzrunde,
  // und schlimmer — die Liste könnte den Filter nie ohne Server wieder
  // aufheben, weil sie die weggefilterten Rezepte gar nicht hätte.
  const [recipes, tags, list] = await Promise.all([
    searchRecipes(supabase, household.id, query, null),
    listHouseholdTags(supabase, household.id),
    getListState(),
  ]);

  if (!recipes.ok) return <Notice tone="error">{recipes.error}</Notice>;

  // Ein Bündelaufruf für alle Bilder statt einer Runde pro Zeile.
  const images = await getRecipeImageUrls(
    supabase,
    recipes.value.map((recipe) => recipe.imagePath),
  );

  return (
    <RecipeBrowser
      recipes={recipes.value}
      tags={tags.ok ? tags.value : []}
      planned={list.planned}
      images={images}
    />
  );
}
