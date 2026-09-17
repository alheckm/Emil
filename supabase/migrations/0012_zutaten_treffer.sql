-- Zutaten-Erkennung: Schwelle der Ähnlichkeitssuche von 0,85 auf 0,62.
--
-- 0,85 war zu streng gewählt — gemessen an dieser Datenbank:
--
--   Zwiebel / Zwiebeln            0,700     Mehl / Mandelmehl        0,333
--   Karotte / Karotten            0,700     Zwiebel / Frühlingszw.   0,316
--   Tomate  / Tomaten             0,667     Salz / Salzmandeln       0,308
--   Wacholderbeere(n)             0,824     Fond / Kalbsfond         0,250
--                                           Sahne / Sauerrahm        0,143
--
-- Links die Paare, die zusammengehören, rechts die, die es nicht dürfen.
-- Zwischen 0,333 und 0,667 liegt ein breiter Graben; 0,62 sitzt darin.
--
-- Die Folge der alten Schwelle war konkret: „Zwiebeln" aus einem Rezept und
-- „Zwiebel" aus einem anderen wurden zu zwei Zutaten und damit zu zwei Zeilen
-- auf der Einkaufsliste — genau das, was das Zusammenfassen verhindern soll.
--
-- Knoblauch / Knoblauchzehe liegt bei 0,600 und bleibt damit bewusst
-- getrennt: eine Zehe ist keine Knolle.

create or replace function resolve_ingredient(p_household_id uuid, p_name text)
returns uuid
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_norm text := normalize_ingredient_name(p_name);
  v_id uuid;
begin
  if v_norm = '' then
    raise exception 'Die Zutat braucht einen Namen';
  end if;

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

-- Was die Ähnlichkeit nicht schafft, steht als Alias da: unregelmäßige
-- Mehrzahl und geläufige Zweitnamen. Die Tabelle gab es längst, genutzt wurde
-- sie noch nicht.
insert into ingredient_aliases (alias_norm, ingredient_id, household_id)
select normalize_ingredient_name(v.alias), i.id, null
from (values
  ('Ei', 'Eier'),
  ('Lorbeerblätter', 'Lorbeerblatt'),
  ('Gewürznelke', 'Nelken'),
  ('Gewürznelken', 'Nelken'),
  ('Kalbsfond', 'Fond'),
  ('Rinderfond', 'Fond'),
  ('Gemüsefond', 'Fond'),
  ('Créme fraiche', 'Crème fraîche'),
  ('Creme fraiche', 'Crème fraîche'),
  ('Petersilie glatt', 'Petersilie'),
  ('Petersilie krause', 'Petersilie')
) as v(alias, ziel)
join ingredients i
  on i.household_id is null
 and i.name_norm = normalize_ingredient_name(v.ziel)
on conflict (alias_norm, ingredient_id) do nothing;
