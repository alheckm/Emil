import { Suspense } from "react";
import { requireHousehold } from "@/lib/server/household";
import { getListState } from "@/lib/server/listState";
import { listHouseholdTags, searchRecipes } from "@/lib/data/recipes";
import { getRecipeImageUrls } from "@/lib/data/recipeImages";
import { Notice } from "@/components/ui";
import { RecipeGridSkeleton } from "@/components/skeletons";
import { RecipeBrowser } from "./RecipeBrowser";

export const metadata = { title: "Rezepte" };

/**
 * Die Rezeptübersicht — „Home" im Design-Canvas (DESIGN.md).
 *
 * Kein generischer `Screen`/`ScreenHeader`: der Kopf dieses einen Screens
 * (Wortmarke „emil", Importieren, Feed/Kacheln-Umschalter, Suche, Filter-
 * Chips) ist eigen genug, dass `RecipeBrowser` ihn selbst zeichnet — er hängt
 * ohnehin am Umschalt-Zustand, den nur die Browser-Komponente kennt.
 *
 * Der Rahmen bleibt trotzdem statisch und landet in der App Shell: nur die
 * Treffer strömen nach, und die hängen am Suchtext in der Adresse, sind also
 * URL-Daten und können gar nicht vorab im Shell liegen.
 */
export default function RecipesPage(props: PageProps<"/rezepte">) {
  return (
    <main className="flex-1 pt-safe pb-tabbar">
      <div className="mx-auto w-full max-w-md">
        <Suspense fallback={<RecipeGridSkeleton />}>
          <Results searchParams={props.searchParams} />
        </Suspense>
      </div>
    </main>
  );
}

type SearchParams = PageProps<"/rezepte">["searchParams"];

async function Results({ searchParams }: { searchParams: SearchParams }) {
  const { q } = await searchParams;
  const query = typeof q === "string" ? q : null;

  const context = await requireHousehold();
  if (!context.ok) {
    return (
      <div className="px-5 pt-5">
        <Notice tone="error">{context.error}</Notice>
      </div>
    );
  }

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

  if (!recipes.ok) {
    return (
      <div className="px-5 pt-5">
        <Notice tone="error">{recipes.error}</Notice>
      </div>
    );
  }

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
      listId={list.listId}
    />
  );
}
