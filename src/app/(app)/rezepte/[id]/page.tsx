import { Suspense } from "react";
import { notFound } from "next/navigation";
import { requireHousehold } from "@/lib/server/household";
import { getListState } from "@/lib/server/listState";
import { getRecipe, type Recipe } from "@/lib/data/recipes";
import { getRecipeImageUrl } from "@/lib/data/recipeImages";
import { Card, Notice, Screen, ScreenHeader } from "@/components/ui";
import {
  HeaderSkeleton,
  ImageSkeleton,
  RecipeBodySkeleton,
} from "@/components/skeletons";
import { RecipeActions } from "./RecipeActions";

/**
 * Das Rezept — vorher die langsamste Seite der App.
 *
 * Hier lagen sieben Netzrunden hintereinander, bevor überhaupt etwas zu sehen
 * war: zweimal Sitzung prüfen, Haushalt, Rezept, aktive Liste, geplante
 * Portionen, signierte Bildadresse. Jede wartete auf die vorige.
 *
 * Aufgeteilt ist das jetzt so:
 *
 * - **Rahmen** (`Screen`) ist statisch und steht sofort.
 * - **Rezept** hängt an der Adresse (`params.id`), und URL-Daten kommen nicht
 *   in die App Shell. Es strömt also nach — aber hinter einem Skelett, das
 *   dieselben Maße hat, statt hinter einer eingefrorenen Seite. Die Verweise
 *   von der Übersicht tragen `prefetch`, damit es meist schon da ist.
 * - **Bild** bekommt eine eigene Grenze. Die signierte Adresse ist eine
 *   weitere Runde zum Storage, und das darf den Text nie aufhalten.
 * - **Listenstand** kommt aus `getListState()` und liegt damit schon im
 *   Zwischenspeicher, bevor geklickt wurde.
 */
export default function RecipePage(props: PageProps<"/rezepte/[id]">) {
  return (
    <Screen>
      <Suspense
        fallback={
          <>
            <HeaderSkeleton />
            <ImageSkeleton />
            <RecipeBodySkeleton />
          </>
        }
      >
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
      <>
        <ScreenHeader title="Rezept" />
        <Notice tone="error">{context.error}</Notice>
      </>
    );
  }

  const recipe = await getRecipe(context.supabase, id);
  if (!recipe.ok) {
    return (
      <>
        <ScreenHeader title="Rezept" />
        <Notice tone="error">{recipe.error}</Notice>
      </>
    );
  }
  // Ein Rezept aus einem fremden Haushalt kommt wegen RLS gar nicht erst an;
  // für den Bildschirm ist beides dasselbe: es gibt hier nichts.
  if (!recipe.value) notFound();

  const value = recipe.value;

  return (
    <>
      <ScreenHeader
        title={value.title}
        lead={value.totalTimeMin ? `${value.totalTimeMin} Minuten` : undefined}
      />

      {value.imagePath && (
        <Suspense fallback={<ImageSkeleton />}>
          <RecipeImage imagePath={value.imagePath} />
        </Suspense>
      )}

      <ListAwareActions recipe={value} />

      {value.instructions.length > 0 && (
        <Card>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
            Zubereitung
          </h2>
          <ol className="mt-3 space-y-3 text-[15px] leading-relaxed">
            {value.instructions.map((step, index) => (
              <li key={index} className="flex gap-3">
                <span className="shrink-0 text-muted">{index + 1}.</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </Card>
      )}

      {value.notes && (
        <Card>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
            Notizen
          </h2>
          <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed">
            {value.notes}
          </p>
        </Card>
      )}

      {(value.tags.length > 0 || value.sourceUrl) && (
        <div className="space-y-3 text-[13px] text-muted">
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
    </>
  );
}

async function ListAwareActions({ recipe }: { recipe: Recipe }) {
  const list = await getListState();

  return (
    <>
      {list.error && <Notice tone="error">{list.error}</Notice>}
      <RecipeActions
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
       ab — der Optimierer würde daraus nur wechselnde Cache-Einträge machen. */
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={imageUrl}
      alt=""
      className="aspect-[4/3] w-full rounded-2xl border border-border object-cover"
    />
  );
}
