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
          className="min-h-12 w-full rounded-pill bg-surface px-5 text-base shadow-card outline-none placeholder:text-muted/70"
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
                      ? "bg-brand text-brand-text"
                      : "bg-surface text-muted shadow-card")
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
            <p className="text-[15px] leading-[1.55] text-muted">
              {currentQuery || activeTag
                ? "Nichts gefunden. Gesucht wird in Titeln und Zutaten — vielleicht heißt die Zutat im Rezept anders."
                : "Noch kein Rezept. Am schnellsten geht es über „Importieren“: die Adresse einer Rezeptseite einfügen, oder ein Kochbuch-Foto in claude.ai digitalisieren und das Ergebnis hier einsetzen."}
            </p>
          </Card>
        ) : (
          /* Karten statt Zeilen — so steht es im Entwurf, und es ist auch der
             ehrlichere Auftritt: was ein Rezept ausmacht, sieht man am Essen,
             nicht an seinem Namen. Eine Spalte, 24 px Abstand; die Inhalts-
             breite bleibt `max-w-md` (Design-System, Abschnitt 6). */
          <ul className="space-y-6">
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
                    className="block overflow-hidden rounded-card bg-surface shadow-card press tap-target"
                  >
                    {/* Dieselbe Form wie die Rezeptkarte selbst: 9:10, Foto
                        über die ganze Fläche, Titel als weiße Serife darauf.
                        Fehlt das Foto, bleibt das dunkle Bett stehen — die
                        Reihe franst so nicht aus, und der Titel ist in beiden
                        Fällen gleich gut zu lesen. */}
                    <div className="relative aspect-[9/10] w-full bg-photo">
                      {image && (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={image}
                          alt=""
                          loading="lazy"
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                      )}
                      <div
                        aria-hidden
                        className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-scrim via-scrim/45 to-transparent"
                      />

                      {servings ? (
                        /* Dieselbe Milchglasfläche wie die Knöpfe auf dem
                           Rezeptfoto, damit auf dem Foto nur eine Sprache
                           gesprochen wird. */
                        <span className="absolute left-4 top-4 rounded-pill bg-white/70 px-3 py-1 text-[13px] font-medium text-text backdrop-blur-[8px]">
                          Auf der Liste · {servings}
                        </span>
                      ) : null}

                      <div className="absolute inset-x-0 bottom-0 px-5 pb-5">
                        <h2 className="font-display text-[32px] font-normal leading-[1.15] text-white [text-wrap:balance]">
                          {recipe.title}
                        </h2>
                      </div>
                    </div>

                    {/* Portionen und Zeit stehen unter dem Foto auf der warmen
                        Fläche, nicht darauf: 13 px Weiß kommt auch mit
                        Schleier nicht über 4,5:1, und die Karte bekommt so
                        denselben Aufbau wie die Rezeptseite — Foto oben,
                        Inhalt darunter. */}
                    <p className="px-5 py-4 text-[13px] text-muted">
                      {recipe.baseServings} {recipe.servingsLabel}
                      {recipe.totalTimeMin
                        ? ` · ${recipe.totalTimeMin} min`
                        : ""}
                    </p>
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
