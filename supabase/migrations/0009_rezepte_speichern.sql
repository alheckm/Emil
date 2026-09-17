-- Was P3 zusätzlich braucht: Rezepte speichern, Zutaten kanonisieren,
-- Zeilen von Hand ergänzen — und Realtime, damit das zweite Handy es sieht.
--
-- Die Mengenlehre bleibt auch hier in src/lib/core: save_recipe nimmt fertig
-- geparste Zeilen entgegen und rechnet nichts nach. Was SQL hier übernimmt,
-- ist ausschließlich das, was nur die Datenbank kann — Transaktionsgrenze,
-- Ähnlichkeitssuche, Eindeutigkeit.

-- ------------------------------------------------- Von Hand ergänzte Zeilen --

-- Ohne diese Markierung wäre „Zahnpasta" (keine Menge, kein Rezept dahinter)
-- nicht von einer leer gewordenen Rezeptzeile zu unterscheiden — und das
-- Aufräumen am Ende von add_recipe_to_list würde sie beim nächsten Rezept
-- stillschweigend wegwerfen.
alter table shopping_list_entries
  add column is_manual boolean not null default false;

-- Die View zieht ihre Spalten per e.* — das wird beim Anlegen einmal
-- ausgeschrieben und kennt is_manual sonst nie. `create or replace` kann
-- Spalten nur hinten anhängen, deshalb neu anlegen.
drop view shopping_list_entry_totals;

/**
 * Listenzeilen mit ausgerechneter Gesamtmenge.
 *
 * security_invoker ist entscheidend: ohne das liefe die View mit den Rechten
 * ihres Eigentümers und würde die RLS der Tabellen darunter aushebeln — die
 * Liste eines fremden Haushalts wäre lesbar.
 */
create view shopping_list_entry_totals
with (security_invoker = true) as
select
  e.*,
  src.source_count,
  src.quantified_count,
  case
    when e.manual_amount is null and coalesce(src.quantified_count, 0) = 0
      then null
    else coalesce(e.manual_amount, 0) + coalesce(src.sum_amount, 0)
  end as total_amount,
  -- Mindestens eine Quelle ohne Menge („Salz und Pfeffer" neben „1 TL Salz").
  coalesce(src.source_count, 0) > coalesce(src.quantified_count, 0)
    as has_unquantified
from shopping_list_entries e
left join lateral (
  select
    count(*) as source_count,
    count(s.amount_base) as quantified_count,
    sum(s.amount_base) as sum_amount
  from shopping_list_sources s
  where s.entry_id = e.id
) src on true;

-- Beide Aufräum-Stellen aus 0005 nachziehen: eine Zeile von Hand überlebt,
-- auch wenn sie weder Menge noch Quelle hat.
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
    insert into shopping_list_entries (list_id, ingredient_id, merge_unit)
    values (
      p_list_id,
      (v_item ->> 'ingredient_id')::uuid,
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

create or replace function remove_recipe_from_list(p_list_id uuid, p_recipe_id uuid)
returns void
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  delete from shopping_list_sources
  where recipe_id = p_recipe_id
    and entry_id in (select id from shopping_list_entries where list_id = p_list_id);

  delete from shopping_list_entries e
  where e.list_id = p_list_id
    and not e.is_manual
    and e.manual_amount is null
    and not exists (select 1 from shopping_list_sources s where s.entry_id = e.id);
end;
$$;

/**
 * Zeile von Hand auf die Liste setzen.
 *
 * Mengen werden addiert statt überschrieben: wer zweimal „2 Zitronen" tippt,
 * meint vier. Und wie beim Rezept fällt ein Häkchen weg, sobald Menge
 * dazukommt — sonst steht im Laden „erledigt", obwohl mehr gebraucht wird.
 *
 * p_amount kommt bereits in p_merge_unit umgerechnet aus
 * src/lib/core/mergeList.ts; hier wird nichts nachgerechnet.
 */
create or replace function add_manual_entry(
  p_list_id uuid,
  p_ingredient_id uuid,
  p_merge_unit text,
  p_amount numeric default null,
  p_note text default null
)
returns uuid
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_entry_id uuid;
begin
  insert into shopping_list_entries (
    list_id, ingredient_id, merge_unit, manual_amount, note, is_manual
  )
  values (
    p_list_id, p_ingredient_id, p_merge_unit, p_amount,
    nullif(btrim(coalesce(p_note, '')), ''), true
  )
  on conflict (list_id, ingredient_id, merge_unit) do update
    set manual_amount = case
          when p_amount is null then shopping_list_entries.manual_amount
          else coalesce(shopping_list_entries.manual_amount, 0) + p_amount
        end,
        note = coalesce(
          nullif(btrim(coalesce(p_note, '')), ''), shopping_list_entries.note
        ),
        is_manual = true,
        checked = false,
        checked_at = null,
        checked_by = null,
        updated_at = now()
  returning id into v_entry_id;

  return v_entry_id;
end;
$$;

-- ------------------------------------------------------ Zutaten kanonisieren --

/**
 * Zutatennamen auf einen Eintrag in `ingredients` abbilden, notfalls neu anlegen.
 *
 * Vier Stufen, absichtlich in dieser Reihenfolge: exakter Name → Alias →
 * Ähnlichkeit → neu. Nur so wird aus „Zwiebel" in drei Rezepten eine einzige
 * Zeile auf der Einkaufsliste; ohne diesen Schritt stünde dieselbe Zutat
 * dreimal da und das Zusammenfassen liefe ins Leere.
 *
 * Eigene Zutaten des Haushalts schlagen die globalen aus dem Seed: wer
 * „Paprika" einmal selbst angelegt und einer Abteilung zugeordnet hat, soll
 * seine Zuordnung behalten.
 *
 * Die Schwelle 0.85 steht ebenso in src/lib/core/ingredientName.ts. Der
 * trgm-Index hilft nur dem %-Operator; bei ein paar hundert Zutaten ist der
 * vollständige Durchlauf der Ähnlichkeitssuche ohnehin billiger als die
 * Unschärfe eines zweiten Schwellenwerts.
 */
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
    and similarity(name_norm, v_norm) >= 0.85
  order by similarity(name_norm, v_norm) desc, (household_id is not null) desc
  limit 1;
  if v_id is not null then return v_id; end if;

  insert into ingredients (household_id, name_norm, display_name, category_id)
  values (p_household_id, v_norm, btrim(p_name), 'sonstiges')
  on conflict (household_id, name_norm) where household_id is not null
    do nothing
  returning id into v_id;

  -- Zwei Geräte, dieselbe neue Zutat, gleichzeitig: der zweite Aufruf bekommt
  -- nichts zurück und liest den Eintrag des ersten.
  if v_id is null then
    select id into v_id from ingredients
    where household_id = p_household_id and name_norm = v_norm;
  end if;

  return v_id;
end;
$$;

-- ------------------------------------------------------- Rezept speichern --

/**
 * Rezept anlegen oder ändern — mit allen Zutatenzeilen in einer Transaktion.
 *
 * Die Zeilen werden beim Ändern ersetzt statt abgeglichen. Das ist die
 * ehrliche Variante: eine Zutatenzeile hat keine stabile Identität, die eine
 * Bearbeitung überlebt (aus „2 Zwiebeln" wird „1 Zwiebel, 1 Lauch"), und ein
 * Abgleich über Positionen würde Mengen an falsche Namen heften.
 *
 * Der Preis: `shopping_list_sources` hängt per Kaskade an den alten Zeilen und
 * verschwindet mit ihnen. Deshalb gibt die Funktion zurück, auf welchen Listen
 * das Rezept mit welcher Portionszahl lag — der Aufrufer legt es anschließend
 * mit `add_recipe_to_list` frisch gerechnet wieder drauf. Das Rechnen bleibt
 * damit in src/lib/core, wo es getestet ist, statt hier in SQL noch einmal zu
 * entstehen.
 */
create or replace function save_recipe(
  p_household_id uuid,
  p_recipe jsonb,
  p_ingredients jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_recipe_id uuid := nullif(p_recipe ->> 'id', '')::uuid;
  v_title text := btrim(coalesce(p_recipe ->> 'title', ''));
  v_base_servings int := coalesce((p_recipe ->> 'base_servings')::int, 4);
  v_lists jsonb := '[]'::jsonb;
  v_item jsonb;
  v_ingredient_id uuid;
  v_position int := 0;
begin
  if v_title = '' then
    raise exception 'Das Rezept braucht einen Titel';
  end if;
  if v_base_servings <= 0 then
    raise exception 'Portionszahl muss größer als 0 sein';
  end if;

  if v_recipe_id is null then
    insert into recipes (
      household_id, title, source_type, source_url, base_servings,
      servings_label, total_time_min, instructions, notes, tags, created_by
    )
    values (
      p_household_id,
      v_title,
      coalesce(p_recipe ->> 'source_type', 'manual'),
      nullif(p_recipe ->> 'source_url', ''),
      v_base_servings,
      coalesce(nullif(p_recipe ->> 'servings_label', ''), 'Portionen'),
      nullif(p_recipe ->> 'total_time_min', '')::int,
      coalesce(p_recipe -> 'instructions', '[]'::jsonb),
      nullif(p_recipe ->> 'notes', ''),
      coalesce(
        (select array_agg(value) from jsonb_array_elements_text(
           coalesce(p_recipe -> 'tags', '[]'::jsonb))),
        '{}'
      ),
      auth.uid()
    )
    returning id into v_recipe_id;
  else
    update recipes set
      title = v_title,
      source_type = coalesce(p_recipe ->> 'source_type', source_type),
      source_url = nullif(p_recipe ->> 'source_url', ''),
      base_servings = v_base_servings,
      servings_label = coalesce(nullif(p_recipe ->> 'servings_label', ''), 'Portionen'),
      total_time_min = nullif(p_recipe ->> 'total_time_min', '')::int,
      instructions = coalesce(p_recipe -> 'instructions', '[]'::jsonb),
      notes = nullif(p_recipe ->> 'notes', ''),
      tags = coalesce(
        (select array_agg(value) from jsonb_array_elements_text(
           coalesce(p_recipe -> 'tags', '[]'::jsonb))),
        '{}'
      )
    where id = v_recipe_id
    returning id into v_recipe_id;

    -- RLS lässt ein fremdes Rezept gar nicht erst sehen; dann kommt hier
    -- nichts zurück und wir sagen es, statt stillschweigend anzulegen.
    if v_recipe_id is null then
      raise exception 'Rezept nicht gefunden';
    end if;

    select coalesce(jsonb_agg(distinct jsonb_build_object(
             'list_id', e.list_id, 'servings', s.servings)), '[]'::jsonb)
    into v_lists
    from shopping_list_sources s
    join shopping_list_entries e on e.id = s.entry_id
    where s.recipe_id = v_recipe_id;

    delete from recipe_ingredients where recipe_id = v_recipe_id;
  end if;

  for v_item in select * from jsonb_array_elements(coalesce(p_ingredients, '[]'::jsonb))
  loop
    v_position := v_position + 1;

    v_ingredient_id := case
      when btrim(coalesce(v_item ->> 'name', '')) = '' then null
      else resolve_ingredient(p_household_id, v_item ->> 'name')
    end;

    insert into recipe_ingredients (
      recipe_id, position, group_label, raw_text, amount, amount_max,
      unit_code, ingredient_id, note, to_taste, parse_confidence
    )
    values (
      v_recipe_id,
      v_position,
      nullif(btrim(coalesce(v_item ->> 'group_label', '')), ''),
      coalesce(nullif(btrim(coalesce(v_item ->> 'raw_text', '')), ''),
               btrim(coalesce(v_item ->> 'name', ''))),
      nullif(v_item ->> 'amount', '')::numeric,
      nullif(v_item ->> 'amount_max', '')::numeric,
      nullif(v_item ->> 'unit_code', ''),
      v_ingredient_id,
      nullif(btrim(coalesce(v_item ->> 'note', '')), ''),
      coalesce((v_item ->> 'to_taste')::boolean, false),
      coalesce(nullif(v_item ->> 'parse_confidence', '')::numeric, 1)
    );
  end loop;

  return jsonb_build_object('recipe_id', v_recipe_id, 'lists', v_lists);
end;
$$;

-- ------------------------------------------------------------------ Rechte --

revoke all on function resolve_ingredient(uuid, text) from public, anon;
grant execute on function resolve_ingredient(uuid, text) to authenticated;

revoke all on function save_recipe(uuid, jsonb, jsonb) from public, anon;
grant execute on function save_recipe(uuid, jsonb, jsonb) to authenticated;

revoke all on function add_manual_entry(uuid, uuid, text, numeric, text) from public, anon;
grant execute on function add_manual_entry(uuid, uuid, text, numeric, text)
  to authenticated;

-- ---------------------------------------------------------------- Realtime --

-- Beide Tabellen, nicht nur die Zeilen: legt das andere Handy ein Rezept auf
-- eine Zeile, die es schon gibt, ändert sich nur die Summe darunter — die
-- Zeile selbst bekäme kein Ereignis und die Menge bliebe stehen.
alter publication supabase_realtime add table shopping_list_entries;
alter publication supabase_realtime add table shopping_list_sources;

-- Ohne `replica identity full` steht im Ereignis einer gelöschten Zeile nur
-- der Primärschlüssel. Realtime prüft die RLS-Policy aber auf dem Datensatz —
-- und die von shopping_list_sources hängt an entry_id. Ohne die übrigen
-- Spalten fällt die Prüfung durch und das Löschen erreicht das zweite Handy
-- nie: dort bliebe eine längst entfernte Zeile stehen.
alter table shopping_list_entries replica identity full;
alter table shopping_list_sources replica identity full;
