-- Eigene Zutaten bekommen einen großgeschriebenen Anzeigenamen („äpfel" →
-- „Äpfel"), und die Mehrzahl „Äpfel" trifft den Apfel aus dem Stamm statt eine
-- eigene Zutat ohne Bild und Abteilung anzulegen.

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
  values (
    p_household_id, v_norm,
    upper(left(btrim(p_name), 1)) || substr(btrim(p_name), 2),
    'sonstiges'
  )
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

insert into ingredient_aliases (alias_norm, ingredient_id, household_id)
select normalize_ingredient_name('Äpfel'), i.id, null
from ingredients i
where i.household_id is null and i.name_norm = 'apfel'
on conflict (alias_norm, ingredient_id) do nothing;

-- Die bereits angelegte eigene „äpfel"-Zutat im Stamm-Apfel aufgehen lassen.
update recipe_ingredients r
set ingredient_id = a.id
from ingredients a, ingredients o
where a.household_id is null and a.name_norm = 'apfel'
  and o.household_id is not null and o.name_norm = 'äpfel'
  and r.ingredient_id = o.id;

update shopping_list_entries e
set ingredient_id = a.id
from ingredients a, ingredients o
where a.household_id is null and a.name_norm = 'apfel'
  and o.household_id is not null and o.name_norm = 'äpfel'
  and e.ingredient_id = o.id
  and not exists (
    select 1 from shopping_list_entries x
    where x.list_id = e.list_id and x.ingredient_id = a.id
      and x.merge_unit = e.merge_unit
  );

delete from ingredients
where household_id is not null and name_norm = 'äpfel';
