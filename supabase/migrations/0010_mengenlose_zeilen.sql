-- Zutaten ohne Menge bekommen keine eigene Listenzeile mehr.
--
-- Vorher: der Merge-Schlüssel war (ingredient_id, merge_unit), und eine Zeile
-- ohne Einheit landete im Topf „Stück". Legte ein Rezept „etwas Paprikapulver"
-- auf die Liste und ein anderes „2 EL Paprikapulver", standen zwei Zeilen da.
-- Die Mengen stimmten, aber im Supermarkt kauft man ein Glas Paprikapulver.
--
-- Nachher: eine mengenlose Position hängt sich an eine vorhandene Zeile
-- derselben Zutat. Die View rechnet has_unquantified ohnehin aus den Quellen
-- aus, und die Oberfläche zeigt dann „3 EL + etwas" — dieser Teil war schon da
-- und wartete nur darauf, dass die Datenbank beides in eine Zeile legt.
--
-- Wichtig ist die Unabhängigkeit von der Reihenfolge: es darf keinen
-- Unterschied machen, welches Rezept zuerst auf die Liste kam.

create or replace function add_recipe_to_list(
  p_list_id uuid,
  p_recipe_id uuid,
  p_servings int,
  p_items jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_item jsonb;
  v_entry_id uuid;
  v_base_servings int;
  v_amount numeric;
  v_ingredient_id uuid;
  v_merge_unit text;
begin
  if p_servings is null or p_servings <= 0 then
    raise exception 'Portionszahl muss größer als 0 sein';
  end if;

  select base_servings into v_base_servings from recipes where id = p_recipe_id;
  if v_base_servings is null then
    raise exception 'Rezept nicht gefunden';
  end if;

  -- Erst den eigenen früheren Anteil entfernen (idempotent).
  delete from shopping_list_sources
  where recipe_id = p_recipe_id
    and entry_id in (select id from shopping_list_entries where list_id = p_list_id);

  for v_item in select * from jsonb_array_elements(coalesce(p_items, '[]'::jsonb))
  loop
    v_ingredient_id := (v_item ->> 'ingredient_id')::uuid;
    v_merge_unit := v_item ->> 'merge_unit';
    v_amount := nullif(v_item ->> 'amount_base', '')::numeric;

    if v_amount is null then
      -- Ohne Menge: an eine bestehende Zeile derselben Zutat hängen, gleich
      -- in welcher Einheit. Gibt es mehrere (Zwiebeln in g und in Stück),
      -- entscheidet die Sortierung, damit das Ergebnis reproduzierbar ist.
      select id into v_entry_id
      from shopping_list_entries
      where list_id = p_list_id
        and ingredient_id = v_ingredient_id
      -- `collate "C"` ist kein Detail: ohne das entscheidet die Kollation der
      -- Datenbank, und die TypeScript-Seite in src/lib/core/mergeList.ts käme
      -- bei „g" gegen „Stück" auf eine andere Zeile.
      order by (merge_unit = 'ohne'), merge_unit collate "C"
      limit 1;

      if v_entry_id is null then
        insert into shopping_list_entries (list_id, ingredient_id, merge_unit)
        values (p_list_id, v_ingredient_id, 'ohne')
        returning id into v_entry_id;
      end if;
    else
      insert into shopping_list_entries (list_id, ingredient_id, merge_unit)
      values (p_list_id, v_ingredient_id, v_merge_unit)
      on conflict (list_id, ingredient_id, merge_unit) do update
        set updated_at = now()
      returning id into v_entry_id;

      -- Der andere Weg durch dieselbe Tür: lag für diese Zutat bisher nur eine
      -- mengenlose Zeile vor, wandern deren Herkunftszeilen hierher und die
      -- leere Zeile verschwindet. Nur so ist das Ergebnis unabhängig davon,
      -- in welcher Reihenfolge die Rezepte auf die Liste kamen.
      update shopping_list_sources s
      set entry_id = v_entry_id
      from shopping_list_entries e
      where s.entry_id = e.id
        and e.list_id = p_list_id
        and e.ingredient_id = v_ingredient_id
        and e.merge_unit = 'ohne';

      delete from shopping_list_entries e
      where e.list_id = p_list_id
        and e.ingredient_id = v_ingredient_id
        and e.merge_unit = 'ohne'
        and not e.is_manual
        and e.manual_amount is null
        and not exists (select 1 from shopping_list_sources s where s.entry_id = e.id);
    end if;

    insert into shopping_list_sources (
      entry_id, recipe_id, recipe_ingredient_id, servings, factor, amount_base
    )
    values (
      v_entry_id,
      p_recipe_id,
      nullif(v_item ->> 'recipe_ingredient_id', '')::uuid,
      p_servings,
      p_servings::numeric / v_base_servings,
      v_amount
    );

    -- Kommt Menge auf eine bereits abgehakte Zeile, muss das Häkchen weg —
    -- sonst steht im Laden „erledigt", obwohl Nachschlag gebraucht wird.
    update shopping_list_entries
    set checked = false, checked_at = null, checked_by = null, updated_at = now()
    where id = v_entry_id and checked;
  end loop;

  delete from shopping_list_entries e
  where e.list_id = p_list_id
    and not e.is_manual
    and e.manual_amount is null
    and not exists (select 1 from shopping_list_sources s where s.entry_id = e.id);

  return p_list_id;
end;
$$;

-- Bestehende Listen einmalig aufräumen: Zeilen, deren Quellen ausnahmslos ohne
-- Menge sind, an eine Mengenzeile derselben Zutat hängen.
do $$
declare
  v_row record;
begin
  for v_row in
    select leer.id as leer_id, voll.id as voll_id
    from shopping_list_entries leer
    join shopping_list_entries voll
      on voll.list_id = leer.list_id
     and voll.ingredient_id = leer.ingredient_id
     and voll.id <> leer.id
    where not leer.is_manual
      and leer.manual_amount is null
      and not exists (
        select 1 from shopping_list_sources s
        where s.entry_id = leer.id and s.amount_base is not null
      )
      and exists (
        select 1 from shopping_list_sources s
        where s.entry_id = voll.id and s.amount_base is not null
      )
  loop
    update shopping_list_sources set entry_id = v_row.voll_id
    where entry_id = v_row.leer_id;

    delete from shopping_list_entries where id = v_row.leer_id;
  end loop;
end;
$$;
