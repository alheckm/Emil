-- Aufgaben Mitgliedern zuweisen.
--
-- `assigned_to` zeigt auf `auth.users`, nicht auf `household_members` — eine
-- zusammengesetzte Fremdschlüsselbeziehung wäre hier nur unnötige Komplexität,
-- und `on delete set null` beim Löschen des Kontos reicht als Aufräumregel.
-- Verlässt jemand nur einen einzelnen Haushalt (Konto bleibt bestehen),
-- greift diese Regel nicht — dafür räumt `leave_household()` unten gezielt auf.

alter table todos add column assigned_to uuid references auth.users (id) on delete set null;

create index todos_assigned_to_idx on todos (assigned_to);

-- Ersetzt die bestehende Regel aus 0017: zusätzlich zur Haushaltsgrenze muss
-- eine Zuweisung entweder leer sein oder auf ein tatsächliches Mitglied genau
-- dieses Haushalts zeigen — sonst ließe sich eine Aufgabe an eine beliebige
-- geratene Nutzer-ID "zuweisen".
drop policy todos_all on todos;

create policy todos_all on todos
  for all to authenticated
  using (household_id in (select current_household_ids()))
  with check (
    household_id in (select current_household_ids())
    and (
      assigned_to is null
      or exists (
        select 1 from household_members hm
        where hm.household_id = todos.household_id and hm.user_id = todos.assigned_to
      )
    )
  );

-- Beim Verlassen eines Haushalts (Konto bleibt bestehen) auch die eigenen
-- Zuweisungen darin loslassen — sonst zeigt eine Aufgabe scheinbar
-- unverändert auf jemanden, der gar nicht mehr im Haushalt ist (und dessen
-- Profil die übrigen Mitglieder wegen `current_housemate_ids()` dann auch
-- nicht mehr sehen).
create or replace function leave_household(p_household_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null then
    raise exception 'Nicht angemeldet';
  end if;

  delete from household_members
  where household_id = p_household_id and user_id = auth.uid();

  if not found then
    raise exception 'Du bist kein Mitglied dieses Haushalts';
  end if;

  update todos
  set assigned_to = null
  where household_id = p_household_id and assigned_to = auth.uid();

  if not exists (
    select 1 from household_members where household_id = p_household_id
  ) then
    delete from households where id = p_household_id;
  end if;
end;
$$;

revoke all on function leave_household(uuid) from public, anon;
grant execute on function leave_household(uuid) to authenticated;
