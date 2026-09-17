"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useId, useState } from "react";

/**
 * Suche und Schlagwort-Filter.
 *
 * Der Suchtext landet in der Adresse (`?q=`), damit ein Treffer teilbar ist
 * und der Zurück-Knopf das tut, was man erwartet. Getippt wird entprellt —
 * ohne das schickt jeder Buchstabe eine Abfrage los, und auf dem Handy mit
 * wenig Empfang überholen sich die Antworten gegenseitig.
 */
export function SearchBar({
  tags,
}: {
  tags: { tag: string; count: number }[];
}) {
  const router = useRouter();
  const params = useSearchParams();
  const inputId = useId();

  const currentQuery = params.get("q") ?? "";
  const currentTag = params.get("tag") ?? "";
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

  useEffect(() => {
    if (value === currentQuery) return;
    const timer = setTimeout(() => {
      const next = new URLSearchParams(params.toString());
      if (value.trim()) next.set("q", value.trim());
      else next.delete("q");
      router.replace(next.toString() ? `/rezepte?${next}` : "/rezepte");
    }, 300);
    return () => clearTimeout(timer);
  }, [value, currentQuery, params, router]);

  function toggleTag(tag: string) {
    const next = new URLSearchParams(params.toString());
    if (currentTag === tag) next.delete("tag");
    else next.set("tag", tag);
    router.replace(next.toString() ? `/rezepte?${next}` : "/rezepte");
  }

  return (
    <div className="space-y-3">
      <div className="relative">
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
          className="min-h-12 w-full rounded-xl border border-border bg-surface px-4 text-base outline-none focus:border-accent"
        />
      </div>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map(({ tag, count }) => {
            const active = currentTag === tag;
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                aria-pressed={active}
                className={
                  "min-h-9 rounded-full border px-3 text-[14px] active:opacity-70 " +
                  (active
                    ? "border-accent bg-accent text-accent-text"
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
  );
}
