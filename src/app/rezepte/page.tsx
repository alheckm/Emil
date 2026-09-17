import Link from "next/link";
import { requireHousehold } from "@/lib/server/household";
import { listHouseholdTags, searchRecipes } from "@/lib/data/recipes";
import { getActiveListId, listPlannedRecipes } from "@/lib/data/shoppingList";
import { Card, Notice, RowLink, Screen } from "@/components/ui";
import { SearchBar } from "./SearchBar";

export const metadata = { title: "Rezepte" };

export default async function RecipesPage(props: PageProps<"/rezepte">) {
  const { q, tag } = await props.searchParams;
  const query = typeof q === "string" ? q : null;
  const activeTag = typeof tag === "string" ? tag : null;

  const context = await requireHousehold();
  if (!context.ok) {
    return (
      <Screen title="Rezepte">
        <Notice tone="error">{context.error}</Notice>
      </Screen>
    );
  }

  const { supabase, household } = context;
  const [recipes, tags] = await Promise.all([
    searchRecipes(supabase, household.id, query, activeTag),
    listHouseholdTags(supabase, household.id),
  ]);
  if (!recipes.ok) {
    return (
      <Screen title="Rezepte">
        <Notice tone="error">{recipes.error}</Notice>
      </Screen>
    );
  }

  // Was schon eingeplant ist, steht am Rezept — sonst legt man dasselbe
  // Gericht zweimal auf die Liste und wundert sich über die Mengen.
  const list = await getActiveListId(supabase, household.id);
  const planned = list.ok ? await listPlannedRecipes(supabase, list.value) : null;
  const plannedById = planned?.ok ? planned.value : {};

  return (
    <Screen title="Rezepte" lead={household.name}>
      <div className="grid grid-cols-2 gap-2">
        <Link
          href="/rezepte/importieren"
          className="flex h-12 items-center justify-center rounded-xl bg-accent px-4 text-base font-medium text-accent-text active:opacity-70"
        >
          Importieren
        </Link>
        <Link
          href="/rezepte/neu"
          className="flex h-12 items-center justify-center rounded-xl border border-border bg-surface px-4 text-base font-medium active:opacity-70"
        >
          Von Hand
        </Link>
      </div>

      <SearchBar tags={tags.ok ? tags.value : []} />

      {recipes.value.length === 0 && (query || activeTag) ? (
        <Card>
          <p className="text-[15px] leading-relaxed text-muted">
            Nichts gefunden. Gesucht wird in Titeln und Zutaten — vielleicht
            heißt die Zutat im Rezept anders.
          </p>
        </Card>
      ) : recipes.value.length === 0 ? (
        <Card>
          <p className="text-[15px] leading-relaxed text-muted">
            Noch kein Rezept. Am schnellsten geht es über „Importieren“: die
            Adresse einer Rezeptseite einfügen, oder ein Kochbuch-Foto in
            claude.ai digitalisieren und das Ergebnis hier einsetzen.
          </p>
        </Card>
      ) : (
        <ul className="space-y-2">
          {recipes.value.map((recipe) => {
            const servings = plannedById[recipe.id];
            return (
              <li key={recipe.id}>
                <RowLink href={`/rezepte/${recipe.id}`}>
                  <span className="block truncate font-medium">{recipe.title}</span>
                  <span className="mt-0.5 block text-[13px] text-muted">
                    {recipe.baseServings} {recipe.servingsLabel}
                    {recipe.totalTimeMin ? ` · ${recipe.totalTimeMin} min` : ""}
                    {servings ? ` · auf der Liste (${servings})` : ""}
                  </span>
                </RowLink>
              </li>
            );
          })}
        </ul>
      )}

      <p className="text-center text-[15px]">
        <Link href="/" className="text-muted underline underline-offset-4">
          Zurück
        </Link>
      </p>
    </Screen>
  );
}
