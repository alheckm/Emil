"use client";

import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Die Liste auf beiden Handys gleichzeitig aktuell halten.
 *
 * Gemeldet wird nur *dass* sich etwas geändert hat, nicht was: die Oberfläche
 * lädt daraufhin neu vom Server. Das ist absichtlich stumpf — die Zeilen
 * einzeln nachzupflegen hieße, die Summenbildung der View im Browser
 * nachzubauen, und die beiden Stände liefen genau dann auseinander, wenn es
 * darauf ankommt: mit zwei Leuten im Supermarkt.
 *
 * Beide Tabellen, nicht nur die Zeilen: legt das andere Handy ein Rezept auf
 * eine Zeile, die es schon gibt, ändert sich nur die Summe darunter.
 * `shopping_list_sources` lässt sich dabei nicht auf die Liste filtern (der
 * Filter kann nur eigene Spalten) — die RLS begrenzt ohnehin auf den eigenen
 * Haushalt, und mehr als eine Liste hat der nicht.
 */
export function subscribeToList(
  supabase: SupabaseClient,
  listId: string,
  onChange: () => void,
): () => void {
  // Ein Rezept mit zwölf Zutaten löst zwölf Ereignisse aus. Ohne die kurze
  // Sammelpause lüde die Seite zwölfmal neu.
  let timer: ReturnType<typeof setTimeout> | null = null;
  const nudge = () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(onChange, 250);
  };

  const channel = supabase
    .channel(`liste:${listId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "shopping_list_entries",
        filter: `list_id=eq.${listId}`,
      },
      nudge,
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "shopping_list_sources" },
      nudge,
    )
    .subscribe();

  return () => {
    if (timer) clearTimeout(timer);
    void supabase.removeChannel(channel);
  };
}
