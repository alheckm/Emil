-- Kernmutationen als Postgres-Funktionen.
--
-- Architektur-Leitregel 5: jede Kernmutation existiert als RPC oder als Route
-- unter /api/v1 — niemals nur als Next.js Server Action, die ein nativer
-- Client nicht aufrufen könnte.
--
-- Wichtig zur Arbeitsteilung: das RECHNEN (skalieren, Einheiten umrechnen,
-- zusammenfassen) passiert in src/lib/core und wird hier NICHT wiederholt.
-- add_recipe_to_list bekommt die fertigen Positionen und ist nur die
-- Transaktionsgrenze. Zwei Implementierungen derselben Mengenlehre — eine in
-- TypeScript, eine in SQL — würden unweigerlich auseinanderlaufen, und der
-- Fehler fiele erst im Supermarkt auf.

/**
 * Haushalt anlegen und den Aufrufer als Eigentümer eintragen.
 *
 * SECURITY DEFINER mit Absicht: household_members darf für Nutzer KEINE
 * INSERT-Policy haben. Gäbe es eine Policy „user_id = auth.uid()", könnte sich
 * jeder mit einer geratenen household_id in einen fremden Haushalt eintragen.
 * Mitgliedschaften entstehen deshalb ausschließlich hier und in redeem_invite.
 */
create or replace function create_household(p_name text)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_household_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Nicht angemeldet';
  end if;
  if coalesce(btrim(p_name), '') = '' then
    raise exception 'Der Haushalt braucht einen Namen';
  end if;

  insert into households (name) values (btrim(p_name))
  returning id into v_household_id;

  insert into household_members (household_id, user_id, role)
  values (v_household_id, auth.uid(), 'owner');

  insert into shopping_lists (household_id) values (v_household_id);

  return v_household_id;
end;
$$;

/** Einladungscode erzeugen. Kurz genug zum Vorlesen, lang genug gegen Raten. */
create or replace function create_invite(p_household_id uuid)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_code text;
begin
  if not exists (
    select 1 from household_members
    where household_id = p_household_id and user_id = auth.uid()
  ) then
    raise exception 'Kein Zugriff auf diesen Haushalt';
  end if;

  -- 8 Zeichen aus einem Alphabet ohne 0/O/1/I/l — die verwechselt man beim
  -- Abtippen vom anderen Handy.
  select string_agg(
    substr('23456789ABCDEFGHJKLMNPQRSTUVWXYZ',
           1 + floor(random() * 32)::int, 1), '')
  into v_code
  from generate_series(1, 8);

  insert into invites (code, household_id, created_by)
  values (v_code, p_household_id, auth.uid());

  return v_code;
end;
$$;

/** Einladung einlösen und dem Haushalt beitreten. */
create or replace function redeem_invite(p_code text)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_invite invites;
begin
  if auth.uid() is null then
    raise exception 'Nicht angemeldet';
  end if;

  select * into v_invite from invites
  where code = upper(btrim(p_code))
  for update;

  if v_invite is null then
    raise exception 'Diesen Einladungscode gibt es nicht';
  end if;
  if v_invite.used_by is not null then
    raise exception 'Dieser Einladungscode wurde schon benutzt';
  end if;
  if v_invite.expires_at < now() then
    raise exception 'Dieser Einladungscode ist abgelaufen';
  end if;

  insert into household_members (household_id, user_id, role)
  values (v_invite.household_id, auth.uid(), 'member')
  on conflict (household_id, user_id) do nothing;

  update invites set used_by = auth.uid(), used_at = now()
  where code = v_invite.code;

  return v_invite.household_id;
end;
$$;

/** Aktive Einkaufsliste eines Haushalts, notfalls neu angelegt. */
create or replace function active_list_id(p_household_id uuid)
returns uuid
language plpgsql
security invoker
as $$
declare
  v_list_id uuid;
begin
  select id into v_list_id from shopping_lists
  where household_id = p_household_id and is_active
  limit 1;

  if v_list_id is null then
    insert into shopping_lists (household_id) values (p_household_id)
    returning id into v_list_id;
  end if;

  return v_list_id;
end;
$$;

/**
 * Rezept auf die Einkaufsliste legen — eine Transaktion, alles oder nichts.
 *
 * p_items kommt fertig gerechnet aus src/lib/core/mergeList.ts:
 *   [{ "ingredient_id": uuid, "merge_unit": text,
 *      "amount_base": numeric|null, "recipe_ingredient_id": uuid }]
 *
 * Legt man dasselbe Rezept erneut auf die Liste, ersetzt es seinen eigenen
 * früheren Anteil statt ihn zu verdoppeln — sonst steht nach zweimal Tippen
 * die doppelte Menge da.
 */
create or replace function add_recipe_to_list(
  p_list_id uuid,
  p_recipe_id uuid,
  p_servings int,
  p_items jsonb
)
returns uuid
language plpgsql
security invoker
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
    and e.manual_amount is null
    and not exists (select 1 from shopping_list_sources s where s.entry_id = e.id);

  return p_list_id;
end;
$$;

/** Rezept von der Liste nehmen: nur dessen Anteil verschwindet. */
create or replace function remove_recipe_from_list(p_list_id uuid, p_recipe_id uuid)
returns void
language plpgsql
security invoker
as $$
begin
  delete from shopping_list_sources
  where recipe_id = p_recipe_id
    and entry_id in (select id from shopping_list_entries where list_id = p_list_id);

  delete from shopping_list_entries e
  where e.list_id = p_list_id
    and e.manual_amount is null
    and not exists (select 1 from shopping_list_sources s where s.entry_id = e.id);
end;
$$;

/**
 * Häkchen setzen — mit Zeitstempel-Vergleich für die Offline-Synchronisation.
 *
 * Zwei Handys im Supermarkt haken gleichzeitig ab; eines war offline. Beim
 * Nachliefern gewinnt der jüngere Stand. Ohne diesen Vergleich würde ein alter
 * Puffer-Eintrag ein neueres Häkchen wieder aufheben.
 */
create or replace function set_entry_checked(
  p_entry_id uuid,
  p_checked boolean,
  p_client_updated_at timestamptz default null
)
returns shopping_list_entries
language plpgsql
security invoker
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

  return v_entry;
end;
$$;

/**
 * Eigene Haushaltsdaten löschen (Vorstufe zum Konto löschen).
 *
 * Der Auth-Nutzer selbst wird von /api/v1/account mit dem Service-Key
 * entfernt — das kann SQL im Nutzerkontext nicht. Hier wird aufgeräumt, was
 * sonst verwaist zurückbliebe: die Mitgliedschaft und ein Haushalt, in dem
 * danach niemand mehr ist (per Kaskade samt Rezepten, Listen und Bildpfaden).
 */
create or replace function delete_own_household_data()
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_household_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Nicht angemeldet';
  end if;

  for v_household_id in
    select household_id from household_members where user_id = auth.uid()
  loop
    delete from household_members
    where household_id = v_household_id and user_id = auth.uid();

    if not exists (
      select 1 from household_members where household_id = v_household_id
    ) then
      delete from households where id = v_household_id;
    end if;
  end loop;
end;
$$;
