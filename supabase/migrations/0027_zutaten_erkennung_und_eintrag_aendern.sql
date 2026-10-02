-- 1. „Beeren" wurde zu „TK-Beeren".
--
-- Die Ähnlichkeitssuche (0012) gibt beeren / tk-beeren mit 0,70 als Treffer
-- aus, und damit stand Tiefkühlware auf der Liste, die niemand bestellt hat.
-- Jetzt gilt: eine TK-Zutat trifft die Suche nur, wenn auch die Eingabe
-- ausdrücklich TK oder Tiefkühl sagt. Exakte Namen und Aliase bleiben, wie sie
-- waren — wer „TK-Beeren" schreibt, bekommt sie.

create or replace function resolve_ingredient(p_household_id uuid, p_name text)
returns uuid
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_norm text := normalize_ingredient_name(p_name);
  v_tk_pattern constant text := '(^|[^[:alpha:]])tk($|[^[:alpha:]])';
  v_wants_tk boolean;
  v_id uuid;
begin
  if v_norm = '' then
    raise exception 'Die Zutat braucht einen Namen';
  end if;

  v_wants_tk := v_norm ~ v_tk_pattern or v_norm like 'tiefk%';

  select id into v_id from ingredients
  where name_norm = v_norm
    and (household_id = p_household_id or household_id is null)
  order by (household_id is not null) desc
  limit 1;
  if v_id is not null then return v_id; end if;

  select a.ingredient_id into v_id
  from ingredient_aliases a
  join ingredients i on i.id = a.ingredient_id
  where a.alias_norm = v_norm
    and (i.household_id = p_household_id or i.household_id is null)
  order by (a.household_id is not null) desc
  limit 1;
  if v_id is not null then return v_id; end if;

  select id into v_id from ingredients
  where (household_id = p_household_id or household_id is null)
    and similarity(name_norm, v_norm) >= 0.62
    and (v_wants_tk or name_norm !~ v_tk_pattern)
  order by similarity(name_norm, v_norm) desc, (household_id is not null) desc
  limit 1;
  if v_id is not null then return v_id; end if;

  insert into ingredients (household_id, name_norm, display_name, category_id)
  values (p_household_id, v_norm, btrim(p_name), 'sonstiges')
  on conflict (household_id, name_norm) where household_id is not null
    do nothing
  returning id into v_id;

  if v_id is null then
    select id into v_id from ingredients
    where household_id = p_household_id and name_norm = v_norm;
  end if;

  return v_id;
end;
$$;

-- 2. Die frische Variante gehört in den Stamm: „Beeren" und „Salat" liegen
-- unter Obst & Gemüse statt als eigene Zutat am Listenende („Sonstiges").
insert into ingredients (household_id, name_norm, display_name, category_id)
values
  (null, 'beeren', 'Beeren', 'obst-gemuese'),
  (null, 'salat', 'Salat', 'obst-gemuese')
on conflict (name_norm) where household_id is null do nothing;

-- Eigene Zutaten, die beim Eintippen als „Sonstiges" entstanden sind, obwohl
-- sie frisch ins Gemüseregal gehören. Nur was noch unberührt in „Sonstiges"
-- steht — eine bewusst gewählte Abteilung bleibt.
update ingredients set category_id = 'obst-gemuese'
where household_id is not null
  and category_id = 'sonstiges'
  and name_norm in (
    'salat', 'kresse', 'radischen', 'bohnen', 'glatte petersilie',
    'meerrettich', 'kokosnüsse'
  );

-- 3. Handeintrag ändern: Name, Einheit und Menge einer Zeile, die nur von
-- Hand ergänzt wurde. Zeilen aus Rezepten hängen über ihre Herkunft an der
-- Zutat und der Einheit des Rezepts; die lassen sich nur in der Menge ändern
-- (set_entry_amount).

create or replace function update_manual_entry(
  p_entry_id uuid,
  p_ingredient_id uuid,
  p_merge_unit text,
  p_amount numeric
)
returns shopping_list_entries
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_entry shopping_list_entries;
begin
  if p_amount is not null and p_amount < 0 then
    raise exception 'Die Menge darf nicht negativ sein';
  end if;

  if exists (select 1 from shopping_list_sources where entry_id = p_entry_id) then
    raise exception 'Zeilen aus Rezepten lassen sich nur in der Menge ändern';
  end if;

  begin
    update shopping_list_entries
    set ingredient_id = p_ingredient_id,
        merge_unit = p_merge_unit,
        manual_amount = p_amount,
        amount_override = null,
        updated_at = now()
    where id = p_entry_id
    returning * into v_entry;
  exception when unique_violation then
    raise exception 'Das steht mit dieser Einheit schon auf der Liste';
  end;

  if v_entry is null then
    raise exception 'Diese Zeile gibt es nicht mehr';
  end if;

  return v_entry;
end;
$$;

revoke all on function update_manual_entry(uuid, uuid, text, numeric) from public, anon;
grant execute on function update_manual_entry(uuid, uuid, text, numeric) to authenticated;
