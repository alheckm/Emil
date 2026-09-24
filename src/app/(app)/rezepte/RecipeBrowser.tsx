"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useEffect,
  useId,
  useMemo,
  useOptimistic,
  useState,
  startTransition,
} from "react";
import type { RecipeSummary } from "@/lib/data/recipes";
import { getRecipe } from "@/lib/data/recipes";
import { addRecipeToList, removeRecipeFromList } from "@/lib/data/shoppingList";
import { buildListItems } from "@/lib/core/mergeList";
import { formatRelativeTime } from "@/lib/core/format";
import { getBrowserSupabase } from "@/lib/client/supabase";
import { Notice } from "@/components/ui";
import {
  CheckIcon,
  ClockIcon,
  GridIcon,
  ImportIcon,
  MoreIcon,
  RowsIcon,
  SearchIcon,
} from "@/components/icons";

/**
 * „Home" (DESIGN.md): Wortmarke, Feed/Kacheln-Umschalter, Suche,
 * Schlagwort-Filter und die Trefferliste in einem.
 *
 * Zusammengelegt, weil sie zusammengehören: der Filter entscheidet, was die
 * Liste zeigt, und genau das soll ohne Umweg über den Server passieren.
 *
 * Die beiden Filter werden bewusst **unterschiedlich** behandelt:
 *
 * - **Schlagwörter** filtern rein im Browser. Jedes Rezept trägt seine
 *   `tags` ohnehin schon mit sich; ein Serverbesuch dafür wäre eine Netzrunde
 *   für eine Array-Prüfung. Die Adresse wird trotzdem mitgeführt, aber über
 *   `history.replaceState` — das ändert die Adresszeile, ohne zu navigieren,
 *   und bleibt damit teilbar. Zwei feste Pillen laufen über denselben
 *   Mechanismus, sind aber keine Schlagwörter: „≤ 30 Min" prüft
 *   `totalTimeMin`, „Saisonal" den aktuellen Monat gegen `seasonMonths` — bis
 *   die geplante automatische Verschlagwortung `seasonMonths` befüllt, findet
 *   die Pille nichts.
 * - **Der Suchtext** bleibt auf dem Server. Gesucht wird per Volltext über
 *   Titel *und* Zutaten; das im Browser nachzubauen hieße, alle Zutaten aller
 *   Rezepte mitzuschicken und die Suche trotzdem anders aussehen zu lassen als
 *   auf dem Server. Er läuft deshalb weiter über die Adresse — aber entprellt
 *   und in einer Transition, sodass die Liste währenddessen blass wird statt
 *   einzufrieren.
 *
 * Die Feed/Kacheln-Umschaltung ist reiner Anzeigezustand (nicht in der
 * Adresse) — DESIGN.md zeigt sie als lokalen Umschalter ohne eigene URL.
 */

/** Reservierte Werte im `filter`-Parameter, die keine Schlagwörter sind. */
const QUICK_ZEIT = "__zeit30";
const QUICK_SAISON = "__saisonal";

export function RecipeBrowser({
  recipes,
  tags,
  planned,
  images,
  listId,
}: {
  recipes: RecipeSummary[];
  tags: { tag: string; count: number }[];
  planned: Record<string, number>;
  /** Pfad → signierte URL, gebündelt geholt (siehe getRecipeImageUrls). */
  images: Record<string, string>;
  listId: string | null;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const inputId = useId();

  const [view, setView] = useState<"feed" | "grid">("feed");

  const currentQuery = params.get("q") ?? "";
  const [value, setValue] = useState(currentQuery);
  const [lastQuery, setLastQuery] = useState(currentQuery);

  // Kommt die Änderung von außen (Zurück-Knopf, geteilter Link), muss das Feld
  // folgen — sonst zeigt es etwas anderes an als die Liste darunter.
  //
  // Bewusst während des Renderns und nicht in einem Effekt: React rät davon ab,
  // Zustand in einem Effekt zu spiegeln, weil das einen zweiten Durchlauf mit
  // sichtbar veraltetem Feld erzeugt. Beim Tippen ist das ein No-Op, weil die
  // Adresse dann bereits dem Feld entspricht.
  if (currentQuery !== lastQuery) {
    setLastQuery(currentQuery);
    setValue(currentQuery);
  }

  const [activeFilter, setActiveFilter] = useOptimistic(params.get("filter"));
  const [searching, setSearching] = useOptimistic(false);

  const isZeitFilter = activeFilter === QUICK_ZEIT;
  const isSaisonFilter = activeFilter === QUICK_SAISON;
  const activeTag =
    activeFilter && !isZeitFilter && !isSaisonFilter ? activeFilter : null;

  useEffect(() => {
    if (value === currentQuery) return;
    const timer = setTimeout(() => {
      startTransition(() => {
        setSearching(true);
        const next = new URLSearchParams(params.toString());
        if (value.trim()) next.set("q", value.trim());
        else next.delete("q");
        router.replace(next.toString() ? `/rezepte?${next}` : "/rezepte");
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [value, currentQuery, params, router, setSearching]);

  function toggleFilter(filterValue: string) {
    const next = activeFilter === filterValue ? null : filterValue;

    // `useOptimistic` greift im aktuellen Frame — anders als ein `useState`-
    // Setter, der in der Transition aufgeschoben würde. Der Chip ist also
    // aktiv, bevor irgendetwas anderes passiert.
    startTransition(() => {
      setActiveFilter(next);

      // Adresse nachziehen, ohne zu navigieren: kein Server, kein Rendern,
      // aber der Link bleibt teilbar und der Zurück-Knopf verhält sich richtig.
      const search = new URLSearchParams(params.toString());
      if (next) search.set("filter", next);
      else search.delete("filter");
      window.history.replaceState(
        null,
        "",
        search.toString() ? `/rezepte?${search}` : "/rezepte",
      );
    });
  }

  // Nur für den Monatsvergleich der „Saisonal"-Pille — einmal pro Mount reicht,
  // ein Rezept wechselt seine Saison nicht während eine Liste offen ist.
  const [currentMonth] = useState(() => new Date().getMonth() + 1);

  const visible = useMemo(() => {
    if (isZeitFilter) {
      return recipes.filter(
        (r) => r.totalTimeMin !== null && r.totalTimeMin <= 30,
      );
    }
    if (isSaisonFilter) {
      return recipes.filter((r) => r.seasonMonths.includes(currentMonth));
    }
    if (activeTag) {
      return recipes.filter((r) => r.tags.includes(activeTag));
    }
    return recipes;
  }, [recipes, isZeitFilter, isSaisonFilter, activeTag, currentMonth]);

  // Auf-Liste-Zustand, sofort sichtbar vorgezogen — dieselbe Zutatenmenge wie
  // ein frischer Import: die Basisportion aus dem Rezept, ohne Umweg über den
  // Rezept-Screen. Die Zutaten selbst holt erst der Antipper (`getRecipe`),
  // nicht schon die Übersicht — sonst trüge jede Zeile hier das Gewicht eines
  // ganzen Rezepts mit sich herum, nur damit dieser eine Knopf funktioniert.
  const [override, setOverride] = useState<Record<string, number | null>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [listError, setListError] = useState("");

  async function toggleOnList(recipe: RecipeSummary) {
    if (!listId) {
      setListError("Keine aktive Liste gefunden.");
      return;
    }
    const supabase = getBrowserSupabase();
    if (!supabase) {
      setListError("Supabase ist nicht konfiguriert.");
      return;
    }

    const currentServings = override[recipe.id] ?? planned[recipe.id] ?? null;
    setListError("");
    setBusyId(recipe.id);

    if (currentServings !== null) {
      const result = await removeRecipeFromList(supabase, listId, recipe.id);
      setBusyId(null);
      if (!result.ok) {
        setListError(result.error);
        return;
      }
      setOverride((current) => ({ ...current, [recipe.id]: null }));
      startTransition(() => router.refresh());
      return;
    }

    const full = await getRecipe(supabase, recipe.id);
    if (!full.ok || !full.value) {
      setBusyId(null);
      setListError(full.ok ? "Rezept nicht gefunden." : full.error);
      return;
    }
    const fullRecipe = full.value;
    const items = buildListItems(
      fullRecipe.ingredients,
      fullRecipe.baseServings,
      fullRecipe.baseServings,
    );
    const result = await addRecipeToList(
      supabase,
      listId,
      recipe.id,
      fullRecipe.baseServings,
      items,
    );
    setBusyId(null);
    if (!result.ok) {
      setListError(result.error);
      return;
    }
    setOverride((current) => ({
      ...current,
      [recipe.id]: fullRecipe.baseServings,
    }));
    startTransition(() => router.refresh());
  }

  return (
    <div data-pending={searching ? "" : undefined}>
      <div className="flex items-center justify-between px-5 pt-1 pb-3.5">
        <span className="font-display text-[22px] font-bold tracking-[-0.01em]">
          emil
        </span>
        <div className="flex items-center gap-1">
          <Link
            href="/rezepte/importieren"
            aria-label="Rezept importieren"
            className="flex h-11 w-11 items-center justify-center press-flat tap-target"
          >
            <ImportIcon className="h-[23px] w-[23px] text-text" />
          </Link>
          <div
            role="tablist"
            aria-label="Ansicht"
            className="flex items-center gap-0.5 rounded-pill bg-border p-0.5"
          >
            <ViewTabButton
              label="Feed-Ansicht"
              active={view === "feed"}
              onClick={() => setView("feed")}
            >
              <RowsIcon className="h-[15px] w-[15px]" />
            </ViewTabButton>
            <ViewTabButton
              label="Kachel-Ansicht"
              active={view === "grid"}
              onClick={() => setView("grid")}
            >
              <GridIcon className="h-[15px] w-[15px]" />
            </ViewTabButton>
          </div>
        </div>
      </div>

      <div className="px-5 pb-4">
        <label htmlFor={inputId} className="sr-only">
          Rezept oder Zutat suchen
        </label>
        <div className="relative">
          <SearchIcon
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-4 h-[18px] w-[18px] -translate-y-1/2 text-muted"
          />
          {/* 16px Schrift Pflicht, sonst zoomt iOS beim Fokussieren hinein. */}
          <input
            id={inputId}
            type="search"
            inputMode="search"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="Rezept oder Zutat suchen"
            className="h-11 w-full rounded-pill bg-border pr-4 pl-11 text-base text-text outline-none placeholder:text-muted"
          />
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto px-5 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <FilterChip active={isZeitFilter} onClick={() => toggleFilter(QUICK_ZEIT)}>
          <span className="tabular">≤ 30 Min</span>
        </FilterChip>
        <FilterChip active={isSaisonFilter} onClick={() => toggleFilter(QUICK_SAISON)}>
          Saisonal
        </FilterChip>
        {tags.map(({ tag, count }) => (
          <FilterChip
            key={tag}
            active={activeTag === tag}
            onClick={() => toggleFilter(tag)}
          >
            {tag}
            <span className="ml-1.5 opacity-60">{count}</span>
          </FilterChip>
        ))}
      </div>

      <div className="h-px bg-border" />

      {listError && (
        <div className="px-5 pt-4">
          <Notice tone="error">{listError}</Notice>
        </div>
      )}

      <div className="dims-when-pending">
        {visible.length === 0 ? (
          <div className="px-5 py-8">
            {currentQuery || activeFilter ? (
              <p className="text-[15px] leading-[1.55] text-muted">
                {currentQuery
                  ? "Nichts gefunden. Gesucht wird in Titeln und Zutaten — vielleicht heißt die Zutat im Rezept anders."
                  : "Nichts gefunden. Kein Rezept passt gerade zu diesem Filter."}
              </p>
            ) : (
              <div>
                <h2 className="font-display text-[20px] leading-[1.2] font-bold text-text">
                  Noch leer
                </h2>
                <p className="mt-2 max-w-[260px] text-[15px] leading-relaxed text-muted">
                  Am schnellsten geht es über „Importieren“: die Adresse einer
                  Rezeptseite einfügen, oder ein Kochbuch-Foto digitalisieren
                  und das Ergebnis hier einsetzen.
                </p>
                <Link
                  href="/rezepte/importieren"
                  className="mt-3 inline-flex min-h-11 items-center gap-1.5 text-[14px] font-semibold text-text press-flat tap-target"
                >
                  Rezept importieren →
                </Link>
              </div>
            )}
          </div>
        ) : view === "feed" ? (
          <ul>
            {visible.map((recipe) => {
              const onList = (override[recipe.id] ?? planned[recipe.id] ?? null) !== null;
              const image = recipe.imagePath ? images[recipe.imagePath] : undefined;
              return (
                <li key={recipe.id}>
                  <div className="flex items-start justify-between gap-3 px-5 pt-3.5 pb-2.5">
                    <Link
                      href={`/rezepte/${recipe.id}`}
                      prefetch
                      className="min-w-0"
                    >
                      <h2 className="font-display text-[15px] leading-[1.3] font-bold text-text">
                        {recipe.title}
                      </h2>
                    </Link>
                    <Link
                      href={`/rezepte/${recipe.id}`}
                      aria-label={`${recipe.title} — weitere Optionen`}
                      className="flex h-7 w-7 shrink-0 items-center justify-center press-flat tap-target"
                    >
                      <MoreIcon className="text-muted" />
                    </Link>
                  </div>

                  <Link
                    href={`/rezepte/${recipe.id}`}
                    prefetch
                    aria-label={recipe.title}
                    className="relative block aspect-[393/340] w-full overflow-hidden bg-photo"
                  >
                    {image && (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={image}
                        alt=""
                        loading="lazy"
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    )}
                  </Link>

                  <div className="flex items-center justify-between gap-3 px-5 pt-3.5 pb-1">
                    {recipe.totalTimeMin ? (
                      <span className="tabular flex items-center gap-1.5 text-[14px] text-text">
                        <ClockIcon className="h-4 w-4" strokeWidth={1.8} />
                        {recipe.totalTimeMin} Min
                      </span>
                    ) : (
                      <span />
                    )}
                    <ListToggleButton
                      on={onList}
                      busy={busyId === recipe.id}
                      onClick={() => void toggleOnList(recipe)}
                    />
                  </div>
                  <p className="px-5 pt-1 pb-4 text-[13px] text-muted">
                    {formatRelativeTime(recipe.createdAt)}
                    {recipe.tags.length > 0 && ` · ${recipe.tags.slice(0, 2).join(", ")}`}
                  </p>

                  <div className="h-px bg-border" />
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="grid grid-cols-2 gap-[3px] bg-border">
            {visible.map((recipe) => {
              const onList = (override[recipe.id] ?? planned[recipe.id] ?? null) !== null;
              const image = recipe.imagePath ? images[recipe.imagePath] : undefined;
              return (
                <div key={recipe.id} className="relative aspect-[3/4] overflow-hidden">
                  <Link
                    href={`/rezepte/${recipe.id}`}
                    prefetch
                    aria-label={recipe.title}
                    className="absolute inset-0 block bg-photo"
                  >
                    {image && (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={image}
                        alt=""
                        loading="lazy"
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    )}
                    <span
                      aria-hidden
                      className="absolute inset-0"
                      style={{
                        background:
                          "linear-gradient(to top, rgba(15,16,18,0.74) 0%, rgba(15,16,18,0) 60%)",
                      }}
                    />
                    <span className="absolute right-3 bottom-8 left-3 line-clamp-2 font-display text-[12px] leading-[1.25] font-bold text-white">
                      {recipe.title}
                    </span>
                    {recipe.totalTimeMin && (
                      <span className="tabular absolute bottom-2 left-3 flex items-center gap-1 text-[11.5px] text-white/85">
                        <ClockIcon className="h-3.5 w-3.5" strokeWidth={2} />
                        {recipe.totalTimeMin} Min
                      </span>
                    )}
                  </Link>
                  <div className="absolute top-2 right-2">
                    <ListToggleButton
                      compact
                      on={onList}
                      busy={busyId === recipe.id}
                      onClick={() => void toggleOnList(recipe)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function ViewTabButton({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-label={label}
      aria-selected={active}
      onClick={onClick}
      className="flex h-9 w-9 items-center justify-center press-flat tap-target"
    >
      <span
        className={
          "flex h-7 w-7 items-center justify-center rounded-pill " +
          (active ? "bg-card text-text" : "text-inactive")
        }
      >
        {children}
      </span>
    </button>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={
        "flex h-[34px] shrink-0 items-center rounded-pill border px-3.5 text-[13px] font-semibold press-flat tap-target " +
        (active
          ? "border-accent bg-accent text-accent-ink"
          : "border-border bg-card text-text")
      }
    >
      {children}
    </button>
  );
}

/**
 * „Auf Liste" — dieselbe Aktion wie `ShoppingListButton` in `RecipeActions`,
 * aber ohne Zwischenzustand „stale": von Home aus gibt es keinen
 * Portionswähler, es zählt nur an/aus.
 */
function ListToggleButton({
  on,
  busy,
  compact,
  onClick,
}: {
  on: boolean;
  busy: boolean;
  /** Kleinere Form für die Kachel-Ansicht, wo der Knopf auf dem Foto sitzt. */
  compact?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      aria-pressed={on}
      className={
        "flex shrink-0 items-center gap-1.5 rounded-pill font-display press-flat tap-target disabled:opacity-60 " +
        (compact
          ? "h-[26px] px-3 text-[11px] font-semibold shadow-[0_2px_6px_rgba(0,0,0,0.2)]"
          : "h-9 px-4 text-[12.5px] font-bold") +
        " " +
        (on ? "bg-card text-text border border-border" : "bg-accent text-accent-ink")
      }
    >
      {on && <CheckIcon className="h-3 w-3" />}
      {on ? "Auf der Liste" : "Auf Liste"}
    </button>
  );
}
