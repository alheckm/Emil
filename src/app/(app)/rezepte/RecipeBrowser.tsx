"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useId, useMemo, useOptimistic, useState, startTransition } from "react";
import type { RecipeSummary } from "@/lib/data/recipes";
import { Section } from "@/components/ui";
import { ChevronRightIcon } from "@/components/icons";

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
          className="min-h-12 w-full rounded-pill bg-soft px-5 text-base outline-none placeholder:text-muted/70"
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
                    "min-h-11 rounded-pill px-4 text-[13px] press tap-target " +
                    (active
                      ? "bg-text text-card"
                      : "bg-soft text-muted")
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
          <Section>
            <p className="text-[15px] leading-[1.55] text-muted">
              {currentQuery || activeTag
                ? "Nichts gefunden. Gesucht wird in Titeln und Zutaten — vielleicht heißt die Zutat im Rezept anders."
                : "Noch kein Rezept. Am schnellsten geht es über „Importieren“: die Adresse einer Rezeptseite einfügen, oder ein Kochbuch-Foto in claude.ai digitalisieren und das Ergebnis hier einsetzen."}
            </p>
          </Section>
        ) : (
          /* Echte Karten mit Schatten — die Kehrtwende zur Vorgängerfassung
             (design-system.md, Abschnitt 4 und 7): `docs/app_redesign.jpg`
             zeigt die Rezeptvorschau innerhalb der Gerätekante als weiße
             Fläche mit Schatten, keine Fehllesung wie beim alten Bild. Eine
             Spalte, 20 px Abstand zwischen den Karten; Inhaltsbreite bleibt
             `max-w-md`. */
          <ul className="space-y-5">
            {visible.map((recipe) => {
              const servings = planned[recipe.id];
              const image = recipe.imagePath
                ? images[recipe.imagePath]
                : undefined;
              const facts = [
                `${recipe.baseServings} ${recipe.servingsLabel}`,
                recipe.totalTimeMin ? `${recipe.totalTimeMin} Min` : null,
                ...recipe.tags.slice(0, 2),
              ].filter((fact): fact is string => Boolean(fact));

              return (
                <li key={recipe.id}>
                  {/* `prefetch` holt die Rezeptseite samt ihrer URL-Daten vor
                      dem Klick. Das kostet eine Server-Runde pro sichtbarem
                      Verweis — bei einer Liste dieser Größe ist das der
                      richtige Tausch, bei tausend Rezepten wäre es keiner. */}
                  <Link
                    href={`/rezepte/${recipe.id}`}
                    prefetch
                    className="block overflow-hidden rounded-card bg-card p-4 shadow-card press tap-target"
                  >
                    <h2 className="font-display text-[26px] font-bold leading-[1.2] [text-wrap:balance]">
                      {recipe.title}
                    </h2>

                    {/* Merkmal-Chips — Pendant zu „1,200 sq ft · 3 Beds …" in
                        der Referenz. Kontur statt Fläche, wie die
                        Merkmal-Chips auf dem Rezept-Screen. */}
                    <ul className="mt-3 flex flex-wrap gap-2">
                      {facts.map((fact) => (
                        <li
                          key={fact}
                          className="rounded-pill border border-border px-3 py-1 text-[13px] font-medium"
                        >
                          {fact}
                        </li>
                      ))}
                    </ul>

                    {/* 4:3 statt 9:10, kein Titel mehr darauf: die Referenz
                        legt den Titel immer neben oder unter das Foto.
                        Fehlt das Foto, bleibt `bg-photo` stehen. */}
                    <div className="relative mt-4 aspect-[4/3] w-full overflow-hidden rounded-tile bg-photo">
                      {image && (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={image}
                          alt=""
                          loading="lazy"
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                      )}

                      {servings ? (
                        /* Dieselbe Milchglasfläche wie die Knöpfe auf dem
                           Rezeptfoto, damit auf dem Foto nur eine Sprache
                           gesprochen wird — bewusst nicht `--accent`, damit
                           der Listenstatus nicht mit der CTA-Farbe
                           verwechselt wird. */
                        <span className="absolute left-3 top-3 rounded-pill bg-card/70 px-3 py-1 text-[13px] font-medium text-text backdrop-blur-[8px]">
                          Auf der Liste · {servings}
                        </span>
                      ) : null}

                      {/* Einzige Stelle, an der eine Gold-Fläche direkt auf
                          einem Foto sitzt statt auf `--bg` — wie „Details" in
                          der Referenz. */}
                      <span className="absolute bottom-3 right-3 inline-flex items-center gap-0.5 rounded-pill bg-accent py-1.5 pl-3 pr-2 text-[13px] font-semibold text-accent-ink">
                        Ansehen
                        <ChevronRightIcon className="h-4 w-4" />
                      </span>
                    </div>
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
