import { Suspense } from "react";
import { notFound } from "next/navigation";
import { requireHousehold } from "@/lib/server/household";
import { getListState } from "@/lib/server/listState";
import { getRecipe, type Recipe } from "@/lib/data/recipes";
import { getRecipeImageUrl } from "@/lib/data/recipeImages";
import { Notice, Screen, ScreenHeader } from "@/components/ui";
import { RecipeCardSkeleton } from "@/components/skeletons";
import { DeleteRecipe, RecipeIngredientsAndSteps } from "./RecipeActions";
import { RecipeHero } from "./RecipeHero";

/**
 * Das Rezept — ein Screen, eine Fläche, wie in docs/app_redesign.jpg.
 *
 * Oben das Foto über die volle Bildschirmbreite bis unter die Statusleiste,
 * ohne Titel darauf; darunter im fliederblauen `--bg` Titel, Merkmal-Chips,
 * Zutaten und Zubereitung. Keine Kopfzeile über dem Bild, keine Karte darum:
 * der Screen **ist** die Fläche. Deshalb `bleed` — der Rahmen gibt seinen
 * Seitenrand ab, und die Abschnitte unter dem Foto setzen ihren eigenen
 * (20 px, `px-5`).
 *
 * An der Aufteilung fürs Streaming ändert das nichts:
 *
 * - **Rahmen** (`Screen`) ist statisch und steht sofort.
 * - **Rezept** hängt an der Adresse (`params.id`), und URL-Daten kommen nicht
 *   in die App Shell. Es strömt also nach — aber hinter einem Skelett, das
 *   dieselben Maße hat, statt hinter einer eingefrorenen Seite. Die Verweise
 *   von der Übersicht tragen `prefetch`, damit es meist schon da ist.
 * - **Bild** bekommt eine eigene Grenze. Die signierte Adresse ist eine
 *   weitere Runde zum Storage, und das darf den Titel nie aufhalten — der
 *   steht im Text darunter, unabhängig vom Foto.
 * - **Listenstand** kommt aus `getListState()` und liegt damit schon im
 *   Zwischenspeicher, bevor geklickt wurde.
 */
export default function RecipePage(props: PageProps<"/rezepte/[id]">) {
  return (
    <Screen bleed>
      <Suspense fallback={<RecipeCardSkeleton />}>
        <RecipeDetail params={props.params} />
      </Suspense>
    </Screen>
  );
}

type Params = PageProps<"/rezepte/[id]">["params"];

async function RecipeDetail({ params }: { params: Params }) {
  const { id } = await params;

  const context = await requireHousehold();
  if (!context.ok) {
    return (
      <div className="space-y-6 px-safe py-8">
        <ScreenHeader title="Rezept" />
        <Notice tone="error">{context.error}</Notice>
      </div>
    );
  }

  const recipe = await getRecipe(context.supabase, id);
  if (!recipe.ok) {
    return (
      <div className="space-y-6 px-safe py-8">
        <ScreenHeader title="Rezept" />
        <Notice tone="error">{recipe.error}</Notice>
      </div>
    );
  }
  // Ein Rezept aus einem fremden Haushalt kommt wegen RLS gar nicht erst an;
  // für den Bildschirm ist beides dasselbe: es gibt hier nichts.
  if (!recipe.value) notFound();

  const value = recipe.value;

  return (
    <>
      <RecipeHero recipeId={value.id}>
        {value.imagePath && (
          <Suspense fallback={null}>
            <RecipeImage imagePath={value.imagePath} />
          </Suspense>
        )}
      </RecipeHero>

      {/* Titel und Kenndaten stehen jetzt unter dem Foto, auf `--bg` — nicht
          mehr darauf. Design-System, Abschnitt 7, RecipeHero. */}
      <div className="px-5 pt-5">
        <h1 className="font-display text-[32px] font-bold leading-[1.15] [text-wrap:balance]">
          {value.title}
        </h1>
        {(value.totalTimeMin || value.tags.length > 0) && (
          <ul className="mt-3 flex flex-wrap gap-2">
            {value.totalTimeMin && (
              <li className="rounded-pill border border-border px-3 py-1 text-[13px] font-medium">
                {value.totalTimeMin} Min
              </li>
            )}
            {value.tags.map((tag) => (
              <li
                key={tag}
                className="rounded-pill border border-border px-3 py-1 text-[13px] font-medium"
              >
                {tag}
              </li>
            ))}
          </ul>
        )}
      </div>

      <ListAwareIngredients recipe={value} />

      {value.notes && (
        <section className="px-5 pb-6">
          <h2 className="font-display text-[15px] font-semibold leading-[1.3]">
            Notizen
          </h2>
          <p className="mt-3 whitespace-pre-line text-[15px] leading-[1.55]">
            {value.notes}
          </p>
        </section>
      )}

      {(value.tags.length > 0 || value.sourceUrl) && (
        <div className="space-y-1 px-5 pb-6 text-[13px] text-muted">
          {value.tags.length > 0 && <p>{value.tags.join(" · ")}</p>}
          {value.sourceUrl && (
            <p className="truncate">
              <a
                href={value.sourceUrl}
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

      <ListAwareDelete recipeId={value.id} />
    </>
  );
}

async function ListAwareIngredients({ recipe }: { recipe: Recipe }) {
  const list = await getListState();

  return (
    <>
      {list.error && (
        <div className="px-5 pt-5">
          <Notice tone="error">{list.error}</Notice>
        </div>
      )}
      <RecipeIngredientsAndSteps
        listId={list.listId}
        recipe={recipe}
        plannedServings={list.planned[recipe.id] ?? null}
      />
    </>
  );
}

async function ListAwareDelete({ recipeId }: { recipeId: string }) {
  // Zweiter Aufruf, aber keine zweite Netzrunde: `getListState()` ist für die
  // Dauer des Requests zwischengespeichert.
  const list = await getListState();
  return <DeleteRecipe listId={list.listId} recipeId={recipeId} />;
}

async function RecipeImage({ imagePath }: { imagePath: string }) {
  const context = await requireHousehold();
  if (!context.ok) return null;

  // Signiert und kurzlebig, weil der Bucket privat ist — ein Rezeptbild soll
  // nicht über eine erratene Adresse im Netz stehen.
  const imageUrl = await getRecipeImageUrl(context.supabase, imagePath);
  if (!imageUrl) return null;

  return (
    /* Kein next/image: die Adresse ist signiert und läuft nach einer Stunde
       ab — der Optimierer würde daraus nur wechselnde Cache-Einträge machen.
       Absolut über dem Bett im Hero: so ist der Platz von Anfang an reserviert
       und der Titel steht schon, während das Foto noch unterwegs ist. */
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={imageUrl}
      alt=""
      className="absolute inset-0 h-full w-full object-cover"
    />
  );
}
