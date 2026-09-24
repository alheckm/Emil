"use client";

import { startTransition, useOptimistic, useState } from "react";
import { useRouter } from "next/navigation";
import { buildListItems } from "@/lib/core/mergeList";
import { formatAmount } from "@/lib/core/format";
import { scaleAmount } from "@/lib/core/scale";
import { resolveSteps } from "@/lib/core/steps";
import { getBrowserSupabase } from "@/lib/client/supabase";
import {
  deleteRecipe,
  type Recipe,
  type RecipeNutrition,
} from "@/lib/data/recipes";
import { addRecipeToList, removeRecipeFromList } from "@/lib/data/shoppingList";
import { CheckIcon, MinusIcon, PlusIcon } from "@/components/icons";
import { Button, Notice } from "@/components/ui";

/**
 * Der Zutaten-Abschnitt der Rezeptkarte: Portionen, Zutaten, Einkaufsliste.
 *
 * Der Aufbau:
 *
 *     Zutaten            [−  2  +]  ＋ Einkaufsliste
 *     200 g   Nudeln     (die genauen Mengen)
 *
 * Keine Foto-Kacheln hier — die Referenz kennt für Zutaten keine
 * Entsprechung, und die genauen Mengen stehen ohnehin nur in der Liste, nie
 * in einer Kachel. Zutatenfotos bleiben der Einkaufsliste vorbehalten
 * (`ListView.tsx`), wo sie beim Einsortieren im Regal tatsächlich helfen.
 *
 * Der Portionswähler rechnet bei jedem Tippen **aus der Basismenge** neu, nie
 * aus dem zuletzt angezeigten Wert. Sonst käme ein Weg von 4 auf 6 und zurück
 * auf 4 nicht mehr bei der Originalmenge heraus (siehe src/lib/core/scale.ts).
 *
 * Liegt das Rezept schon auf der Liste, startet der Wähler bei der dort
 * eingeplanten Zahl: wer die Portionen ändert und erneut auflegt, korrigiert
 * damit die Liste, statt die Menge zu verdoppeln — das übernimmt
 * `add_recipe_to_list`, indem es zuerst den eigenen früheren Anteil entfernt.
 *
 * Die Zubereitung hängt hier mit dran, nicht in einer eigenen Komponente:
 * die automatische Rezept-Pflege schreibt Mengenverweise (`{{z:N}}`, siehe
 * src/lib/core/steps.ts) in die Anleitung, damit „300 g Möhren anschwitzen"
 * mit demselben Portionswähler mitrechnet wie die Zutatenliste darüber —
 * beides braucht also denselben `servings`-Zustand.
 */
export function RecipeIngredientsAndSteps({
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
  const [error, setError] = useState("");

  // Was der Knopf anzeigt, noch bevor der Server geantwortet hat. Geht die
  // Anfrage schief, fällt der vorgezogene Wert von selbst wieder auf den
  // Serverstand zurück — genau das macht `useOptimistic` gegenüber einem
  // eigenen Zustand einfacher: kein Zurücknehmen von Hand.
  const [planned, setPlanned] = useOptimistic(plannedServings);

  function client() {
    const supabase = getBrowserSupabase();
    if (!supabase) setError("Supabase ist nicht konfiguriert.");
    return supabase;
  }

  function onAdd() {
    if (!listId) return;
    const supabase = client();
    if (!supabase) return;

    setError("");
    const items = buildListItems(
      recipe.ingredients,
      recipe.baseServings,
      servings,
    );

    startTransition(async () => {
      // Der Knopf sagt sofort „liegt drauf“. Steht die Verbindung nicht,
      // springt er zurück und die Meldung erklärt es.
      setPlanned(servings);

      const result = await addRecipeToList(
        supabase,
        listId,
        recipe.id,
        servings,
        items,
      );
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function onRemove() {
    if (!listId) return;
    const supabase = client();
    if (!supabase) return;

    setError("");
    startTransition(async () => {
      setPlanned(null);

      const result = await removeRecipeFromList(supabase, listId, recipe.id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  const onList = planned !== null;
  const changed = onList && planned !== servings;

  const steps = resolveSteps(
    recipe.instructions,
    recipe.ingredients,
    recipe.baseServings,
    servings,
  );

  return (
    <>
      <section className="px-5 pb-6">
      {error && (
        <div className="mb-4">
          <Notice tone="error">{error}</Notice>
        </div>
      )}

      <div className="flex items-center justify-between gap-4">
        <span className="font-display text-[15px] font-bold text-text">
          Zutaten
        </span>
        <ServingStepper
          value={servings}
          label={recipe.servingsLabel}
          onChange={setServings}
        />
      </div>

      <ul className="mt-2 divide-y divide-border">
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
                <p className="pt-4 pb-1 text-[12px] font-bold tracking-[0.06em] text-muted uppercase">
                  {line.groupLabel}
                </p>
              )}
              {/* Menge links in fester Spaltenbreite (tabellarisch), Name
                  rechts daneben — DESIGN.md „Liste/Zahlen": „Menge 14px
                  tabellarisch (fixe Spaltenbreite) · Name 15px proportional". */}
              <div className="tabular flex items-baseline gap-3.5 py-[11px]">
                <span className="w-[68px] shrink-0 text-[14px] text-muted">
                  {text || (line.toTaste ? "etwas" : "")}
                </span>
                <span className="min-w-0 text-[15px] text-text">
                  {line.ingredientName ?? line.rawText}
                  {line.note && (
                    <span className="text-[13px] text-muted"> ({line.note})</span>
                  )}
                </span>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="mt-6">
        <ShoppingListButton
          state={!onList ? "off" : changed ? "stale" : "on"}
          disabled={!listId}
          onClick={onList && !changed ? onRemove : onAdd}
        />
      </div>
      </section>

      {recipe.nutrition && <NutritionTable nutrition={recipe.nutrition} />}

      {steps.length > 0 && <RecipeSteps steps={steps} />}
    </>
  );
}

/**
 * Die Nährwerttabelle — geschätzte Werte pro Portion (`baseServings`), von
 * der automatischen Rezept-Pflege befüllt (`docs/plan-rezept-pflege.md`).
 * Jeder Wert in einem farbigen Kreis — nimmt das Kreis-Schema der
 * Einkaufsliste noch einmal auf, statt eine dritte Darstellung für Zutaten-
 * Mengen zu erfinden. Farben aus derselben gedeckten Palette wie die
 * Foto-Kreise (`categoryColor.ts`), nur abgedunkelt statt pastellig — bei
 * den hellen Ausgangstönen war Weiß auf dem Kreis nicht lesbar. Fix statt
 * gehasht: dieselben vier Werte stehen immer in derselben Reihenfolge.
 */
function NutritionTable({ nutrition }: { nutrition: RecipeNutrition }) {
  const stats: [string, string, string][] = [
    [String(nutrition.kcal), "kcal", "#8A5A3E"],
    [`${nutrition.proteinG} g`, "Eiweiß", "#556B45"],
    [`${nutrition.fatG} g`, "Fett", "#8C6A32"],
    [`${nutrition.carbsG} g`, "Kohlenhydrate", "#4F6E73"],
  ];

  return (
    <section className="border-t border-border px-5 py-6">
      <h2 className="font-display text-[15px] font-bold text-text">Nährwert</h2>
      <p className="mt-1 text-[12.5px] text-muted">Pro Portion</p>
      <div className="mt-4 flex">
        {stats.map(([value, label, color]) => (
          <div key={label} className="flex flex-1 flex-col items-center gap-[7px]">
            <span
              className="tabular font-display flex h-[68px] w-[68px] items-center justify-center rounded-full text-[15px] font-bold text-white"
              style={{ background: color }}
            >
              {value}
            </span>
            <span className="text-[11.5px] text-muted">{label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

/**
 * Die Zubereitung.
 *
 * Die Ziffer steht in einem Quadrat in `--accent` (DESIGN.md: der
 * Ziffernkasten ist das Signature-Component dieses Screens). `--accent`
 * fällt in dieser Richtung mit `--text` zusammen — die Fläche ist Navy, kein
 * separater Markenton. `aria-hidden`, weil eine geordnete Liste die Nummer
 * ohnehin ansagt und sie sonst doppelt käme.
 *
 * Mengenverweise (`{{z:N}}`, siehe src/lib/core/steps.ts) sind hier bereits
 * aufgelöst — die Komponente selbst weiß nichts von ihnen.
 */
function RecipeSteps({ steps }: { steps: string[] }) {
  return (
    <section className="border-t border-border px-5 py-6">
      <h2 className="mb-3.5 font-display text-[15px] font-bold text-text">
        Anleitung
      </h2>
      <ol className="space-y-[18px]">
        {steps.map((step, index) => (
          <li key={index} className="flex gap-3.5">
            <span
              aria-hidden
              className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full bg-accent text-[13px] font-bold text-accent-ink"
            >
              {index + 1}
            </span>
            <span className="min-w-0 pt-0.5 text-[15px] leading-[1.55]">{step}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

/**
 * Der Portionswähler.
 *
 * Kein Kasten mehr — bloße Ziffern und Vorzeichen wie im Komponenten-
 * Specimen, die Trefferfläche kommt über Padding (44 px), nicht über eine
 * sichtbare Fläche. Sichtbare Größe und Trefferfläche sind zwei verschiedene
 * Maße — der Daumen tippt im Stehen, und unter 44 px trifft er daneben.
 *
 * `aria-live="polite"` an der Zahl: wer den Knopf per VoiceOver drückt, hört
 * sonst nur „Plus", aber nie das Ergebnis.
 */
function ServingStepper({
  value,
  label,
  onChange,
}: {
  value: number;
  label: string;
  onChange: (next: number) => void;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <StepperButton
        label="Eine Portion weniger"
        disabled={value <= 1}
        onClick={() => onChange(Math.max(1, value - 1))}
      >
        <MinusIcon className="h-[13px] w-[13px]" strokeWidth={2.2} />
      </StepperButton>
      {/* `key` sorgt dafür, dass die neue Zahl kurz aufblendet statt hart
          umzuspringen — 150 ms, mehr wäre eine Animation. */}
      <span
        aria-live="polite"
        className="tabular min-w-[66px] text-center text-[14px] font-semibold text-text"
      >
        <span key={value} className="count-swap">
          {value} {label}
        </span>
      </span>
      <StepperButton
        label="Eine Portion mehr"
        accent
        onClick={() => onChange(value + 1)}
      >
        <PlusIcon className="h-[13px] w-[13px]" strokeWidth={2.2} />
      </StepperButton>
    </div>
  );
}

function StepperButton({
  label,
  disabled,
  accent,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  accent?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="flex h-11 w-11 items-center justify-center press-flat tap-target disabled:opacity-30"
    >
      <span
        className={
          "flex h-[30px] w-[30px] items-center justify-center rounded-full border " +
          (accent ? "border-accent bg-accent text-accent-ink" : "border-border text-text")
        }
      >
        {children}
      </span>
    </button>
  );
}

/**
 * „Auf die Einkaufsliste" — der eine Primärknopf dieses Screens, wie im
 * Komponenten-Specimen bildschirmbreit unter den Zutaten statt als schmale
 * Pille daneben.
 *
 * Drei Zustände statt zwei: liegt das Rezept mit einer **anderen**
 * Portionszahl auf der Liste, ist der Knopf wieder offen und beschriftet mit
 * „Liste aktualisieren" — sonst sähe die Liste bestätigt aus, während sie
 * andere Mengen enthält als das, was hier gerade auf dem Schirm steht.
 *
 * Im Zustand „on" nimmt derselbe Knopf das Rezept wieder von der Liste —
 * kein eigener Knopf dafür, sonst zwei Wege zum selben Ziel auf engem Raum.
 * Dafür wechselt er auf `secondary`: Entfernen ist hier keine Aktion, die
 * genauso laut auftreten soll wie das Hinzufügen.
 */
function ShoppingListButton({
  state,
  disabled,
  onClick,
}: {
  state: "off" | "on" | "stale";
  disabled?: boolean;
  onClick: () => void;
}) {
  const on = state === "on";

  return (
    <Button
      type="button"
      variant={on ? "secondary" : "primary"}
      onClick={onClick}
      disabled={disabled}
      aria-label={on ? "Von der Liste nehmen" : undefined}
      aria-live="polite"
    >
      {on ? <CheckIcon className="h-4 w-4" /> : <PlusIcon className="h-4 w-4" />}
      {on
        ? "Auf der Liste"
        : state === "stale"
          ? "Liste aktualisieren"
          : "Einkaufsliste"}
    </Button>
  );
}

/**
 * Löschen — auf der Bearbeiten-Seite, ganz unten, nach dem Formular.
 *
 * Nicht auf dem Rezept-Screen: dort steht das Rezept, und ein roter Knopf
 * mittendrin wäre genau die Standard-UI, die der Entwurf vermeidet. Löschen
 * ist Verwaltung, keine Leseaktion — sie gehört dorthin, wo auch sonst
 * verwaltet wird, unter dem letzten Feld, mit reichlich Luft davor.
 */
export function DeleteRecipe({
  listId,
  recipeId,
}: {
  listId: string | null;
  recipeId: string;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [ask, setAsk] = useState(false);
  // Hier muss tatsächlich gewartet werden: die Seite wechselt danach, und ein
  // zweites Antippen liefe ins Leere.
  const [deleting, setDeleting] = useState(false);

  async function onDelete() {
    const supabase = getBrowserSupabase();
    if (!supabase) {
      setError("Supabase ist nicht konfiguriert.");
      return;
    }

    setError("");
    setDeleting(true);

    // Erst von der Liste nehmen: die Kaskade würde zwar die Herkunftszeilen
    // mitnehmen, aber eine dadurch leere Listenzeile bliebe ohne Menge stehen.
    if (listId) {
      const removed = await removeRecipeFromList(supabase, listId, recipeId);
      if (!removed.ok) {
        setDeleting(false);
        setError(removed.error);
        return;
      }
    }

    const result = await deleteRecipe(supabase, recipeId);
    if (!result.ok) {
      setDeleting(false);
      setError(result.error);
      return;
    }
    router.push("/rezepte");
    router.refresh();
  }

  return (
    <div className="space-y-3 pb-10 pt-4">
      {error && <Notice tone="error">{error}</Notice>}
      <div className="text-center">
        <button
          type="button"
          disabled={deleting}
          onClick={() => (ask ? void onDelete() : setAsk(true))}
          className={
            "min-h-11 rounded-pill px-4 text-[14px] font-semibold press tap-target " +
            "disabled:opacity-50 " +
            // Leise über Größe und Position, nicht über Blässe: `--muted`
            // wäre hier korrekt lesbar, zöge aber die Aufmerksamkeit auf
            // einen Unterschied, der keiner sein soll.
            (ask ? "border border-danger text-danger" : "text-muted")
          }
        >
          {deleting
            ? "Wird gelöscht …"
            : ask
              ? "Wirklich löschen?"
              : "Rezept löschen"}
        </button>
      </div>
    </div>
  );
}
