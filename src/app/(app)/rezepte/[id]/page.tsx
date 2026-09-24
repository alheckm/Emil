import { Suspense } from "react";
import { notFound } from "next/navigation";
import { requireHousehold } from "@/lib/server/household";
import { getListState } from "@/lib/server/listState";
import { getRecipe, type Recipe } from "@/lib/data/recipes";
import { getRecipeImageUrl } from "@/lib/data/recipeImages";
import { Notice, Screen, ScreenHeader } from "@/components/ui";
import { RecipeCardSkeleton } from "@/components/skeletons";
import { RecipeIngredientsAndSteps } from "./RecipeActions";
import { RecipeHero } from "./RecipeHero";

/**
 * Das Rezept — ein Screen, eine Fläche (DESIGN.md: `--card` = `--bg`, keine
 * eigene Kartenfläche).
 *
 * Oben das Foto (mit eigenem, kleinerem Seitenrand, bis unter die
 * Statusleiste), ohne Titel darauf; darunter auf `--bg` Titel, Merkmal-Chips,
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

      {/* Titel und Kenndaten stehen unter dem Foto, auf `--bg` — nicht mehr
          darauf (DESIGN.md „Rezeptdetail": „titel" 20px Unbounded). */}
      <div className="px-5 pt-[18px]">
        <h1
          lang="de"
          className="font-display text-[20px] leading-[1.3] font-bold text-text [hyphens:auto] [text-wrap:balance]"
        >
          {value.title}
        </h1>
        {value.totalTimeMin && (
          <p className="tabular mt-2 text-[13px] text-muted">
            {value.totalTimeMin} Min
          </p>
        )}
        {value.tags.length > 0 && (
          <ul className="mt-3.5 flex flex-wrap gap-2">
            {value.tags.map((tag) => (
              <li
                key={tag}
                className="flex h-7 items-center rounded-pill border border-border px-3 text-[12px] font-semibold text-text"
              >
                {tag}
              </li>
            ))}
          </ul>
        )}
        <div className="mt-5 h-px bg-border" />
      </div>

      <ListAwareIngredients recipe={value} />

      {value.notes && (
        <section className="px-5 pb-6">
          <h2 className="text-[12px] font-extrabold tracking-[0.12em] text-muted uppercase">
            Notizen
          </h2>
          <p className="mt-3 whitespace-pre-line text-[15px] leading-[1.55]">
            {value.notes}
          </p>
        </section>
      )}

      {value.sourceUrl && (
        <div className="px-5 pb-6 text-[13px] text-muted">
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
        </div>
      )}
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
