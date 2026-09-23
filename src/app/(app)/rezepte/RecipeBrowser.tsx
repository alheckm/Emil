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
 */

/** Reservierte Werte im `filter`-Parameter, die keine Schlagwörter sind. */
const QUICK_ZEIT = "__zeit30";
const QUICK_SAISON = "__saisonal";

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

  return (
    <div className="space-y-6" data-pending={searching ? "" : undefined}>
      <div className="space-y-4">
        <label htmlFor={inputId} className="sr-only">
          Rezepte durchsuchen
        </label>
        {/* 16px Schrift trotz Vorlage (dort 13px) — Untergrenze fürs
            Eingabefeld, sonst zoomt iOS beim Antippen hinein. */}
        <div className="flex items-center gap-3 border-b-2 border-text pb-2.5">
          <input
            id={inputId}
            type="search"
            inputMode="search"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="Titel oder Zutat …"
            className="min-w-0 flex-1 bg-transparent text-base font-bold tracking-[0.02em] text-text uppercase outline-none placeholder:text-muted/60"
          />
          <span aria-hidden className="shrink-0 text-[15px] font-extrabold">
            →
          </span>
        </div>

        {/* Zwei feste Schnellfilter zuerst, danach die echten Schlagwörter —
            eine Reihe, derselbe Chip-Stil (radiuslos wie der Rest der
            Richtung, trotz Funktionsname FilterPill). Die festen Chips
            stehen immer da, auch ohne passende Rezepte — anders als die
            Tag-Liste darunter, die nur zeigt, was es wirklich gibt. */}
        <div className="flex flex-wrap gap-2">
          <FilterPill active={isZeitFilter} onClick={() => toggleFilter(QUICK_ZEIT)}>
            ≤ 30 Min
          </FilterPill>
          <FilterPill
            active={isSaisonFilter}
            onClick={() => toggleFilter(QUICK_SAISON)}
          >
            Saisonal
          </FilterPill>
          {tags.map(({ tag, count }) => (
            <FilterPill
              key={tag}
              active={activeTag === tag}
              onClick={() => toggleFilter(tag)}
            >
              {tag}
              <span className="ml-1.5 opacity-60">{count}</span>
            </FilterPill>
          ))}
        </div>
      </div>

      {/* Nur die Trefferliste wird blass, während die Textsuche läuft — der
          Rahmen und die Filter darüber bleiben scharf und bedienbar. */}
      <div className="dims-when-pending">
        {visible.length === 0 ? (
          <Section>
            {currentQuery || activeFilter ? (
              <p className="text-[15px] leading-[1.55] text-muted">
                {currentQuery
                  ? "Nichts gefunden. Gesucht wird in Titeln und Zutaten — vielleicht heißt die Zutat im Rezept anders."
                  : "Nichts gefunden. Kein Rezept passt gerade zu diesem Filter."}
              </p>
            ) : (
              <div className="py-6">
                <h2 className="text-[24px] leading-[1.05] font-black text-text uppercase">
                  Noch leer
                </h2>
                <p className="mt-2 max-w-[240px] text-[15px] leading-relaxed text-muted">
                  Am schnellsten geht es über „Importieren“: die Adresse einer
                  Rezeptseite einfügen, oder ein Kochbuch-Foto digitalisieren
                  und das Ergebnis hier einsetzen.
                </p>
                <Link
                  href="/rezepte/importieren"
                  className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-extrabold tracking-[0.1em] text-text uppercase press-flat tap-target"
                >
                  Rezept importieren →
                </Link>
              </div>
            )}
          </Section>
        ) : (
          /* Kein Kartenrahmen, kein Schatten (DESIGN.md, "Flach-Regel"):
             Titel und Foto laufen offen auf `--bg`, nur der Zeilenabstand
             (20 px zwischen den Rezepten) trennt sie voneinander. Eine
             Spalte, Inhaltsbreite bleibt `max-w-md`. */
          <ul className="space-y-5">
            {visible.map((recipe) => {
              const servings = planned[recipe.id];
              const image = recipe.imagePath
                ? images[recipe.imagePath]
                : undefined;
              const facts = [
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
                    className="block overflow-hidden rounded-card bg-card shadow-card press tap-target"
                  >
                    {/* Textinhalt trägt den vollen Seitenrand (20 px) — das
                        Foto darunter dagegen fast keinen, siehe unten. */}
                    <div className="px-5 pt-5">
                      <h2
                        lang="de"
                        className="text-[28px] leading-[1.05] font-extrabold tracking-[-0.005em] text-text uppercase [hyphens:auto] [text-wrap:balance]"
                      >
                        {recipe.title}
                      </h2>

                      {/* Merkmal-Chips — Pendant zu „1,200 sq ft · 3 Beds …"
                          in der Referenz. Kontur statt Fläche. */}
                      <ul className="mt-3 flex flex-wrap gap-2">
                        {facts.map((fact) => (
                          <li
                            key={fact}
                            className="border border-border px-3 py-1 text-[11px] font-bold tracking-[0.08em] uppercase"
                          >
                            {fact}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Nur 8 px Rand zur Karte (`px-2 pb-2`), fast bündig —
                        so sitzt das Foto in der Referenz, nicht mit demselben
                        Rand wie der Text darüber. Eigene, große Rundung wie
                        die Karte selbst, kein Titel mehr darauf: die Referenz
                        legt den Titel immer neben oder unter das Foto. Fehlt
                        das Foto, bleibt `bg-photo` stehen. */}
                    <div className="px-2 pb-2 pt-4">
                      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-card bg-photo">
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
                          <span className="absolute top-3 left-3 bg-card/70 px-3 py-1.5 text-[11px] font-bold tracking-[0.06em] text-text uppercase backdrop-blur-[8px]">
                            Auf der Liste · {servings}
                          </span>
                        ) : null}

                        {/* Einzige Stelle, an der eine Akzent-Fläche direkt
                            auf einem Foto sitzt statt auf `--bg`. */}
                        <span className="absolute right-3 bottom-3 flex items-center gap-2 bg-accent py-1.5 pr-1.5 pl-4 text-[11px] font-extrabold tracking-[0.08em] text-accent-ink uppercase">
                          Ansehen
                          <span className="flex h-6 w-6 items-center justify-center bg-text text-card">
                            <ChevronRightIcon className="h-3.5 w-3.5" />
                          </span>
                        </span>
                      </div>
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

/**
 * Ein Chip in der Filterreihe — für die zwei festen Schnellfilter und die
 * echten Schlagwörter gleichermaßen: aktiv `--text`-gefüllt mit
 * `--card`-hellem Text, inaktiv `--soft` mit `--muted`-Text, radiuslos wie
 * der Rest der Richtung, kein Rahmen in beiden Zuständen.
 */
function FilterPill({
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
        "min-h-11 px-4 text-[11px] font-bold tracking-[0.06em] uppercase press tap-target " +
        (active ? "bg-text text-card" : "bg-soft text-muted")
      }
    >
      {children}
    </button>
  );
}
