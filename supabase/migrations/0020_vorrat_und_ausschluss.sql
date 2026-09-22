-- Zutaten, die man ohnehin fast immer im Haus hat.
--
-- Zwei Stufen, bewusst unterschieden:
--
-- - **Nie auf der Liste** (`pantry_staple`): Salz, Pfeffer, Bratöl, Olivenöl.
--   Die kauft man so selten nach, dass sie über ein Rezept nie automatisch
--   auftauchen sollen — von Hand ergänzen bleibt möglich, `add_manual_entry`
--   prüft das Flag bewusst nicht.
-- - **Eigene Abteilung "Noch vorrätig?"**: Gewürze und Brühe. Die sind
--   seltener alle, aber oft genug schon da, dass sie vor dem Losgehen einen
--   kurzen Blick in den Vorrat verdienen, statt einfach zwischen dem
--   Wocheneinkauf zu stehen. ListView zeigt sie darum als eigenen Abschnitt,
--   direkt über "Eingekauft".
--
-- Zugeordnet wird über name_norm statt über feste IDs — Zutaten-IDs entstehen
-- per gen_random_uuid() beim Einfügen des Seeds und unterscheiden sich also
-- zwischen den Umgebungen; der normalisierte Name ist die einzige Zuordnung,
-- die überall dieselbe Zutat trifft (siehe resolve_ingredient in 0009).

alter table ingredients
  add column pantry_staple boolean not null default false;

comment on column ingredients.pantry_staple is
  'Zutat, die man in aller Regel vorrätig hat (Salz, Pfeffer, Bratöl, Olivenöl). '
  'add_recipe_to_list überspringt sie; add_manual_entry prüft das Flag nicht, '
  'von Hand bleibt sie also weiterhin ergänzbar.';

update ingredients set pantry_staple = true
where name_norm in (
  'bratöl',
  'brat- oder mildes olivenöl',
  'olivenöl',
  'salz',
  'meersalz',
  'pfeffer',
  'salz und pfeffer',
  'schwarzer pfeffer'
);

insert into categories (id, name, sort_order) values
  ('noch-vorraetig', 'Noch vorrätig?', 95)
on conflict (id) do update
  set name = excluded.name, sort_order = excluded.sort_order;

update ingredients set category_id = 'noch-vorraetig'
where name_norm in (
  'cayennepfeffer',
  'chiliflocken',
  'currypulver',
  'scharfes currypulver',
  'gemahlener kreuzkümmel',
  'getrockneter oregano',
  'getrockneter rosmarin',
  'getrockneter thymian',
  'italienische kräuter',
  'kardamom',
  'koriandersamen',
  'kräuter der provence',
  'kreuzkümmel',
  'kümmel',
  'kurkuma',
  'lorbeerblatt',
  'lorbeerblätter',
  'majoran',
  'muskatnuss',
  'nelken',
  'gewürznelke',
  'paprikapulver',
  'senfkörner',
  'wacholderbeeren',
  'wacholderbeere',
  'zimt',
  'brühe',
  'gemüsebrühe',
  'gemüsebrühepulver',
  'hühnerbrühe',
  'rinderbrühe'
);

-- Was jetzt schon von einem Rezept auf einer aktiven Liste liegt, aber nie
-- mehr automatisch dazukommen soll, gleich mit aufräumen — außer es steht
-- dort von Hand.
delete from shopping_list_sources s
using shopping_list_entries e, ingredients i
where s.entry_id = e.id
  and e.ingredient_id = i.id
  and i.pantry_staple
  and not e.is_manual;

delete from shopping_list_entries e
using ingredients i
where e.ingredient_id = i.id
  and i.pantry_staple
  and not e.is_manual
  and e.manual_amount is null
  and not exists (select 1 from shopping_list_sources s where s.entry_id = e.id);

-- add_recipe_to_list überspringt Vorrats-Zutaten von vornherein, statt sie
-- erst einzufügen und hinterher wieder aufzuräumen.
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

    if exists (
      select 1 from ingredients where id = v_ingredient_id and pantry_staple
    ) then
      continue;
    end if;

    insert into shopping_list_entries (list_id, ingredient_id, merge_unit)
    values (
      p_list_id,
      v_ingredient_id,
      v_item ->> 'merge_unit'
    )
    on conflict (list_id, ingredient_id, merge_unit) do update
      set updated_at = now()
    returning id into v_entry_id;

    v_amount := nullif(v_item ->> 'amount_base', '')::numeric;

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

  -- Zeilen, die durch das Neuberechnen leer geworden sind, aufräumen.
  delete from shopping_list_entries e
  where e.list_id = p_list_id
    and not e.is_manual
    and e.manual_amount is null
    and not exists (select 1 from shopping_list_sources s where s.entry_id = e.id);

  return p_list_id;
end;
$$;
