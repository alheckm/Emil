"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { getBrowserSupabase } from "@/lib/client/supabase";
import { addTodo, setTodoDone, type Todo } from "@/lib/data/todos";
import { CheckIcon } from "@/components/icons";
import { Notice, Section } from "@/components/ui";

/**
 * Die Todo-Liste.
 *
 * Ganz simpel, auf Wunsch: ein Feld oben zum Ergänzen (derselbe Baustein wie
 * „Etwas ergänzen" auf der Einkaufsliste, `liste/ListView.tsx`), darunter die
 * offenen Einträge. Ein erledigter Eintrag rutscht sofort in den Abschnitt
 * „Erledigt" darunter — den zeigt `TodoPage` bereits auf höchstens zehn
 * Einträge gekappt (`listDoneTodos`), hier wird nicht weiter gefiltert.
 *
 * Kein Realtime, kein Offline-Puffer, kein Longpress-Menü wie bei der
 * Einkaufsliste — dafür gibt es hier (noch) keinen Bedarf. Antippen der
 * ganzen Zeile hakt ab oder macht das rückgängig, sofort im selben Frame;
 * geht der Server-Aufruf schief, springt die Zeile zurück und die Meldung
 * erklärt warum.
 */
export function TodoView({
  householdId,
  open,
  done,
}: {
  householdId: string;
  open: Todo[];
  done: Todo[];
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [text, setText] = useState("");
  // Vorgezogene Anzeige: neu ergänzte Einträge, bevor der Server geantwortet
  // hat, und Häkchen, die von dem abweichen, was `open`/`done` gerade sagen.
  const [adding, setAdding] = useState<Todo[]>([]);
  const [doneOverride, setDoneOverride] = useState<Record<string, boolean>>(
    {},
  );

  // Sobald frische Serverdaten eintreffen (nach `router.refresh()`), gilt
  // wieder nur noch, was der Server sagt — genau wie in `liste/ListView.tsx`.
  // Ohne das bliebe ein bestätigter Vorgriff für immer stehen und würde bei
  // einem späteren echten Zustandswechsel falsch mitgezählt.
  const [shownOpen, setShownOpen] = useState(open);
  const [shownDone, setShownDone] = useState(done);
  if (shownOpen !== open || shownDone !== done) {
    setShownOpen(open);
    setShownDone(done);
    setAdding([]);
    setDoneOverride({});
  }

  function run(action: () => Promise<{ ok: boolean; error?: string }>, zurueck?: () => void) {
    setError("");
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        zurueck?.();
        setError(result.error ?? "Das hat nicht geklappt.");
        return;
      }
      router.refresh();
    });
  }

  function addByHand() {
    const value = text.trim();
    if (!value) return;
    const supabase = getBrowserSupabase();
    if (!supabase) {
      setError("Supabase ist nicht konfiguriert.");
      return;
    }

    const optimistic: Todo = {
      id: crypto.randomUUID(),
      text: value,
      done: false,
      doneAt: null,
      createdAt: new Date().toISOString(),
    };
    setAdding((current) => [...current, optimistic]);
    setText("");

    run(
      () => addTodo(supabase, householdId, value),
      () => {
        setAdding((current) => current.filter((item) => item.id !== optimistic.id));
        setText(value);
      },
    );
  }

  function toggle(todo: Todo) {
    const next = !(doneOverride[todo.id] ?? todo.done);
    const supabase = getBrowserSupabase();
    if (!supabase) {
      setError("Supabase ist nicht konfiguriert.");
      return;
    }

    setDoneOverride((current) => ({ ...current, [todo.id]: next }));

    run(
      () => setTodoDone(supabase, todo.id, next),
      () =>
        setDoneOverride((current) => ({ ...current, [todo.id]: !next })),
    );
  }

  const openItems = [
    ...shownOpen.filter((todo) => !(doneOverride[todo.id] ?? todo.done)),
    ...adding,
  ];
  const doneItems = [
    ...shownDone.filter((todo) => doneOverride[todo.id] ?? todo.done),
    ...shownOpen.filter((todo) => doneOverride[todo.id] === true),
  ];

  return (
    <div className="space-y-6">
      {error && <Notice tone="error">{error}</Notice>}

      <Section>
        <input
          aria-label="Aufgabe ergänzen"
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") addByHand();
          }}
          placeholder="Aufgabe ergänzen"
          autoCapitalize="sentences"
          enterKeyHint="done"
          className="h-12 w-full rounded-soft border border-border bg-soft px-3 text-base outline-none focus:border-text"
        />
      </Section>

      {openItems.length === 0 ? (
        <Section>
          <p className="text-[15px] leading-relaxed text-muted">
            Nichts zu tun. Trag oben etwas ein.
          </p>
        </Section>
      ) : (
        <ul className="space-y-2">
          {openItems.map((todo) => (
            <TodoRow key={todo.id} todo={todo} done={false} onToggle={toggle} />
          ))}
        </ul>
      )}

      {doneItems.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-display text-[15px] font-semibold leading-[1.3]">
            Erledigt
          </h2>
          <ul className="space-y-2">
            {doneItems.map((todo) => (
              <TodoRow key={todo.id} todo={todo} done onToggle={toggle} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function TodoRow({
  todo,
  done,
  onToggle,
}: {
  todo: Todo;
  done: boolean;
  onToggle: (todo: Todo) => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={() => onToggle(todo)}
        aria-pressed={done}
        className="flex min-h-14 w-full items-center gap-3 rounded-soft bg-soft px-4 py-3 text-left press-flat tap-target"
      >
        <span
          aria-hidden
          className={
            "flex h-6 w-6 shrink-0 items-center justify-center rounded-pill " +
            (done ? "bg-accent text-accent-ink" : "border border-border")
          }
        >
          {done && <CheckIcon className="h-3.5 w-3.5" strokeWidth={2.25} />}
        </span>
        <span
          className={
            "min-w-0 flex-1 break-words text-[15px] " +
            (done ? "text-muted line-through" : "text-text")
          }
        >
          {todo.text}
        </span>
      </button>
    </li>
  );
}
