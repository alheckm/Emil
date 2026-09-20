/**
 * Schreibwerkzeug für die automatische Rezept-Pflege (docs/plan-rezept-pflege.md).
 *
 * Der wöchentliche headless-Claude-Lauf bekommt keinen direkten Supabase-
 * Zugriff — er ruft ausschließlich diese Befehle auf. Jeder Schreibbefehl legt
 * VOR der Änderung einen Snapshot in `recipe_revisions` an und bricht mit
 * Exit-Code 1 ab, wenn irgendetwas nicht passt. Geurteilt wird woanders
 * (Tags, Saison, Nährwerte, Mengen in der Anleitung); dieses Skript prüft nur
 * noch Form und schreibt gezielt — nie über `save_recipe`, das beim Ändern
 * alle Zutatenzeilen ersetzt (supabase/migrations/0009_rezepte_speichern.sql).
 *
 * Auth wie scripts/ingredient-images/find-missing.mjs: SUPABASE_SECRET_KEY aus
 * .env.local, umgeht RLS bewusst — ein Skript mit Zugriff auf alle Haushalte.
 *
 *   node scripts/rezept-pflege/pflege.mjs <befehl> [optionen]
 *
 * Befehle:
 *   liste [--offen|--alle] [--limit N]
 *   schreibe <id> --datei patch.json [--probe] [--lauf-id ID]
 *   zutat <id> --datei zuordnung.json [--lauf-id ID]
 *   bild <id> --datei bild.jpg [--lauf-id ID]
 *   verlauf <id>
 *   zurueck <revision-id>
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));

// Node löst relative TS-Importe ohne Dateiendung nicht auf — src/lib/core/steps.ts
// lässt sich darum nicht direkt importieren. Dieselbe Marker-Syntax hier separat
// nachgebildet, nur für die Prüfung vor dem Schreiben; Quelle der Wahrheit für
// das Auflösen bleibt src/lib/core/steps.ts.
function stepMarkerPositions(steps) {
  const positions = new Set();
  for (const step of steps) {
    for (const match of step.matchAll(/\{\{z:(\d+)\}\}/g)) {
      positions.add(Number(match[1]));
    }
  }
  return [...positions];
}

function loadEnv(path) {
  const env = {};
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].trim();
  }
  return env;
}

const env = loadEnv(ROOT + ".env.local");
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SECRET_KEY;
if (!url || !key) {
  console.error("NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SECRET_KEY fehlen in .env.local");
  process.exit(1);
}

const supabase = createClient(url, key);

function fail(message) {
  console.error(message);
  process.exit(1);
}

function flag(args, name) {
  return args.includes(`--${name}`);
}

function option(args, name) {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? undefined : args[i + 1];
}

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (err) {
    fail(`Kann ${path} nicht lesen: ${err.message}`);
  }
}

// -------------------------------------------------------------- Rezepte laden --

const RECIPE_COLUMNS =
  "id, household_id, title, base_servings, servings_label, total_time_min, " +
  "tags, season_months, nutrition, image_path, instructions, notes, " +
  "pflege_stand, updated_at, " +
  "recipe_ingredients ( id, position, group_label, raw_text, amount::text, " +
  "amount_max::text, unit_code, ingredient_id, note, to_taste, " +
  "parse_confidence::text, ingredients ( display_name ) )";

async function loadRecipe(id) {
  const { data, error } = await supabase
    .from("recipes")
    .select(RECIPE_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error) fail(dbError(error));
  if (!data) fail(`Kein Rezept mit id ${id}`);
  return data;
}

function toIngredientJson(row) {
  return {
    id: row.id,
    position: row.position,
    groupLabel: row.group_label,
    rawText: row.raw_text,
    amount: row.amount,
    amountMax: row.amount_max,
    unitCode: row.unit_code,
    ingredientId: row.ingredient_id,
    ingredientName: row.ingredients?.display_name ?? null,
    note: row.note,
    toTaste: row.to_taste,
    confidence: Number(row.parse_confidence ?? 1),
  };
}

function offenSeit(recipe) {
  if (!recipe.pflege_stand) return true;
  return new Date(recipe.pflege_stand) < new Date(recipe.updated_at);
}

function findeLuecken(recipe, ingredients) {
  const gefunden = [];
  if (recipe.tags.length === 0) gefunden.push("keine Tags");
  if (recipe.season_months.length === 0) gefunden.push("keine Saison");
  if (!recipe.nutrition) gefunden.push("keine Nährwerte");
  if (!recipe.image_path) gefunden.push("kein Bild");
  const unsicher = ingredients.filter((i) => i.confidence < 0.8 || !i.ingredientId);
  if (unsicher.length > 0) {
    gefunden.push(`${unsicher.length} unsichere Zutatenzeile(n): ${unsicher.map((i) => i.position).join(", ")}`);
  }
  return gefunden;
}

function dbError(error) {
  return `Datenbankfehler: ${error.message}`;
}

// -------------------------------------------------------------------- liste --

async function cmdListe(args) {
  const alle = flag(args, "alle");
  const limit = Number(option(args, "limit") ?? Infinity);

  const { data, error } = await supabase.from("recipes").select(RECIPE_COLUMNS);
  if (error) fail(dbError(error));

  const rezepte = data
    .map((r) => {
      const ingredients = [...(r.recipe_ingredients ?? [])]
        .sort((a, b) => a.position - b.position)
        .map(toIngredientJson);
      return {
        id: r.id,
        householdId: r.household_id,
        title: r.title,
        baseServings: r.base_servings,
        servingsLabel: r.servings_label,
        totalTimeMin: r.total_time_min,
        tags: r.tags,
        seasonMonths: r.season_months,
        nutrition: r.nutrition,
        imagePath: r.image_path,
        instructions: r.instructions,
        notes: r.notes,
        pflegeStand: r.pflege_stand,
        offen: offenSeit(r),
        luecken: findeLuecken(r, ingredients),
        ingredients,
      };
    })
    .filter((r) => alle || r.offen)
    .slice(0, limit);

  console.log(JSON.stringify(rezepte, null, 2));
}

// ---------------------------------------------------------------- snapshot --

async function snapshot(recipe, ingredientRows, felder, laufId) {
  const { error } = await supabase.from("recipe_revisions").insert({
    recipe_id: recipe.id,
    household_id: recipe.household_id,
    vorher: {
      recipe: {
        title: recipe.title,
        base_servings: recipe.base_servings,
        servings_label: recipe.servings_label,
        total_time_min: recipe.total_time_min,
        tags: recipe.tags,
        season_months: recipe.season_months,
        nutrition: recipe.nutrition,
        image_path: recipe.image_path,
        instructions: recipe.instructions,
        notes: recipe.notes,
      },
      ingredients: ingredientRows.map((row) => ({
        id: row.id,
        ingredient_id: row.ingredient_id,
        parse_confidence: row.parse_confidence,
      })),
    },
    felder,
    lauf_id: laufId ?? null,
  });
  if (error) fail(`Snapshot fehlgeschlagen, nichts geschrieben: ${dbError(error)}`);
}

// ------------------------------------------------------------------ schreibe --

const NUTRITION = z
  .object({
    kcal: z.number().nonnegative(),
    protein_g: z.number().nonnegative(),
    carbs_g: z.number().nonnegative(),
    fat_g: z.number().nonnegative(),
  })
  .nullable();

const PATCH = z
  .object({
    tags: z.array(z.string().trim().min(1)).max(10).optional(),
    season_months: z.array(z.number().int().min(1).max(12)).optional(),
    nutrition: NUTRITION.optional(),
    instructions: z.array(z.string()).optional(),
  })
  .refine((p) => Object.keys(p).length > 0, "Patch ist leer — nichts zu schreiben");

async function cmdSchreibe(args) {
  const id = args[0];
  const datei = option(args, "datei");
  if (!id || !datei) fail("Aufruf: schreibe <id> --datei patch.json [--probe] [--lauf-id ID]");

  const parsed = PATCH.safeParse(readJson(datei));
  if (!parsed.success) fail(`Patch ungültig: ${parsed.error.message}`);
  const patch = parsed.data;

  const recipe = await loadRecipe(id);
  const ingredientRows = recipe.recipe_ingredients ?? [];

  if (patch.instructions) {
    const positions = new Set(ingredientRows.map((r) => r.position));
    const unbekannt = stepMarkerPositions(patch.instructions).filter((p) => !positions.has(p));
    if (unbekannt.length > 0) {
      fail(`Anleitung verweist auf unbekannte Zutaten-Position(en): ${unbekannt.join(", ")}`);
    }
  }

  const update = {};
  if (patch.tags) update.tags = patch.tags;
  if (patch.season_months) update.season_months = [...new Set(patch.season_months)];
  if ("nutrition" in patch) update.nutrition = patch.nutrition;
  if (patch.instructions) update.instructions = patch.instructions;

  if (flag(args, "probe")) {
    console.log("Vorher:", JSON.stringify(Object.fromEntries(Object.keys(update).map((k) => [k, recipe[k]])), null, 2));
    console.log("Nachher:", JSON.stringify(update, null, 2));
    return;
  }

  const laufId = option(args, "lauf-id");
  await snapshot(recipe, ingredientRows, Object.keys(update), laufId);

  const { error } = await supabase
    .from("recipes")
    .update({ ...update, pflege_stand: new Date().toISOString() })
    .eq("id", id);
  if (error) fail(dbError(error));

  console.log(`Geschrieben: ${id} (${Object.keys(update).join(", ")})`);
}

// --------------------------------------------------------------------- zutat --

const ZUORDNUNG = z.array(
  z.object({
    position: z.number().int(),
    name: z.string().trim().min(1),
    confidence: z.number().min(0).max(1).optional(),
  }),
);

async function cmdZutat(args) {
  const id = args[0];
  const datei = option(args, "datei");
  if (!id || !datei) fail("Aufruf: zutat <id> --datei zuordnung.json [--lauf-id ID]");

  const parsed = ZUORDNUNG.safeParse(readJson(datei));
  if (!parsed.success) fail(`Zuordnung ungültig: ${parsed.error.message}`);

  const recipe = await loadRecipe(id);
  const ingredientRows = recipe.recipe_ingredients ?? [];
  const byPosition = new Map(ingredientRows.map((r) => [r.position, r]));

  const unbekannt = parsed.data.filter((eintrag) => !byPosition.has(eintrag.position));
  if (unbekannt.length > 0) {
    fail(`Unbekannte Position(en): ${unbekannt.map((eintrag) => eintrag.position).join(", ")}`);
  }

  const laufId = option(args, "lauf-id");
  await snapshot(recipe, ingredientRows, ["recipe_ingredients"], laufId);

  for (const eintrag of parsed.data) {
    const row = byPosition.get(eintrag.position);
    const { data: ingredientId, error: rpcError } = await supabase.rpc("resolve_ingredient", {
      p_household_id: recipe.household_id,
      p_name: eintrag.name,
    });
    if (rpcError) fail(dbError(rpcError));

    const { error } = await supabase
      .from("recipe_ingredients")
      .update({
        ingredient_id: ingredientId,
        parse_confidence: eintrag.confidence ?? 0.95,
      })
      .eq("id", row.id);
    if (error) fail(dbError(error));
  }

  console.log(`Zugeordnet: ${parsed.data.length} Zeile(n) in ${id}`);
}

// ---------------------------------------------------------------------- bild --

const EXT_TO_CONTENT_TYPE = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp" };

async function cmdBild(args) {
  const id = args[0];
  const datei = option(args, "datei");
  if (!id || !datei) fail("Aufruf: bild <id> --datei bild.jpg [--lauf-id ID]");

  const recipe = await loadRecipe(id);
  const extension = (datei.toLowerCase().match(/\.(jpe?g|png|webp)$/)?.[1] ?? "jpg").replace("jpeg", "jpg");
  const contentType = EXT_TO_CONTENT_TYPE[extension] ?? "image/jpeg";
  // Pfadregel wie src/lib/data/recipeImages.ts:22 — der erste Abschnitt ist
  // die Storage-RLS-Zugriffsgrenze, deshalb exakt {household_id}/{recipe_id}/…
  const path = `${recipe.household_id}/${id}/${crypto.randomUUID()}.${extension}`;

  const file = readFileSync(datei);
  const { error: uploadError } = await supabase.storage
    .from("recipe-images")
    .upload(path, file, { contentType, upsert: false });
  if (uploadError) fail(`Upload fehlgeschlagen: ${uploadError.message}`);

  const laufId = option(args, "lauf-id");
  await snapshot(recipe, recipe.recipe_ingredients ?? [], ["image_path"], laufId);

  const { error } = await supabase
    .from("recipes")
    .update({ image_path: path, pflege_stand: new Date().toISOString() })
    .eq("id", id);
  if (error) {
    // Rezept nicht aktualisiert — verwaiste Datei wieder entfernen, statt sie
    // im Bucket liegen zu lassen (Muster aus uploadRecipeImage()).
    await supabase.storage.from("recipe-images").remove([path]);
    fail(dbError(error));
  }

  console.log(`Bild gesetzt: ${id} → ${path}`);
}

// ------------------------------------------------------------------- verlauf --

async function cmdVerlauf(args) {
  const id = args[0];
  if (!id) fail("Aufruf: verlauf <id>");

  const { data, error } = await supabase
    .from("recipe_revisions")
    .select("id, felder, quelle, lauf_id, created_at")
    .eq("recipe_id", id)
    .order("created_at", { ascending: false });
  if (error) fail(dbError(error));

  console.log(JSON.stringify(data, null, 2));
}

async function cmdZurueck(args) {
  const revisionId = args[0];
  if (!revisionId) fail("Aufruf: zurueck <revision-id>");

  const { data: revision, error } = await supabase
    .from("recipe_revisions")
    .select("*")
    .eq("id", revisionId)
    .maybeSingle();
  if (error) fail(dbError(error));
  if (!revision) fail(`Keine Revision mit id ${revisionId}`);

  const recipe = await loadRecipe(revision.recipe_id);
  const ingredientRows = recipe.recipe_ingredients ?? [];

  // Der aktuelle Stand wird selbst noch einmal gesichert — auch ein "zurück"
  // muss sich zurücknehmen lassen.
  await snapshot(recipe, ingredientRows, ["*restore*"], null);

  const { error: updateError } = await supabase
    .from("recipes")
    .update({ ...revision.vorher.recipe, pflege_stand: new Date().toISOString() })
    .eq("id", revision.recipe_id);
  if (updateError) fail(dbError(updateError));

  for (const zeile of revision.vorher.ingredients) {
    const { error: ingredientError } = await supabase
      .from("recipe_ingredients")
      .update({ ingredient_id: zeile.ingredient_id, parse_confidence: zeile.parse_confidence })
      .eq("id", zeile.id);
    if (ingredientError) fail(dbError(ingredientError));
  }

  console.log(`Zurückgespielt: ${revision.recipe_id} auf den Stand vor ${revision.created_at}`);
}

// -------------------------------------------------------------------- main --

const [befehl, ...args] = process.argv.slice(2);

switch (befehl) {
  case "liste":
    await cmdListe(args);
    break;
  case "schreibe":
    await cmdSchreibe(args);
    break;
  case "zutat":
    await cmdZutat(args);
    break;
  case "bild":
    await cmdBild(args);
    break;
  case "verlauf":
    await cmdVerlauf(args);
    break;
  case "zurueck":
    await cmdZurueck(args);
    break;
  default:
    fail(
      "Befehl fehlt oder unbekannt. Verfügbar: liste, schreibe, zutat, bild, verlauf, zurueck.\n" +
        "Siehe Kopfkommentar in diesem Skript für die Aufrufe.",
    );
}
