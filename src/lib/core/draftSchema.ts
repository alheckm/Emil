import { z } from "zod";
import { parseAmount } from "./numbers";
import { IMPLICIT_COUNT_UNIT, findUnit } from "./units";
import type { ParsedIngredient, ParsedRecipe } from "./types";

/**
 * Das Emil-Austauschformat: ein Rezept als JSON.
 *
 * Genutzt vom Einfügen-Import (du digitalisierst mit deinem Claude-Plan und
 * kopierst das Ergebnis zurück) und später unverändert von einem optionalen
 * API-Modul. Weil beide Wege dasselbe Schema füllen, bleibt der Prüf-Screen
 * identisch — deshalb wäre der API-Weg ein Zusatz und kein Umbau.
 */

const AmountValue = z.union([z.number(), z.string()]).nullish();

export const DraftIngredientSchema = z.object({
  amount: AmountValue,
  amount_max: AmountValue,
  unit: z.string().nullish(),
  name: z.string().min(1, "Name fehlt"),
  note: z.string().nullish(),
  to_taste: z.boolean().nullish(),
});

export const RecipeDraftSchema = z.object({
  title: z.string().min(1, "Titel fehlt"),
  servings: z.number().int().positive().nullish(),
  servings_label: z.string().nullish(),
  ingredients: z.array(DraftIngredientSchema).min(1, "keine Zutaten enthalten"),
  instructions: z.array(z.string()).nullish(),
});

export type RecipeDraft = z.infer<typeof RecipeDraftSchema>;

export type DraftParseResult =
  | { ok: true; recipe: ParsedRecipe }
  | { ok: false; errors: string[] };

/**
 * Holt das JSON-Objekt aus einem eingefügten Text.
 *
 * claude.ai liefert das JSON gern in einem ```json-Block und manchmal mit einem
 * Satz davor („Hier ist das Rezept:"). Beides abzufangen ist billiger, als dich
 * jedes Mal den Text zurechtschneiden zu lassen.
 */
export function extractJsonObject(input: string): string | null {
  let text = input.trim();
  if (!text) return null;

  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) text = fence[1].trim();

  if (text.startsWith("{")) return text;

  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  return text.slice(start, end + 1);
}

/** Übersetzt Zod-Meldungen in Sätze, die im Prüf-Screen etwas nützen. */
export function formatDraftErrors(error: z.ZodError): string[] {
  return error.issues.map((issue) => {
    const path = issue.path;
    if (path[0] === "ingredients" && typeof path[1] === "number") {
      const field = path[2] ? `„${String(path[2])}“` : "";
      return `Zutat ${path[1] + 1}: ${issue.message}${field ? ` (${field})` : ""}`;
    }
    if (path.length === 0) return issue.message;
    return `${path.map(String).join(".")}: ${issue.message}`;
  });
}

/** Wandelt ein validiertes Draft-Objekt in Emils internes Rezept um. */
export function draftToRecipe(draft: RecipeDraft): ParsedRecipe {
  const ingredients: ParsedIngredient[] = draft.ingredients.map((raw) => {
    const amount = raw.amount == null ? null : parseAmount(String(raw.amount));
    const amountMax =
      raw.amount_max == null ? null : parseAmount(String(raw.amount_max));

    let name = raw.name.trim();
    let unitCode: string | null = null;
    let confidence = 1;

    if (raw.unit) {
      const unit = findUnit(raw.unit);
      if (unit) {
        unitCode = unit.code;
      } else {
        // Unbekannte Einheit („1 Schuss Weißwein"): nicht wegwerfen, sondern
        // vor den Namen ziehen und die Zeile zur Kontrolle markieren.
        name = `${raw.unit.trim()} ${name}`.trim();
        confidence = 0.6;
      }
    } else if (amount !== null) {
      unitCode = IMPLICIT_COUNT_UNIT;
    }

    // Menge angekündigt, aber nicht lesbar — das muss auffallen.
    if (raw.amount != null && amount === null) confidence = 0.4;

    return {
      rawText: [raw.amount, raw.unit, raw.name].filter(Boolean).join(" ").trim(),
      amount,
      amountMax,
      unitCode,
      name,
      note: raw.note?.trim() || null,
      toTaste: raw.to_taste ?? false,
      confidence,
      groupLabel: null,
    };
  });

  return {
    title: draft.title.trim(),
    servings: draft.servings ?? null,
    servingsLabel: draft.servings_label?.trim() || null,
    ingredients,
    instructions: (draft.instructions ?? [])
      .map((step) => step.trim())
      .filter(Boolean),
  };
}

/** Vollständiger Weg von eingefügtem Text zum Entwurf. */
export function parseDraftJson(input: string): DraftParseResult {
  const json = extractJsonObject(input);
  if (!json) {
    return {
      ok: false,
      errors: [
        "Im eingefügten Text steckt kein JSON-Objekt. Erwartet wird ein Block, " +
          "der mit { beginnt und mit } endet.",
      ],
    };
  }

  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    return {
      ok: false,
      errors: [
        "Das JSON ist beschädigt und konnte nicht gelesen werden — oft fehlt ein " +
          "Komma oder eine schließende Klammer. Am einfachsten in claude.ai neu " +
          "kopieren.",
      ],
    };
  }

  const parsed = RecipeDraftSchema.safeParse(data);
  if (!parsed.success) return { ok: false, errors: formatDraftErrors(parsed.error) };
  return { ok: true, recipe: draftToRecipe(parsed.data) };
}
