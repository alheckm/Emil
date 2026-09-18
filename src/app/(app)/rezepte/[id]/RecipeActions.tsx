"use client";

import { startTransition, useOptimistic, useState } from "react";
import { useRouter } from "next/navigation";
import { buildListItems } from "@/lib/core/mergeList";
import { formatAmount } from "@/lib/core/format";
import { ingredientImage } from "@/lib/core/ingredientImages";
import { scaleAmount } from "@/lib/core/scale";
import { getBrowserSupabase } from "@/lib/client/supabase";
import { deleteRecipe, type Recipe } from "@/lib/data/recipes";
import { addRecipeToList, removeRecipeFromList } from "@/lib/data/shoppingList";
import { CheckIcon, MinusIcon, PlusIcon } from "@/components/icons";
import { Notice } from "@/components/ui";

/**
 * Der Zutaten-Abschnitt der Rezeptkarte: Portionen, Zutaten, Einkaufsliste.
 *
 * Der Aufbau folgt dem Entwurf:
 *
 *     Zutaten                        [−  2  +]
 *     ○ ○ ○ ○ →          (Fotos, waagerecht)
 *     200 g   Nudeln     (die genauen Mengen)
 *     ＋ Einkaufsliste
 *
 * Die Reihe mit den Kreisen ist der auffälligste Zug des Entwurfs und
 * gleichzeitig das, was man im Laden zuerst liest: ein Bild ist schneller
 * erfasst als ein Wort. Sie ersetzt die Liste darunter aber nicht — Emil lebt
 * von den umgerechneten Mengen, und die stehen in keinem Kreis.
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
export function IngredientsSection({
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

  // Alle benannten Zutaten kommen in die Reihe, auch die ohne Foto: dort
  // steht der Anfangsbuchstabe. Ein leerer Kasten wäre keine Option, und eine
  // Reihe, die stillschweigend die Hälfte der Zutaten wegließe, auch nicht.
  const rail = recipe.ingredients
    .map((line) => ({
      id: line.id,
      name: line.ingredientName,
      src: line.ingredientName ? ingredientImage(line.ingredientName) : null,
    }))
    .filter(
      (item): item is { id: string; name: string; src: string | null } =>
        item.name !== null,
    );

  const onList = planned !== null;
  const changed = onList && planned !== servings;

  return (
    <section className="px-5 pb-6 pt-5">
      {error && (
        <div className="mb-4">
          <Notice tone="error">{error}</Notice>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <h2 className="font-display text-[19px] font-semibold leading-[1.25]">
          Zutaten
        </h2>
        <ServingStepper
          value={servings}
          label={recipe.servingsLabel}
          onChange={setServings}
        />
      </div>

      {rail.length > 0 && (
        /* Bis an den Kartenrand und darüber hinaus: der angeschnittene vierte
           Kreis ist im Entwurf die Einladung zu wischen. Mit Innenabstand
           innerhalb der Scrollfläche, damit der erste Kreis trotzdem bündig
           unter der Überschrift steht. */
        <ul className="ingredient-rail -mx-5 mt-5 flex gap-4 overflow-x-auto px-5">
          {rail.map((item) => (
            <IngredientItem key={item.id} name={item.name} src={item.src} />
          ))}
        </ul>
      )}

      <ul className="mt-6 space-y-2">
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
                <p className="mb-2 mt-4 font-display text-[17px] font-semibold leading-[1.25]">
                  {line.groupLabel}
                </p>
              )}
              <div className="flex gap-3 text-[15px] leading-[1.55]">
                {/* Die Menge steht rechtsbündig in einer eigenen Spalte:
                    untereinander gelesen sind so alle Zahlen an derselben
                    Kante, und beim Umrechnen springt nichts. */}
                <span className="w-20 shrink-0 text-right font-medium tabular-nums">
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

      <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2">
        <ShoppingListButton
          state={!onList ? "off" : changed ? "stale" : "on"}
          disabled={!listId}
          onClick={onAdd}
        />
        {onList && (
          <button
            type="button"
            onClick={onRemove}
            className="min-h-11 text-[13px] text-muted underline underline-offset-4 press-flat"
          >
            Von der Liste nehmen
          </button>
        )}
      </div>
    </section>
  );
}

/** Ein Kreis in der Zutatenreihe: Foto oben, Name darunter. */
function IngredientItem({ name, src }: { name: string; src: string | null }) {
  return (
    <li className="flex w-18 shrink-0 flex-col items-center gap-2">
      <span className="flex size-18 items-center justify-center overflow-hidden rounded-pill bg-chip">
        {src ? (
          /* Kein next/image: die Datei liegt schon in genau der Größe im
             public-Ordner, in der sie gebraucht wird. Der Optimierer hätte
             hier nichts zu tun und käme nur als zusätzliche Runde dazu. */
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={src}
            alt=""
            width={192}
            height={192}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <span aria-hidden className="font-display text-[26px] text-muted">
            {name.slice(0, 1).toUpperCase()}
          </span>
        )}
      </span>
      {/* Zwei Zeilen, dann Schluss: „Gemüsebrühe" darf umbrechen, aber die
          Reihe muss gleich hoch bleiben, sonst franst sie aus.
          `hyphens-auto` ist hier keine Feinheit: deutsche Zutatennamen sind
          oft ein einziges langes Wort, und ohne Trennung steht „Champignons"
          breiter da als sein Kreis und schiebt sich unter den Nachbarn. */}
      <span className="line-clamp-2 hyphens-auto break-words text-center text-[13px] font-medium leading-[1.2]">
        {name}
      </span>
    </li>
  );
}

/**
 * Der Portionswähler.
 *
 * Bewusst klein: er ist eine Nebenfunktion und darf nicht mit dem Rezepttitel
 * konkurrieren. Sichtbar sind 32-px-Kreise in einer Pille, die Trefferfläche
 * ist mit 44 px aber deutlich größer als das, was man sieht. Sichtbare Größe
 * und Trefferfläche sind zwei verschiedene Maße — der Daumen tippt im Stehen,
 * und unter 44 px trifft er daneben.
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
    <div className="flex items-center rounded-pill bg-soft">
      <StepperButton
        label="Eine Portion weniger"
        disabled={value <= 1}
        onClick={() => onChange(Math.max(1, value - 1))}
      >
        <MinusIcon className="h-4 w-4" />
      </StepperButton>
      <span
        aria-live="polite"
        className="min-w-[4.5rem] text-center text-[13px] font-medium"
      >
        {/* `key` sorgt dafür, dass die neue Zahl kurz aufblendet statt hart
            umzuspringen — 150 ms, mehr wäre eine Animation. */}
        <span key={value} className="count-swap tabular-nums">
          {value}
        </span>{" "}
        {label}
      </span>
      <StepperButton
        label="Eine Portion mehr"
        onClick={() => onChange(value + 1)}
      >
        <PlusIcon className="h-4 w-4" />
      </StepperButton>
    </div>
  );
}

function StepperButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="flex h-11 w-11 items-center justify-center press tap-target disabled:opacity-30"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-pill bg-control">
        {children}
      </span>
    </button>
  );
}

/**
 * „Auf die Einkaufsliste“ — eine zurückhaltende Aktion, kein großer CTA.
 *
 * Der Zustandswechsel läuft nicht über Grün, sondern über einen sehr leisen
 * Flächenwechsel und ein Häkchen. Das ist im Entwurf die einzige Art, in der
 * überhaupt etwas „bestätigt“ aussieht.
 *
 * Drei Zustände statt zwei: liegt das Rezept mit einer **anderen**
 * Portionszahl auf der Liste, ist der Knopf wieder offen und beschriftet mit
 * „Liste aktualisieren“ — sonst sähe die Liste bestätigt aus, während sie
 * andere Mengen enthält als das, was hier gerade auf dem Schirm steht.
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
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || on}
      aria-live="polite"
      className={
        "inline-flex h-9 items-center gap-2 rounded-soft px-3.5 text-[13px] " +
        "font-medium transition-colors duration-200 ease-out press tap-target " +
        "disabled:cursor-default " +
        (on
          ? "bg-soft text-text"
          : "border border-border text-text disabled:opacity-40")
      }
    >
      {on ? <CheckIcon className="h-4 w-4" /> : <PlusIcon className="h-4 w-4" />}
      {on
        ? "Auf der Liste"
        : state === "stale"
          ? "Liste aktualisieren"
          : "Einkaufsliste"}
    </button>
  );
}

/**
 * Löschen — ganz unten, nach allem anderen.
 *
 * Es gehört nicht zwischen Zutaten und Zubereitung: dort steht das Rezept, und
 * ein roter Knopf mittendrin wäre genau die Standard-UI, die der Entwurf
 * vermeidet. Unter dem letzten Abschnitt, mit reichlich Luft davor, steht es
 * da, wo die Verwaltung hingehört — leise, aber erreichbar. Der Weg zum
 * Bearbeiten sitzt oben rechts auf dem Foto (siehe RecipeHero).
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
    <div className="space-y-3 px-5 pb-10 pt-4">
      {error && <Notice tone="error">{error}</Notice>}
      <div className="text-center">
        <button
          type="button"
          disabled={deleting}
          onClick={() => (ask ? void onDelete() : setAsk(true))}
          className={
            "min-h-11 rounded-soft px-4 text-[13px] press tap-target " +
            "disabled:opacity-50 " +
            // Leise über Größe und Position, nicht über Blässe: `--muted`
            // wäre hier korrekt lesbar, zöge aber die Aufmerksamkeit auf
            // einen Unterschied, der keiner sein soll.
            (ask ? "border border-accent text-accent" : "text-muted")
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
