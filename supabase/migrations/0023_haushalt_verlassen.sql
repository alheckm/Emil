-- Einen einzelnen Haushalt verlassen.
--
-- Seit /beitreten/[code] einem Beitritt nicht mehr im Weg steht, auch wenn
-- schon ein Haushalt besteht, braucht es ein Gegenstück: den nicht mehr
-- gebrauchten Haushalt danach wieder loswerden.
--
-- `delete_own_household_data()` (0005) reicht dafür nicht — die räumt beim
-- Konto löschen *alle* Mitgliedschaften ab. Hier soll gezielt nur einer
-- verschwinden, die übrigen bleiben unberührt.
--
-- Warum nicht einfach `delete from household_members` aus dem Client? Die
-- RLS-Policy `household_members_delete_self` erlaubt das zwar (siehe
-- 0006_rls.sql) — aber wird man dabei zur letzten Person im Haushalt, bliebe
-- eine Zeile in `households` verwaist stehen: dafür gibt es keine
-- DELETE-Policy, und ohne Kaskade blieben auch Rezepte, Einkaufsliste und
-- Aufgaben liegen.
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

  if not exists (
    select 1 from household_members where household_id = p_household_id
  ) then
    delete from households where id = p_household_id;
  end if;
end;
$$;

revoke all on function leave_household(uuid) from public, anon;
grant execute on function leave_household(uuid) to authenticated;
