"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useId, useMemo, useOptimistic, useState, startTransition } from "react";
import type { RecipeSummary } from "@/lib/data/recipes";
import { Card } from "@/components/ui";

/**
 * Suche, Schlagwort-Filter und Trefferliste in einem.
 *
 * Zusammengelegt, weil die drei zusammengehören: der Filter entscheidet, was
 * die Liste zeigt, und genau das soll ohne Umweg über den Server passieren.
 *
 * Die beiden Filter werden bewusst **unterschiedlich** behandelt:
 *
 * - **Schlagwörter** filtern rein im Browser. Jedes Rezept trägt seine
 *   `tags` ohnehin schon mit sich; ein Serverbesuch dafür wäre eine Netzrunde
 *   für eine Array-Prüfung. Die Adresse wird trotzdem mitgeführt, aber über
 *   `history.replaceState` — das ändert die Adresszeile, ohne zu navigieren,
 *   und bleibt damit teilbar.
 * - **Der Suchtext** bleibt auf dem Server. Gesucht wird per Volltext über
 *   Titel *und* Zutaten; das im Browser nachzubauen hieße, alle Zutaten aller
 *   Rezepte mitzuschicken und die Suche trotzdem anders aussehen zu lassen als
 *   auf dem Server. Er läuft deshalb weiter über die Adresse — aber entprellt
 *   und in einer Transition, sodass die Liste währenddessen blass wird statt
 *   einzufrieren.
 */
export function RecipeBrowser({
  recipes,
  tags,
  planned,
  images,
}: {
  recipes: RecipeSummary[];
  tags: { tag: string; count: number }[];
  planned: Record<string, number>;
  /** Pfad → signierte URL, gebündelt geholt (siehe getRecipeImageUrls). */
  images: Record<string, string>;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const inputId = useId();

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

  const [activeTag, setActiveTag] = useOptimistic(params.get("tag"));
  const [searching, setSearching] = useOptimistic(false);

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

  function toggleTag(tag: string) {
    const next = activeTag === tag ? null : tag;

    // `useOptimistic` greift im aktuellen Frame — anders als ein `useState`-
    // Setter, der in der Transition aufgeschoben würde. Der Chip ist also
    // aktiv, bevor irgendetwas anderes passiert.
    startTransition(() => {
      setActiveTag(next);

      // Adresse nachziehen, ohne zu navigieren: kein Server, kein Rendern,
      // aber der Link bleibt teilbar und der Zurück-Knopf verhält sich richtig.
      const search = new URLSearchParams(params.toString());
      if (next) search.set("tag", next);
      else search.delete("tag");
      window.history.replaceState(
        null,
        "",
        search.toString() ? `/rezepte?${search}` : "/rezepte",
      );
    });
  }

  const visible = useMemo(
    () =>
      activeTag ? recipes.filter((r) => r.tags.includes(activeTag)) : recipes,
    [recipes, activeTag],
  );

  return (
    <div className="space-y-6" data-pending={searching ? "" : undefined}>
      <div className="space-y-3">
        <label htmlFor={inputId} className="sr-only">
          Rezepte durchsuchen
        </label>
        <input
          id={inputId}
          type="search"
          inputMode="search"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Titel oder Zutat …"
          className="min-h-12 w-full rounded-pill border border-border bg-surface px-5 text-base outline-none focus:border-brand"
        />

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map(({ tag, count }) => {
              const active = activeTag === tag;
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  aria-pressed={active}
                  className={
                    "min-h-9 rounded-pill border px-4 text-[14px] press tap-target " +
                    (active
                      ? "border-brand bg-brand text-brand-text"
                      : "border-border bg-surface text-muted")
                  }
                >
                  {tag}
                  <span className="ml-1.5 opacity-60">{count}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Nur die Trefferliste wird blass, während die Textsuche läuft — der
          Rahmen und die Filter darüber bleiben scharf und bedienbar. */}
      <div className="dims-when-pending">
        {visible.length === 0 ? (
          <Card>
            <p className="text-[15px] leading-relaxed text-muted">
              {currentQuery || activeTag
                ? "Nichts gefunden. Gesucht wird in Titeln und Zutaten — vielleicht heißt die Zutat im Rezept anders."
                : "Noch kein Rezept. Am schnellsten geht es über „Importieren“: die Adresse einer Rezeptseite einfügen, oder ein Kochbuch-Foto in claude.ai digitalisieren und das Ergebnis hier einsetzen."}
            </p>
          </Card>
        ) : (
          <ul className="space-y-3">
            {visible.map((recipe) => {
              const servings = planned[recipe.id];
              const image = recipe.imagePath
                ? images[recipe.imagePath]
                : undefined;
              return (
                <li key={recipe.id}>
                  {/* `prefetch` holt die Rezeptseite samt ihrer URL-Daten vor
                      dem Klick. Das kostet eine Server-Runde pro sichtbarem
                      Verweis — bei einer Liste dieser Größe ist das der
                      richtige Tausch, bei tausend Rezepten wäre es keiner. */}
                  <Link
                    href={`/rezepte/${recipe.id}`}
                    prefetch
                    className="flex items-center gap-4 rounded-card border border-border bg-surface p-3 press tap-target"
                  >
                    {/* Foto zuerst — das ist der Kern des Auftritts. Wo keins
                        ist, steht eine ruhige Fläche mit dem Anfangsbuchstaben
                        statt eines leeren Kastens: die Zeilen bleiben so alle
                        gleich hoch, und die Liste franst nicht aus. */}
                    {image ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={image}
                        alt=""
                        loading="lazy"
                        className="h-16 w-16 shrink-0 rounded-2xl object-cover"
                      />
                    ) : (
                      <span
                        aria-hidden
                        className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-panel font-display text-xl text-panel-text"
                      >
                        {recipe.title.slice(0, 1).toUpperCase()}
                      </span>
                    )}

                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">
                        {recipe.title}
                      </span>
                      <span className="mt-1 block text-[13px] text-muted">
                        {recipe.baseServings} {recipe.servingsLabel}
                        {recipe.totalTimeMin
                          ? ` · ${recipe.totalTimeMin} min`
                          : ""}
                      </span>
                      {servings ? (
                        <span className="mt-2 inline-block rounded-pill bg-brand px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-brand-text">
                          Auf der Liste · {servings}
                        </span>
                      ) : null}
                    </span>

                    <span aria-hidden className="shrink-0 text-brand">
                      ›
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
