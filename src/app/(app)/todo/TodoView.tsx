"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { getBrowserSupabase } from "@/lib/client/supabase";
import { addTodo, setTodoAssignee, setTodoDone, type Todo } from "@/lib/data/todos";
import type { MemberProfile } from "@/lib/data/households";
import { CheckIcon, PlusIcon } from "@/components/icons";
import { Avatar, Notice } from "@/components/ui";

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
 *
 * Zuweisen läuft genauso schlicht: der Foto-Kreis am Zeilenende tippt sich
 * durch die Mitglieder des Haushalts, „niemand" eingeschlossen — kein eigenes
 * Auswahlmenü, das es sonst nirgends in Emil gibt. Bei genau einem Mitglied
 * bringt eine Zuweisung nichts, deshalb bleibt der Kreis dann ganz weg.
 */
export function TodoView({
  householdId,
  open,
  done,
  members,
  currentUserId,
}: {
  householdId: string;
  open: Todo[];
  done: Todo[];
  members: MemberProfile[];
  currentUserId: string | null;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [text, setText] = useState("");
  // Vorgezogene Anzeige: neu ergänzte Einträge, bevor der Server geantwortet
  // hat, und Häkchen/Zuweisungen, die von dem abweichen, was `open`/`done`
  // gerade sagen.
  const [adding, setAdding] = useState<Todo[]>([]);
  const [doneOverride, setDoneOverride] = useState<Record<string, boolean>>(
    {},
  );
  const [assigneeOverride, setAssigneeOverride] = useState<
    Record<string, string | null>
  >({});

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
    setAssigneeOverride({});
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
      assignedTo: null,
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

  /** Kreis am Zeilenende antippen: springt zum nächsten Mitglied, danach zu „niemand". */
  function cycleAssignee(todo: Todo) {
    const supabase = getBrowserSupabase();
    if (!supabase) {
      setError("Supabase ist nicht konfiguriert.");
      return;
    }

    const current = todo.id in assigneeOverride ? assigneeOverride[todo.id] : todo.assignedTo;
    const currentIndex = members.findIndex((member) => member.userId === current);
    const nextIndex = currentIndex + 1;
    const next = nextIndex >= members.length ? null : members[nextIndex].userId;

    setAssigneeOverride((state) => ({ ...state, [todo.id]: next }));

    run(
      () => setTodoAssignee(supabase, todo.id, next),
      () => setAssigneeOverride((state) => ({ ...state, [todo.id]: current })),
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

      {/* „Etwas hinzufügen"-Zeile (DESIGN.md): Pille wie das Suchfeld auf
          Home und das Pendant auf der Einkaufsliste — vertrautes Muster
          statt eigener Geste. Der Fortschritt steht direkt darunter. */}
      <div className="space-y-1.5 pb-3.5">
        <label htmlFor="add-task-input" className="sr-only">
          Aufgabe ergänzen
        </label>
        <div className="relative">
          <PlusIcon
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-4 h-[15px] w-[15px] -translate-y-1/2 text-muted"
            strokeWidth={2.4}
          />
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
            className="h-11 w-full rounded-pill bg-border pr-4 pl-11 text-base text-text outline-none placeholder:text-muted"
          />
        </div>
        <p className="tabular pl-1 text-[13px] text-muted">
          {openItems.length === 0
            ? doneItems.length === 0
              ? "Nichts zu tun"
              : "Alles erledigt"
            : `Noch ${openItems.length} von ${
                openItems.length + doneItems.length
              } erledigt`}
        </p>
      </div>

      {openItems.length === 0 ? (
        <p className="pt-5 text-[15px] leading-relaxed text-muted">
          Nichts zu tun. Trag oben etwas ein.
        </p>
      ) : (
        <ul>
          {openItems.map((todo) => (
            <TodoRow
              key={todo.id}
              todo={todo}
              done={false}
              members={members}
              currentUserId={currentUserId}
              assignedTo={todo.id in assigneeOverride ? assigneeOverride[todo.id] : todo.assignedTo}
              onToggle={toggle}
              onCycleAssignee={cycleAssignee}
            />
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
              <TodoRow
                key={todo.id}
                todo={todo}
                done
                members={members}
                currentUserId={currentUserId}
                assignedTo={todo.id in assigneeOverride ? assigneeOverride[todo.id] : todo.assignedTo}
                onToggle={toggle}
                onCycleAssignee={cycleAssignee}
              />
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
  members,
  currentUserId,
  assignedTo,
  onToggle,
  onCycleAssignee,
}: {
  todo: Todo;
  done: boolean;
  members: MemberProfile[];
  currentUserId: string | null;
  assignedTo: string | null;
  onToggle: (todo: Todo) => void;
  onCycleAssignee: (todo: Todo) => void;
}) {
  const assignee = members.find((member) => member.userId === assignedTo);
  const assigneeLabel = assignee
    ? assignee.displayName ||
      (assignee.userId === currentUserId ? "dir" : "einem Mitbewohner")
    : null;
  const assigneeInitial = assignee
    ? (assignee.displayName || (assignee.userId === currentUserId ? "Du" : "Mitbewohner:in")).charAt(0)
    : null;

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
      {members.length > 1 && (
        <button
          type="button"
          onClick={() => onCycleAssignee(todo)}
          aria-label={
            assigneeLabel ? `${assigneeLabel} zugewiesen. Zuweisung ändern.` : "Niemandem zugewiesen. Zuweisen."
          }
          className="shrink-0 press-flat tap-target"
        >
          <Avatar
            url={assignee?.avatarUrl}
            initial={assigneeInitial?.toUpperCase()}
            placeholder={!assignee}
            size={26}
          />
        </button>
      )}
    </li>
  );
}
