"use client";

import { startTransition, useId, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { parseIngredient } from "@/lib/core/parseIngredient";
import { parseAmount } from "@/lib/core/numbers";
import { formatNumber } from "@/lib/core/format";
import { UNITS } from "@/lib/core/units";
import {
  CONFIDENCE_REVIEW_THRESHOLD,
  type ParsedIngredient,
  type ParsedRecipe,
} from "@/lib/core/types";
import { getBrowserSupabase } from "@/lib/client/supabase";
import { saveRecipe, type Recipe, type RecipeSource } from "@/lib/data/recipes";
import { refreshRecipeOnLists } from "@/lib/data/shoppingList";
import { removeRecipeImage, uploadRecipeImage } from "@/lib/data/recipeImages";
import { RecipeImageField, type ImageChange } from "./RecipeImageField";
import { Button, Card, Field, Notice, Textarea } from "@/components/ui";

/**
 * Rezept anlegen und ändern — und zugleich der Prüf-Screen.
 *
 * Der Aufbau ist der, den P4 und P5 brauchen werden: oben die Eckdaten, unten
 * die Zutatenzeilen einzeln editierbar, unsichere farbig markiert. Ein Import
 * füllt später denselben Zustand, statt einen zweiten Bildschirm zu bekommen —
 * geprüft wird immer hier, egal woher das Rezept kam.
 *
 * Die Mengen liegen als getippter Text im Zustand, nicht als Zahl. Erst beim
 * Speichern macht `parseAmount` daraus einen exakten Dezimal-String. Sonst
 * würde „1,5" schon beim Tippen durch eine Fließkommazahl laufen, und
 * Bruchangaben wie „1/2" ließen sich gar nicht erst eintippen.
 */

interface Row {
  key: string;
  name: string;
  amount: string;
  unitCode: string;
  note: string;
  toTaste: boolean;
  groupLabel: string;
  rawText: string;
  confidence: number;
}

let counter = 0;
const nextKey = () => `zeile-${++counter}`;

function emptyRow(): Row {
  return {
    key: nextKey(),
    name: "",
    amount: "",
    unitCode: "",
    note: "",
    toTaste: false,
    groupLabel: "",
    rawText: "",
    confidence: 1,
  };
}

/**
 * Ein Rezept, das aus einem Import kommt und noch nicht gespeichert ist.
 *
 * Absichtlich derselbe Weg für alle Quellen: Webseite, eingefügtes JSON,
 * eingefügter Text. Sie füllen diesen Entwurf, und geprüft wird danach immer
 * in diesem Formular — ein Import springt nie an der Kontrolle vorbei.
 */
export interface ImportDraft extends ParsedRecipe {
  totalTimeMin?: number | null;
  sourceType: Exclude<RecipeSource, "manual">;
  sourceUrl: string | null;
}

/** Eine geparste Zutat in eine bearbeitbare Formularzeile. */
function toRow(parsed: ParsedIngredient, group: string): Row {
  return {
    key: nextKey(),
    name: parsed.name,
    amount: parsed.amount === null ? "" : formatNumber(parsed.amount, 4),
    unitCode: parsed.unitCode ?? "",
    note: parsed.note ?? "",
    toTaste: parsed.toTaste,
    groupLabel: parsed.groupLabel ?? group,
    rawText: parsed.rawText,
    confidence: parsed.confidence,
  };
}

function rowsFromRecipe(recipe: Recipe): Row[] {
  return recipe.ingredients.map((line) => ({
    key: nextKey(),
    name: line.ingredientName ?? line.rawText,
    amount: line.amount === null ? "" : formatNumber(line.amount, 4),
    unitCode: line.unitCode ?? "",
    note: line.note ?? "",
    toTaste: line.toTaste,
    groupLabel: line.groupLabel ?? "",
    rawText: line.rawText,
    confidence: line.confidence,
  }));
}

/**
 * Eingetippte Zeilen in Zutatenzeilen verwandeln.
 *
 * Eine Zeile, die auf „:" endet, ist eine Zwischenüberschrift („Für die
 * Sauce:") und gilt für alles, was darunter folgt — genau so stehen Rezepte
 * in Kochbüchern.
 */
function rowsFromText(text: string): Row[] {
  const rows: Row[] = [];
  let group = "";

  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    if (line.endsWith(":")) {
      group = line.slice(0, -1).trim();
      continue;
    }

    rows.push(toRow(parseIngredient(line), group));
  }

  return rows;
}

export function RecipeForm({
  householdId,
  recipe,
  draft,
}: {
  householdId: string;
  recipe?: Recipe;
  /** Vorbelegung aus einem Import; `recipe` hat Vorrang. */
  draft?: ImportDraft;
}) {
  const router = useRouter();
  const bulkId = useId();

  const [title, setTitle] = useState(recipe?.title ?? draft?.title ?? "");
  const [servings, setServings] = useState(
    String(recipe?.baseServings ?? draft?.servings ?? 4),
  );
  const [servingsLabel, setServingsLabel] = useState(
    recipe?.servingsLabel ?? draft?.servingsLabel ?? "Portionen",
  );
  const [time, setTime] = useState(
    String(recipe?.totalTimeMin ?? draft?.totalTimeMin ?? "") || "",
  );
  const [tags, setTags] = useState((recipe?.tags ?? []).join(", "));
  const [instructions, setInstructions] = useState(
    (recipe?.instructions ?? draft?.instructions ?? []).join("\n"),
  );
  const [notes, setNotes] = useState(recipe?.notes ?? "");
  const [rows, setRows] = useState<Row[]>(() => {
    if (recipe) return rowsFromRecipe(recipe);
    if (draft && draft.ingredients.length > 0) {
      return draft.ingredients.map((line) => toRow(line, ""));
    }
    return [emptyRow()];
  });
  const [imageChange, setImageChange] = useState<ImageChange>({ kind: "keep" });
  const [bulk, setBulk] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function updateRow(key: string, change: Partial<Row>) {
    setRows((current) =>
      current.map((row) =>
        row.key === key
          ? {
              // Wer eine Zeile anfasst, hat sie geprüft — die Markierung darf
              // dann weg, sonst bleibt sie für immer stehen.
              ...row,
              ...change,
              confidence: 1,
              // Eine eingetippte Menge widerspricht „nach Geschmack".
              toTaste:
                change.amount !== undefined && change.amount.trim() !== ""
                  ? false
                  : (change.toTaste ?? row.toTaste),
            }
          : row,
      ),
    );
  }

  function takeOverBulk() {
    const parsed = rowsFromText(bulk);
    if (parsed.length === 0) return;
    setRows((current) => {
      // Die eine leere Startzeile ist kein Inhalt, sondern ein Angebot.
      const kept = current.filter((row) => row.name.trim() !== "");
      return [...kept, ...parsed];
    });
    setBulk("");
  }

  async function save() {
    setError("");

    const baseServings = Number.parseInt(servings, 10);
    if (!title.trim()) {
      setError("Das Rezept braucht einen Titel.");
      return;
    }
    if (!Number.isFinite(baseServings) || baseServings <= 0) {
      setError("Die Portionszahl muss größer als 0 sein.");
      return;
    }

    const ingredients = rows
      .filter((row) => row.name.trim() !== "")
      .map((row) => {
        const amount = row.amount.trim() ? parseAmount(row.amount) : null;
        return {
          name: row.name.trim(),
          amount,
          amountMax: null,
          unitCode: row.unitCode || null,
          note: row.note.trim() || null,
          toTaste: row.toTaste,
          groupLabel: row.groupLabel.trim() || null,
          rawText: row.rawText.trim() || row.name.trim(),
          confidence: row.confidence,
        };
      });

    const supabase = getBrowserSupabase();
    if (!supabase) {
      setError("Supabase ist nicht konfiguriert.");
      return;
    }

    setBusy(true);
    const saved = await saveRecipe(supabase, householdId, {
      id: recipe?.id ?? null,
      title: title.trim(),
      baseServings,
      servingsLabel: servingsLabel.trim() || "Portionen",
      totalTimeMin: time.trim() ? Number.parseInt(time, 10) : null,
      instructions: instructions
        .split("\n")
        .map((step) => step.trim())
        .filter(Boolean),
      notes: notes.trim() || null,
      tags: tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      // Herkunft festhalten: beim Ändern die bisherige, beim Import die des
      // Entwurfs. Sie steht später auf der Rezeptkarte als Quellenangabe.
      sourceType: recipe?.sourceType ?? draft?.sourceType ?? "manual",
      sourceUrl: recipe?.sourceUrl ?? draft?.sourceUrl ?? null,
      ingredients,
    });

    if (!saved.ok) {
      setBusy(false);
      setError(saved.error);
      return;
    }

    // Bild erst jetzt: der Speicherpfad enthält die Rezept-ID, und die steht
    // vor dem Speichern noch nicht fest. Schlägt das Bild fehl, ist das Rezept
    // trotzdem sicher — deshalb nur ein Hinweis und kein Abbruch.
    let imageWarning = "";
    if (imageChange.kind === "replace") {
      const uploaded = await uploadRecipeImage(
        supabase,
        householdId,
        saved.value.recipeId,
        imageChange.file,
      );
      if (!uploaded.ok) imageWarning = uploaded.error;
    } else if (imageChange.kind === "remove" && recipe?.imagePath) {
      const removedImage = await removeRecipeImage(
        supabase,
        saved.value.recipeId,
        recipe.imagePath,
      );
      if (!removedImage.ok) imageWarning = removedImage.error;
    }

    // Lag das Rezept auf der Liste, hingen deren Herkunftszeilen an den eben
    // ersetzten Zutatenzeilen. Frisch gerechnet wieder drauflegen, sonst fehlt
    // es im Supermarkt.
    const refreshed = await refreshRecipeOnLists(
      supabase,
      saved.value.recipeId,
      saved.value.lists,
    );
    setBusy(false);
    if (!refreshed.ok) {
      setError(refreshed.error);
      return;
    }
    if (imageWarning) {
      // Das Rezept steht — nur das Bild fehlt. Hier bleiben, damit der Hinweis
      // gelesen wird und das Bild gleich noch einmal versucht werden kann.
      setError(`Rezept gespeichert, aber: ${imageWarning}`);
      return;
    }

    // In einer Transition: das Ziel hat eine eigene Suspense-Grenze und kann
    // sofort erscheinen, während die Daten nachströmen. Ohne die Transition
    // hinge das Formular noch an der Navigation, obwohl längst alles
    // gespeichert ist.
    //
    // `busy` bleibt hier bewusst stehen und wird nicht vorgezogen: Speichern
    // ist mehrstufig — Rezept, Bild, Einkaufsliste nachziehen — und ein
    // zweites Antippen mittendrin legt das Rezept doppelt an. Das ist kein
    // Wartebalken aus Verlegenheit, sondern eine Sperre mit Grund.
    startTransition(() => {
      router.push(`/rezepte/${saved.value.recipeId}`);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      {error && <Notice tone="error">{error}</Notice>}

      <Card>
        <div className="space-y-4">
          <Field
            label="Titel"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Rindergulasch"
            autoCapitalize="sentences"
          />
          <div className="flex gap-3">
            <div className="w-24">
              <Field
                label="Portionen"
                type="number"
                inputMode="numeric"
                min={1}
                value={servings}
                onChange={(event) => setServings(event.target.value)}
              />
            </div>
            <div className="flex-1">
              <Field
                label="Einheit"
                value={servingsLabel}
                onChange={(event) => setServingsLabel(event.target.value)}
                placeholder="Portionen"
              />
            </div>
            <div className="w-24">
              <Field
                label="Minuten"
                type="number"
                inputMode="numeric"
                min={1}
                value={time}
                onChange={(event) => setTime(event.target.value)}
              />
            </div>
          </div>
          <RecipeImageField
            initialPath={recipe?.imagePath ?? null}
            onChange={setImageChange}
          />
        </div>
      </Card>

      <Card>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          Zutaten
        </h2>

        <div className="mt-4 space-y-3">
          {rows.map((row) => {
            const unsure = row.confidence < CONFIDENCE_REVIEW_THRESHOLD;
            return (
              <div
                key={row.key}
                className={
                  "rounded-xl border p-3 " +
                  (unsure ? "border-warn bg-warn/10" : "border-border bg-bg")
                }
              >
                {row.groupLabel && (
                  <p className="mb-2 text-[13px] font-medium text-muted">
                    {row.groupLabel}
                  </p>
                )}
                <div className="flex gap-2">
                  <input
                    aria-label="Zutat"
                    value={row.name}
                    onChange={(event) =>
                      updateRow(row.key, { name: event.target.value })
                    }
                    placeholder="Zutat"
                    autoCapitalize="sentences"
                    className="h-11 min-w-0 flex-1 rounded-lg border border-border bg-surface px-3 text-base outline-none focus:border-accent"
                  />
                  <button
                    type="button"
                    aria-label={`${row.name || "Zeile"} entfernen`}
                    onClick={() =>
                      setRows((current) =>
                        current.filter((other) => other.key !== row.key),
                      )
                    }
                    className="h-11 w-11 shrink-0 rounded-lg border border-border text-muted press"
                  >
                    ✕
                  </button>
                </div>
                <div className="mt-2 flex gap-2">
                  <input
                    aria-label="Menge"
                    value={row.amount}
                    onChange={(event) =>
                      updateRow(row.key, { amount: event.target.value })
                    }
                    placeholder="Menge"
                    inputMode="decimal"
                    className="h-11 w-24 shrink-0 rounded-lg border border-border bg-surface px-3 text-base outline-none focus:border-accent"
                  />
                  <select
                    aria-label="Einheit"
                    value={row.unitCode}
                    onChange={(event) =>
                      updateRow(row.key, { unitCode: event.target.value })
                    }
                    className="h-11 w-28 shrink-0 appearance-none rounded-lg border border-border bg-surface px-2 text-base outline-none focus:border-accent"
                  >
                    <option value="">ohne</option>
                    {UNITS.map((unit) => (
                      <option key={unit.code} value={unit.code}>
                        {unit.display}
                      </option>
                    ))}
                  </select>
                  <input
                    aria-label="Notiz"
                    value={row.note}
                    onChange={(event) =>
                      updateRow(row.key, { note: event.target.value })
                    }
                    placeholder="Notiz"
                    className="h-11 min-w-0 flex-1 rounded-lg border border-border bg-surface px-3 text-base outline-none focus:border-accent"
                  />
                </div>
                {unsure && (
                  <p className="mt-2 text-[13px] text-muted">
                    Diese Zeile war nicht eindeutig — bitte kurz prüfen.
                  </p>
                )}
                {row.toTaste && (
                  <p className="mt-2 text-[13px] text-muted">
                    Ohne Menge („nach Geschmack“). Sie kommt trotzdem auf die
                    Einkaufsliste.
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => setRows((current) => [...current, emptyRow()])}
          className="mt-3 h-11 w-full rounded-lg border border-border text-[15px] press"
        >
          Zeile hinzufügen
        </button>

        <div className="mt-6 border-t border-border pt-4">
          <Textarea
            label="Mehrere Zeilen auf einmal"
            hint="Eine Zutat pro Zeile, so wie sie im Rezept steht. Eine Zeile mit Doppelpunkt wird zur Zwischenüberschrift."
            id={bulkId}
            rows={4}
            value={bulk}
            onChange={(event) => setBulk(event.target.value)}
            placeholder={"15 g Butterschmalz\n2 große Zwiebel(n) (gewürfelt)\nSalz und Pfeffer"}
          />
          <button
            type="button"
            onClick={takeOverBulk}
            className="mt-3 h-11 w-full rounded-lg border border-border text-[15px] press"
          >
            Zeilen übernehmen
          </button>
        </div>
      </Card>

      <Card>
        <div className="space-y-4">
          <Textarea
            label="Zubereitung"
            hint="Ein Schritt pro Zeile."
            rows={6}
            value={instructions}
            onChange={(event) => setInstructions(event.target.value)}
          />
          <Textarea
            label="Notizen"
            rows={2}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
          <Field
            label="Schlagwörter"
            value={tags}
            onChange={(event) => setTags(event.target.value)}
            placeholder="Sonntagsessen, Schmorgericht"
            hint="Mit Komma getrennt."
          />
        </div>
      </Card>

      <div className="space-y-2">
        <Button onClick={() => void save()} disabled={busy}>
          {busy ? "Wird gespeichert …" : "Speichern"}
        </Button>
        <p className="text-center text-[15px]">
          <Link
            href={recipe ? `/rezepte/${recipe.id}` : "/rezepte"}
            className="text-muted underline underline-offset-4"
          >
            Abbrechen
          </Link>
        </p>
      </div>
    </div>
  );
}
