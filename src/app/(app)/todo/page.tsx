import { Suspense } from "react";
import { getCurrentUser } from "@/lib/server/supabase";
import { requireHousehold } from "@/lib/server/household";
import { listDoneTodos, listOpenTodos } from "@/lib/data/todos";
import { listMembersWithProfiles } from "@/lib/data/households";
import { Notice, Screen } from "@/components/ui";
import { TodoSkeleton } from "@/components/skeletons";
import { TodoView } from "./TodoView";

export const metadata = { title: "Aufgaben" };

/**
 * Die Todo-Liste — bewusst schlicht: ein Feld zum Ergänzen oben, darunter die
 * offenen Einträge, danach die zuletzt erledigten (höchstens zehn,
 * `listDoneTodos`). Kein Realtime, kein Offline-Puffer wie bei der
 * Einkaufsliste — dafür gibt es hier (noch) keinen Bedarf.
 */
export default function TodoPage() {
  return (
    <Screen title="Aufgaben" divider={false}>
      <Suspense fallback={<TodoSkeleton />}>
        <Todos />
      </Suspense>
    </Screen>
  );
}

async function Todos() {
  const context = await requireHousehold();
  if (!context.ok) return <Notice tone="error">{context.error}</Notice>;

  const [open, done, members, user] = await Promise.all([
    listOpenTodos(context.supabase, context.household.id),
    listDoneTodos(context.supabase, context.household.id),
    listMembersWithProfiles(context.supabase, context.household.id),
    getCurrentUser(),
  ]);

  if (!open.ok) return <Notice tone="error">{open.error}</Notice>;
  if (!done.ok) return <Notice tone="error">{done.error}</Notice>;

  return (
    <TodoView
      householdId={context.household.id}
      open={open.value}
      done={done.value}
      members={members.ok ? members.value : []}
      currentUserId={user?.id ?? null}
    />
  );
}
