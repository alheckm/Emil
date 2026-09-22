-- Todo-Liste: ein simples, haushaltsweites Aufgabenbrett.
--
-- Anders als die Einkaufsliste (0004) gibt es hier keine Zusammenführung
-- mehrerer Quellen und keine Begrenzung per Löschen (0016) — Erledigtes bleibt
-- stehen, nur die Anzeige zeigt (`src/lib/data/todos.ts`) davon höchstens die
-- letzten zehn. Eine einzige Tabelle genügt.

create table todos (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  text text not null,
  done boolean not null default false,
  done_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index todos_household_idx on todos (household_id);

create trigger todos_touch_updated_at
  before update on todos
  for each row execute function touch_updated_at();

alter table todos enable row level security;

create policy todos_all on todos
  for all to authenticated
  using (household_id in (select current_household_ids()))
  with check (household_id in (select current_household_ids()));
