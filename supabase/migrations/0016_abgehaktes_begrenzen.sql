-- Mehr als 20 Abgehakte verstopfen nur noch die Liste: sobald ein 21.
-- dazukommt, fliegen die ältesten raus. `shopping_list_sources` hängt an
-- `on delete cascade`, also verschwindet mit der Zeile auch ihre
-- Rezeptherkunft — derselbe Weg wie „Von der Liste nehmen" (deleteEntry).
--
-- Nur beim Abhaken geprüft, nicht beim Abwählen: Abwählen kann die Zahl der
-- Abgehakten nur verkleinern.
create or replace function set_entry_checked(
  p_entry_id uuid,
  p_checked boolean,
  p_client_updated_at timestamptz default null
)
returns shopping_list_entries
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_entry shopping_list_entries;
begin
  select * into v_entry from shopping_list_entries where id = p_entry_id;
  if v_entry is null then
    raise exception 'Diese Zeile gibt es nicht mehr';
  end if;

  if p_client_updated_at is not null and p_client_updated_at < v_entry.updated_at then
    -- Veralteter Offline-Puffer: der Server ist weiter, wir lassen ihn stehen.
    return v_entry;
  end if;

  update shopping_list_entries
  set checked = p_checked,
      checked_at = case when p_checked then now() else null end,
      checked_by = case when p_checked then auth.uid() else null end,
      updated_at = now()
  where id = p_entry_id
  returning * into v_entry;

  if p_checked then
    delete from shopping_list_entries
    where id in (
      select id from shopping_list_entries
      where list_id = v_entry.list_id and checked
      order by checked_at desc nulls last
      offset 20
    );
  end if;

  return v_entry;
end;
$$;
