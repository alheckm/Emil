"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { buildListItems } from "@/lib/core/mergeList";
import { formatAmount } from "@/lib/core/format";
import { scaleAmount } from "@/lib/core/scale";
import { getBrowserSupabase } from "@/lib/client/supabase";
import { deleteRecipe, type Recipe } from "@/lib/data/recipes";
import { addRecipeToList, removeRecipeFromList } from "@/lib/data/shoppingList";
import { Button, Card, Notice } from "@/components/ui";

/**
 * Portionswähler, Zutatenliste und der Weg auf die Einkaufsliste.
 *
 * Der Portionswähler rechnet bei jedem Tippen **aus der Basismenge** neu, nie
 * aus dem zuletzt angezeigten Wert. Sonst käme ein Weg von 4 auf 6 und zurück
 * auf 4 nicht mehr bei der Originalmenge heraus (siehe src/lib/core/scale.ts).
 *
 * Liegt das Rezept schon auf der Liste, startet der Wähler bei der dort
 * eingeplanten Zahl: wer die Portionen ändert und erneut auflegt, korrigiert
 * damit die Liste, statt die Menge zu verdoppeln — das übernimmt
 * `add_recipe_to_list`, indem es zuerst den eigenen früheren Anteil entfernt.
 */
export function RecipeActions({
  listId,
  recipe,
  plannedServings,
}: {
  listId: string | null;
  recipe: Recipe;
  plannedServings: number | null;
}) {
  const router = useRouter();
  const [servings, setServings] = useState(
    plannedServings ?? recipe.baseServings,
  );
  const [busy, setBusy] = useState<"add" | "remove" | "delete" | null>(null);
  const [error, setError] = useState("");
  const [askDelete, setAskDelete] = useState(false);

  function client() {
    const supabase = getBrowserSupabase();
    if (!supabase) setError("Supabase ist nicht konfiguriert.");
    return supabase;
  }

  async function onAdd() {
    if (!listId) return;
    const supabase = client();
    if (!supabase) return;

    setError("");
    setBusy("add");
    const items = buildListItems(
      recipe.ingredients,
      recipe.baseServings,
      servings,
    );
    const result = await addRecipeToList(
      supabase,
      listId,
      recipe.id,
      servings,
      items,
    );
    setBusy(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  async function onRemove() {
    if (!listId) return;
    const supabase = client();
    if (!supabase) return;

    setError("");
    setBusy("remove");
    const result = await removeRecipeFromList(supabase, listId, recipe.id);
    setBusy(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  async function onDelete() {
    const supabase = client();
    if (!supabase) return;

    setError("");
    setBusy("delete");

    // Erst von der Liste nehmen: die Kaskade würde zwar die Herkunftszeilen
    // mitnehmen, aber eine dadurch leere Listenzeile bliebe ohne Menge stehen.
    if (listId) {
      const removed = await removeRecipeFromList(supabase, listId, recipe.id);
      if (!removed.ok) {
        setBusy(null);
        setError(removed.error);
        return;
      }
    }

    const result = await deleteRecipe(supabase, recipe.id);
    if (!result.ok) {
      setBusy(null);
      setError(result.error);
      return;
    }
    router.push("/rezepte");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {error && <Notice tone="error">{error}</Notice>}

      <Card>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-muted">
              {recipe.servingsLabel}
            </p>
            <p className="mt-1 text-[13px] text-muted">
              Grundrezept: {recipe.baseServings}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Eine Portion weniger"
              onClick={() => setServings((value) => Math.max(1, value - 1))}
              className="h-12 w-12 rounded-xl border border-border text-xl active:opacity-70"
            >
              −
            </button>
            <span
              aria-live="polite"
              className="w-10 text-center text-xl font-semibold tabular-nums"
            >
              {servings}
            </span>
            <button
              type="button"
              aria-label="Eine Portion mehr"
              onClick={() => setServings((value) => value + 1)}
              className="h-12 w-12 rounded-xl border border-border text-xl active:opacity-70"
            >
              +
            </button>
          </div>
        </div>

        <ul className="mt-5 space-y-2">
          {recipe.ingredients.map((line, index) => {
            const previous = recipe.ingredients[index - 1];
            const showGroup =
              line.groupLabel && line.groupLabel !== previous?.groupLabel;
            const { text } = formatAmount(
              scaleAmount(line.amount, recipe.baseServings, servings),
              line.unitCode,
              scaleAmount(line.amountMax, recipe.baseServings, servings),
            );

            return (
              <li key={line.id}>
                {showGroup && (
                  <p className="mb-1 mt-3 text-[13px] font-medium text-muted">
                    {line.groupLabel}
                  </p>
                )}
                <div className="flex gap-3 text-[15px]">
                  <span className="w-24 shrink-0 text-right tabular-nums text-muted">
                    {text || (line.toTaste ? "etwas" : "")}
                  </span>
                  <span className="min-w-0">
                    {line.ingredientName ?? line.rawText}
                    {line.note && (
                      <span className="text-muted"> ({line.note})</span>
                    )}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      </Card>

      <div className="space-y-2">
        <Button onClick={() => void onAdd()} disabled={busy !== null || !listId}>
          {busy === "add"
            ? "Einen Moment …"
            : plannedServings !== null
              ? "Liste aktualisieren"
              : "Auf die Einkaufsliste"}
        </Button>

        {plannedServings !== null && (
          <Button
            variant="quiet"
            onClick={() => void onRemove()}
            disabled={busy !== null}
          >
            {busy === "remove" ? "Einen Moment …" : "Von der Liste nehmen"}
          </Button>
        )}

        <div className="flex gap-2">
          <Link
            href={`/rezepte/${recipe.id}/bearbeiten`}
            className="flex h-12 flex-1 items-center justify-center rounded-xl border border-border bg-surface text-[15px] active:opacity-70"
          >
            Bearbeiten
          </Link>
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => (askDelete ? void onDelete() : setAskDelete(true))}
            className="h-12 flex-1 rounded-xl border border-accent text-[15px] text-accent active:opacity-70 disabled:opacity-50"
          >
            {busy === "delete"
              ? "Wird gelöscht …"
              : askDelete
                ? "Wirklich löschen?"
                : "Löschen"}
          </button>
        </div>
      </div>
    </div>
  );
}
