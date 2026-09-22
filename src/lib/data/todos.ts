import type { SupabaseClient } from "@supabase/supabase-js";
import { dataErrorMessage } from "./errors";
import { fail, ok, type Result } from "./result";

/**
 * Die Todo-Liste: absichtlich schlicht.
 *
 * Anders als die Einkaufsliste (`shoppingList.ts`) gibt es keine Quellen, kein
 * Zusammenführen, kein Löschen alter Zeilen — Erledigtes bleibt in der
 * Tabelle stehen, nur `listDoneTodos` holt davon höchstens die letzten zehn.
 */

export interface Todo {
  id: string;
  text: string;
  done: boolean;
  doneAt: string | null;
  createdAt: string;
}

/** Wie viele erledigte Einträge angezeigt werden. */
const DONE_LIMIT = 10;

function toTodo(row: {
  id: string;
  text: string;
  done: boolean;
  done_at: string | null;
  created_at: string;
}): Todo {
  return {
    id: row.id,
    text: row.text,
    done: row.done,
    doneAt: row.done_at,
    createdAt: row.created_at,
  };
}

/** Offene Einträge, ältester zuerst. */
export async function listOpenTodos(
  supabase: SupabaseClient,
  householdId: string,
): Promise<Result<Todo[]>> {
  const { data, error } = await supabase
    .from("todos")
    .select("id, text, done, done_at, created_at")
    .eq("household_id", householdId)
    .eq("done", false)
    .order("created_at", { ascending: true });

  if (error) return fail(dataErrorMessage(error));
  return ok((data ?? []).map(toTodo));
}

/** Zuletzt erledigte Einträge, höchstens {@link DONE_LIMIT} Stück. */
export async function listDoneTodos(
  supabase: SupabaseClient,
  householdId: string,
): Promise<Result<Todo[]>> {
  const { data, error } = await supabase
    .from("todos")
    .select("id, text, done, done_at, created_at")
    .eq("household_id", householdId)
    .eq("done", true)
    .order("done_at", { ascending: false })
    .limit(DONE_LIMIT);

  if (error) return fail(dataErrorMessage(error));
  return ok((data ?? []).map(toTodo));
}

export async function addTodo(
  supabase: SupabaseClient,
  householdId: string,
  text: string,
): Promise<Result<Todo>> {
  const { data, error } = await supabase
    .from("todos")
    .insert({ household_id: householdId, text })
    .select("id, text, done, done_at, created_at")
    .single();

  if (error) return fail(dataErrorMessage(error));
  return ok(toTodo(data));
}

export async function setTodoDone(
  supabase: SupabaseClient,
  todoId: string,
  done: boolean,
): Promise<Result> {
  const { error } = await supabase
    .from("todos")
    .update({ done, done_at: done ? new Date().toISOString() : null })
    .eq("id", todoId);

  return error ? fail(dataErrorMessage(error)) : ok(undefined);
}
