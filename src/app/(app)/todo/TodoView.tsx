"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { getBrowserSupabase } from "@/lib/client/supabase";
import { addTodo, setTodoDone, type Todo } from "@/lib/data/todos";
import { CheckIcon, PlusIcon } from "@/components/icons";
import { Notice } from "@/components/ui";

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
    <div className="space-y-1">
      {error && (
        <div className="pb-5">
          <Notice tone="error">{error}</Notice>
        </div>
      )}

      {/* „Etwas hinzufügen"-Zeile (DESIGN.md): kein schwebender Button —
          inline erste Zeile der Liste, gestricheltes „+". */}
      <div className="flex items-center gap-3.5 border-b border-border py-3.5">
        <span
          aria-hidden
          className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full border-[1.5px] border-dashed border-inactive"
        >
          <PlusIcon className="h-[13px] w-[13px] text-muted" strokeWidth={2.4} />
        </span>
        <label htmlFor="add-task-input" className="sr-only">
          Aufgabe ergänzen
        </label>
        <input
          id="add-task-input"
          aria-label="Aufgabe ergänzen"
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") addByHand();
          }}
          placeholder="Etwas hinzufügen"
          autoCapitalize="sentences"
          enterKeyHint="done"
          className="h-11 min-w-0 flex-1 bg-transparent text-base text-text outline-none placeholder:text-muted"
        />
      </div>

      {openItems.length === 0 ? (
        <p className="pt-5 text-[15px] leading-relaxed text-muted">
          Nichts zu tun. Trag oben etwas ein.
        </p>
      ) : (
        <ul>
          {openItems.map((todo) => (
            <TodoRow key={todo.id} todo={todo} done={false} onToggle={toggle} />
          ))}
        </ul>
      )}

      {doneItems.length > 0 && (
        <section className="pt-5">
          <h2 className="pb-1 text-[12px] font-bold tracking-[0.06em] text-muted uppercase">
            Erledigt
          </h2>
          <ul>
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
    <li className="flex items-center gap-3.5 border-b border-border py-3.5">
      <button
        type="button"
        onClick={() => onToggle(todo)}
        aria-pressed={done}
        aria-label={
          (done ? "Als offen markieren: " : "Als erledigt markieren: ") + todo.text
        }
        className={
          "flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full press-flat tap-target " +
          (done ? "bg-accent" : "border-[1.5px] border-inactive")
        }
      >
        {done && <CheckIcon className="h-[13px] w-[13px] text-accent-ink" strokeWidth={3} />}
      </button>
      <span
        className={
          "min-w-0 flex-1 text-[15px] " +
          (done ? "text-muted line-through" : "text-text")
        }
      >
        {todo.text}
      </span>
    </li>
  );
}
