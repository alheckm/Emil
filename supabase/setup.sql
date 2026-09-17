-- AUTOMATISCH ERZEUGT von scripts/build-setup-sql.mjs — nicht bearbeiten.
-- Neu erzeugen mit: npm run sql
--
-- Einmalig im Supabase-SQL-Editor ausführen (Region Frankfurt).
-- Läuft als eine Transaktion: entweder steht danach alles, oder nichts.

begin;

-- ===================================================================
-- supabase/migrations/0001_haushalte.sql
-- ===================================================================

-- Haushalte, Mitgliedschaften, Einladungen.
--
-- Der Haushalt ist die einzige Grenze, die in Emil zählt: alles Weitere hängt
-- an household_id, und die RLS-Policies in 0006 setzen genau darauf auf.

create extension if not exists pg_trgm;

create table households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table household_members (
  household_id uuid not null references households (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  created_at timestamptz not null default now(),
  primary key (household_id, user_id)
);

-- Diesen Index braucht jede einzelne RLS-Prüfung. Ohne ihn wird die App
-- langsam, sobald ein paar hundert Rezepte drin sind.
create index household_members_user_idx on household_members (user_id);

create table invites (
  code text primary key,
  household_id uuid not null references households (id) on delete cascade,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '14 days',
  used_by uuid references auth.users (id) on delete set null,
  used_at timestamptz
);

create index invites_household_idx on invites (household_id);

-- Für den iOS-Kurzbefehl (P7): ein Bearer-Token pro Gerät, damit das
-- Teilen-Menü eine URL an /api/v1/import/url schicken kann. Gespeichert wird
-- nur der Hash — ein Datenbankleck gibt damit keinen Zugriff her.
create table household_tokens (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  token_hash text not null unique,
  label text not null default 'iOS-Kurzbefehl',
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  last_used_at timestamptz
);

/**
 * Haushalte des angemeldeten Nutzers.
 *
 * SECURITY DEFINER ist hier kein Schlamperei-Workaround, sondern notwendig:
 * eine Policy auf household_members, die selbst household_members abfragt,
 * ruft sich rekursiv auf und wird von Postgres abgewiesen. Die Funktion bricht
 * den Kreis und ist bewusst minimal — sie gibt nur IDs zurück, nie Daten.
 */
create or replace function current_household_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select household_id from household_members where user_id = auth.uid();
$$;

revoke all on function current_household_ids() from public;
grant execute on function current_household_ids() to authenticated;

-- ===================================================================
-- supabase/migrations/0002_stammdaten.sql
-- ===================================================================

-- Stammdaten: Supermarkt-Abteilungen, Einheiten, Zutaten.
--
-- categories und units sind global und für alle lesbar. Zutaten gibt es in
-- zwei Sorten: globale (household_id is null, aus dem Seed) und eigene, die
-- beim Importieren entstehen. Dadurch startet ein neuer Haushalt nicht mit
-- einer leeren Zutatenliste, kann aber eigene Namen anlegen.

create table categories (
  id text primary key,
  name text not null,
  sort_order int not null
);

create table units (
  code text primary key,
  display text not null,
  -- Spiegelt src/lib/core/types.ts. mass/volume rechnen um, spoon/count nicht.
  dimension text not null check (dimension in ('mass', 'volume', 'spoon', 'count')),
  base_factor numeric(12, 6) not null
);

create table ingredients (
  id uuid primary key default gen_random_uuid(),
  -- null = globale Zutat aus dem Seed, sonst haushaltseigen
  household_id uuid references households (id) on delete cascade,
  name_norm text not null,
  display_name text not null,
  category_id text references categories (id) on delete set null,
  created_at timestamptz not null default now()
);

create unique index ingredients_global_name_idx
  on ingredients (name_norm) where household_id is null;
create unique index ingredients_household_name_idx
  on ingredients (household_id, name_norm) where household_id is not null;

-- Ähnlichkeitssuche: lässt „Zwiebeln" auf „Zwiebel" treffen, ohne dass für
-- jede Schreibweise ein Alias gepflegt werden muss.
create index ingredients_name_trgm_idx
  on ingredients using gin (name_norm gin_trgm_ops);

create table ingredient_aliases (
  alias_norm text not null,
  ingredient_id uuid not null references ingredients (id) on delete cascade,
  household_id uuid references households (id) on delete cascade,
  primary key (alias_norm, ingredient_id)
);

create index ingredient_aliases_ingredient_idx
  on ingredient_aliases (ingredient_id);

/**
 * Normalisierte Schreibweise einer Zutat.
 *
 * Muss mit normalizeIngredientName() in src/lib/core/ingredientName.ts
 * übereinstimmen — sonst findet die Datenbank eine Zutat nicht wieder, die die
 * App gerade angelegt hat. Beide Seiten sind getestet.
 */
create or replace function normalize_ingredient_name(p_name text)
returns text
language sql
immutable
as $$
  select btrim(regexp_replace(lower(coalesce(p_name, '')), '\s+', ' ', 'g'));
$$;

-- ===================================================================
-- supabase/migrations/0003_rezepte.sql
-- ===================================================================

-- Rezepte und ihre Zutatenzeilen.
--
-- Gespeichert wird immer die BASISMENGE zusammen mit base_servings, niemals
-- eine skalierte Menge. Jede Anzeige rechnet frisch daraus — nur so kommt ein
-- Weg von 4 auf 6 und zurück auf 4 Portionen wieder bei der Originalmenge
-- heraus (siehe src/lib/core/scale.ts).

create table recipes (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  title text not null,
  source_type text not null default 'manual'
    check (source_type in ('manual', 'url', 'paste', 'photo')),
  source_url text,
  -- Pfad im Storage-Bucket, nicht das Bild selbst: {household_id}/{recipe_id}/…
  image_path text,
  base_servings int not null default 4 check (base_servings > 0),
  servings_label text not null default 'Portionen',
  total_time_min int check (total_time_min is null or total_time_min > 0),
  instructions jsonb not null default '[]'::jsonb,
  notes text,
  tags text[] not null default '{}',
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index recipes_household_idx on recipes (household_id, created_at desc);
create index recipes_tags_idx on recipes using gin (tags);
create index recipes_title_trgm_idx on recipes using gin (title gin_trgm_ops);

create table recipe_ingredients (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references recipes (id) on delete cascade,
  position int not null,
  group_label text,
  -- Die Originalzeile. Wenn das Parsen daneben lag, ist das hier die Wahrheit.
  raw_text text not null,
  amount numeric(12, 4),
  amount_max numeric(12, 4),
  unit_code text references units (code),
  ingredient_id uuid references ingredients (id) on delete set null,
  note text,
  to_taste boolean not null default false,
  parse_confidence numeric(3, 2) not null default 1
    check (parse_confidence >= 0 and parse_confidence <= 1)
);

create index recipe_ingredients_recipe_idx on recipe_ingredients (recipe_id, position);
create index recipe_ingredients_ingredient_idx on recipe_ingredients (ingredient_id);

create or replace function touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger recipes_touch_updated_at
  before update on recipes
  for each row execute function touch_updated_at();

-- ===================================================================
-- supabase/migrations/0004_einkaufsliste.sql
-- ===================================================================

-- Einkaufsliste: zusammengefasste Zeilen plus ihre Herkunft.
--
-- Abgehakt wird die zusammengefasste Zeile (entries), die Herkunft hängt
-- darunter (sources). Menge einer Zeile = Summe der sources + manual_amount.
-- Nimmst du ein Rezept von der Liste, verschwindet nur dessen Anteil; die
-- Zeile fällt erst weg, wenn nichts mehr übrig ist.

create table shopping_lists (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  name text not null default 'Einkaufsliste',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Genau eine aktive Liste pro Haushalt — sonst haken zwei Handys in
-- verschiedenen Listen ab und wundern sich.
create unique index shopping_lists_one_active_idx
  on shopping_lists (household_id) where is_active;

create table shopping_list_entries (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references shopping_lists (id) on delete cascade,
  ingredient_id uuid not null references ingredients (id) on delete cascade,
  -- Basiseinheit bei Gewicht/Volumen, sonst der Einheiten-Code selbst.
  -- Deshalb bleiben „2 Zwiebeln" und „500 g Zwiebeln" zwei Zeilen.
  merge_unit text not null,
  -- Von Hand ergänzte Menge, unabhängig von Rezepten.
  manual_amount numeric(12, 4),
  note text,
  checked boolean not null default false,
  checked_at timestamptz,
  checked_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  -- Grundlage der Offline-Konfliktauflösung (P6): letzter Schreiber gewinnt.
  updated_at timestamptz not null default now(),
  unique (list_id, ingredient_id, merge_unit)
);

create index shopping_list_entries_list_idx on shopping_list_entries (list_id);

create table shopping_list_sources (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references shopping_list_entries (id) on delete cascade,
  recipe_id uuid references recipes (id) on delete cascade,
  recipe_ingredient_id uuid references recipe_ingredients (id) on delete cascade,
  -- Portionen, mit denen das Rezept auf die Liste gelegt wurde.
  servings int not null check (servings > 0),
  factor numeric(12, 6) not null,
  -- Bereits skaliert UND in merge_unit umgerechnet.
  amount_base numeric(14, 4),
  created_at timestamptz not null default now()
);

create index shopping_list_sources_entry_idx on shopping_list_sources (entry_id);
create index shopping_list_sources_recipe_idx on shopping_list_sources (recipe_id);

create trigger shopping_list_entries_touch_updated_at
  before update on shopping_list_entries
  for each row execute function touch_updated_at();

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

-- ===================================================================
-- supabase/migrations/0005_funktionen.sql
-- ===================================================================

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

-- ===================================================================
-- supabase/migrations/0006_rls.sql
-- ===================================================================

-- Row Level Security.
--
-- Das ist die einzige Grenze, die in Emil wirklich zählt: sie liegt in der
-- Datenbank, nicht im Next.js-Code. Ein späterer nativer Client spricht direkt
-- mit derselben Datenbank und ist damit automatisch genauso abgesichert, ohne
-- dass etwas nachgebaut werden muss.

alter table households enable row level security;
alter table household_members enable row level security;
alter table invites enable row level security;
alter table household_tokens enable row level security;
alter table categories enable row level security;
alter table units enable row level security;
alter table ingredients enable row level security;
alter table ingredient_aliases enable row level security;
alter table recipes enable row level security;
alter table recipe_ingredients enable row level security;
alter table shopping_lists enable row level security;
alter table shopping_list_entries enable row level security;
alter table shopping_list_sources enable row level security;

-- ---------------------------------------------------------------- Haushalt --

create policy households_select on households
  for select to authenticated
  using (id in (select current_household_ids()));

create policy households_update on households
  for update to authenticated
  using (id in (select current_household_ids()))
  with check (id in (select current_household_ids()));

-- INSERT und DELETE laufen ausschließlich über create_household() bzw.
-- delete_own_household_data(). Absichtlich keine Policy dafür.

create policy household_members_select on household_members
  for select to authenticated
  using (household_id in (select current_household_ids()));

-- Kein INSERT für Nutzer: sonst könnte sich jeder mit einer geratenen
-- household_id in einen fremden Haushalt eintragen. Mitgliedschaften entstehen
-- nur in create_household() und redeem_invite().

create policy household_members_delete_self on household_members
  for delete to authenticated
  using (user_id = auth.uid());

-- -------------------------------------------------------------- Einladungen --

create policy invites_select on invites
  for select to authenticated
  using (household_id in (select current_household_ids()));

create policy invites_delete on invites
  for delete to authenticated
  using (household_id in (select current_household_ids()));

-- Erzeugt werden Codes nur über create_invite(); eingelöst über redeem_invite().
-- Es gibt bewusst KEINE Leseregel auf fremde Codes: wer einen Code einlöst,
-- muss ihn kennen, nicht finden können.

create policy household_tokens_all on household_tokens
  for all to authenticated
  using (household_id in (select current_household_ids()))
  with check (household_id in (select current_household_ids()));

-- --------------------------------------------------------------- Stammdaten --

create policy categories_select on categories for select to authenticated using (true);
create policy units_select on units for select to authenticated using (true);

-- Globale Zutaten (household_id is null) sind für alle lesbar, aber für
-- niemanden änderbar — sonst würde ein Haushalt den Seed für alle umbenennen.
create policy ingredients_select on ingredients
  for select to authenticated
  using (household_id is null or household_id in (select current_household_ids()));

create policy ingredients_insert on ingredients
  for insert to authenticated
  with check (household_id in (select current_household_ids()));

create policy ingredients_update on ingredients
  for update to authenticated
  using (household_id in (select current_household_ids()))
  with check (household_id in (select current_household_ids()));

create policy ingredients_delete on ingredients
  for delete to authenticated
  using (household_id in (select current_household_ids()));

create policy ingredient_aliases_select on ingredient_aliases
  for select to authenticated
  using (household_id is null or household_id in (select current_household_ids()));

create policy ingredient_aliases_write on ingredient_aliases
  for all to authenticated
  using (household_id in (select current_household_ids()))
  with check (household_id in (select current_household_ids()));

-- ------------------------------------------------------------------ Rezepte --

create policy recipes_all on recipes
  for all to authenticated
  using (household_id in (select current_household_ids()))
  with check (household_id in (select current_household_ids()));

create policy recipe_ingredients_all on recipe_ingredients
  for all to authenticated
  using (
    recipe_id in (
      select id from recipes where household_id in (select current_household_ids())
    )
  )
  with check (
    recipe_id in (
      select id from recipes where household_id in (select current_household_ids())
    )
  );

-- ------------------------------------------------------------ Einkaufsliste --

create policy shopping_lists_all on shopping_lists
  for all to authenticated
  using (household_id in (select current_household_ids()))
  with check (household_id in (select current_household_ids()));

create policy shopping_list_entries_all on shopping_list_entries
  for all to authenticated
  using (
    list_id in (
      select id from shopping_lists
      where household_id in (select current_household_ids())
    )
  )
  with check (
    list_id in (
      select id from shopping_lists
      where household_id in (select current_household_ids())
    )
  );

create policy shopping_list_sources_all on shopping_list_sources
  for all to authenticated
  using (
    entry_id in (
      select e.id from shopping_list_entries e
      join shopping_lists l on l.id = e.list_id
      where l.household_id in (select current_household_ids())
    )
  )
  with check (
    entry_id in (
      select e.id from shopping_list_entries e
      join shopping_lists l on l.id = e.list_id
      where l.household_id in (select current_household_ids())
    )
  );

-- ------------------------------------------------------------------ Storage --

insert into storage.buckets (id, name, public)
values ('recipe-images', 'recipe-images', false)
on conflict (id) do nothing;

-- Der erste Pfadabschnitt ist die household_id: {household_id}/{recipe_id}/{datei}
create policy recipe_images_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'recipe-images'
    and ((storage.foldername(name))[1])::uuid in (select current_household_ids())
  );

create policy recipe_images_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'recipe-images'
    and ((storage.foldername(name))[1])::uuid in (select current_household_ids())
  );

create policy recipe_images_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'recipe-images'
    and ((storage.foldername(name))[1])::uuid in (select current_household_ids())
  );

-- ===================================================================
-- supabase/migrations/0007_rechte.sql
-- ===================================================================

-- Ausführungsrechte und search_path der eigenen Funktionen.
--
-- Zwei Dinge, die der Supabase-Linter zu Recht anmahnt und die man nur einmal
-- richtig macht:
--
-- 1. `search_path` festnageln. Ohne feste Einstellung entscheidet die Sitzung
--    des Aufrufers, welches `public` gemeint ist. Bei `security definer` ist
--    das der klassische Weg, fremden Code mit Besitzerrechten auszuführen;
--    bei `security invoker` immerhin eine Quelle stiller Fehlgriffe.
--    `pg_temp` steht bewusst hinten: sonst könnte eine temporäre Tabelle eine
--    echte überdecken.
--
-- 2. `anon` die Rechte nehmen. Die RPC-Funktionen sind über
--    `/rest/v1/rpc/<name>` von außen erreichbar, und Postgres gibt neuen
--    Funktionen standardmäßig `execute` an `public` — also auch an den
--    nicht angemeldeten `anon`-Rollennutzer. Innen fielen die Aufrufe zwar
--    über `auth.uid() is null` hin, aber eine Grenze, die erst im
--    Funktionsrumpf greift, ist keine Grenze.
--
--    `revoke from public` allein genügt hier nicht: Supabase vergibt per
--    `alter default privileges` zusätzlich ein ausdrückliches `execute` an
--    `anon`, `authenticated` und `service_role`. Ein ausdrückliches Recht
--    überlebt den Entzug an `public` — `anon` muss einzeln genannt werden.
--    Aus demselben Grund reichte 0001 bei `current_household_ids` nicht aus;
--    die Funktion steht darum unten noch einmal.
--
-- `touch_updated_at` (Trigger) und `normalize_ingredient_name` (Index-Ausdruck)
-- werden nie über die API gerufen und behalten ihre Rechte; sie bekommen nur
-- den festen `search_path`.

alter function touch_updated_at()             set search_path = public, pg_temp;
alter function normalize_ingredient_name(text) set search_path = public, pg_temp;
alter function active_list_id(uuid)           set search_path = public, pg_temp;
alter function add_recipe_to_list(uuid, uuid, int, jsonb)
                                              set search_path = public, pg_temp;
alter function remove_recipe_from_list(uuid, uuid)
                                              set search_path = public, pg_temp;
alter function set_entry_checked(uuid, boolean, timestamptz)
                                              set search_path = public, pg_temp;

revoke all on function create_household(text) from public, anon;
grant execute on function create_household(text) to authenticated;

revoke all on function create_invite(uuid) from public, anon;
grant execute on function create_invite(uuid) to authenticated;

revoke all on function redeem_invite(text) from public, anon;
grant execute on function redeem_invite(text) to authenticated;

revoke all on function delete_own_household_data() from public, anon;
grant execute on function delete_own_household_data() to authenticated;

revoke all on function current_household_ids() from public, anon;
grant execute on function current_household_ids() to authenticated;

revoke all on function active_list_id(uuid) from public, anon;
grant execute on function active_list_id(uuid) to authenticated;

revoke all on function add_recipe_to_list(uuid, uuid, int, jsonb) from public, anon;
grant execute on function add_recipe_to_list(uuid, uuid, int, jsonb) to authenticated;

revoke all on function remove_recipe_from_list(uuid, uuid) from public, anon;
grant execute on function remove_recipe_from_list(uuid, uuid) to authenticated;

revoke all on function set_entry_checked(uuid, boolean, timestamptz) from public, anon;
grant execute on function set_entry_checked(uuid, boolean, timestamptz) to authenticated;

-- ===================================================================
-- supabase/migrations/0008_policies_nachziehen.sql
-- ===================================================================

-- Zwei Nachbesserungen an den Regeln aus 0006, beide vom Supabase-Linter
-- gefunden. An der Wirkung ändert sich nichts — nur daran, wie oft Postgres
-- rechnen muss.

-- 1. `auth.uid()` einmal statt einmal pro Zeile.
--
-- Ohne `select` hält der Planer den Aufruf für zeilenabhängig und ruft ihn für
-- jede geprüfte Zeile erneut auf. In `(select ...)` verpackt wird er einmal
-- ausgewertet und das Ergebnis wiederverwendet. Die übrigen Regeln machen das
-- über `(select current_household_ids())` längst; diese eine war übersehen.

drop policy household_members_delete_self on household_members;

create policy household_members_delete_self on household_members
  for delete to authenticated
  using (user_id = (select auth.uid()));

-- 2. Nur eine Regel je Tabelle und Zugriffsart.
--
-- `ingredient_aliases_write` galt `for all` und damit auch fürs Lesen. Beim
-- Lesen liefen also zwei Regeln nebeneinander, deren Ergebnis oder-verknüpft
-- wird — die schmalere (`_write`) konnte am Ergebnis nichts ändern, kostete
-- aber bei jeder Abfrage einen zweiten Durchlauf. Schreiben wird darum
-- ausdrücklich auf insert/update/delete aufgeteilt, Lesen bleibt allein bei
-- `_select` (das auch die globalen Aliase mit `household_id is null` sehen
-- lässt — die darf jeder lesen, aber niemand ändern).

drop policy ingredient_aliases_write on ingredient_aliases;

create policy ingredient_aliases_insert on ingredient_aliases
  for insert to authenticated
  with check (household_id in (select current_household_ids()));

create policy ingredient_aliases_update on ingredient_aliases
  for update to authenticated
  using (household_id in (select current_household_ids()))
  with check (household_id in (select current_household_ids()));

create policy ingredient_aliases_delete on ingredient_aliases
  for delete to authenticated
  using (household_id in (select current_household_ids()));

-- ===================================================================
-- supabase/migrations/0009_rezepte_speichern.sql
-- ===================================================================

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

-- ===================================================================
-- supabase/migrations/0010_mengenlose_zeilen.sql
-- ===================================================================

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

-- ===================================================================
-- supabase/migrations/0011_suche.sql
-- ===================================================================

-- Rezeptsuche über Titel und Zutaten.
--
-- Als Datenbankfunktion und nicht als Filter im Client, weil die Suche über
-- zwei Tabellen geht: „Zwiebel" soll auch Rezepte finden, deren Titel das Wort
-- nicht enthält. Über PostgREST wäre das ein umständlicher Mehrfachabruf; hier
-- ist es eine Abfrage, die die vorhandenen Trigram-Indizes nutzt.
--
-- SECURITY INVOKER: die Funktion sieht genau das, was der Aufrufer sehen darf.
-- Die RLS-Policies auf recipes und ingredients greifen unverändert.

create or replace function search_recipes(
  p_household_id uuid,
  p_query text default null,
  p_tag text default null
)
returns setof recipes
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select r.*
  from recipes r
  where r.household_id = p_household_id
    and (p_tag is null or p_tag = '' or r.tags @> array[p_tag])
    and (
      p_query is null or btrim(p_query) = ''
      or r.title ilike '%' || btrim(p_query) || '%'
      or exists (
        select 1
        from recipe_ingredients ri
        left join ingredients i on i.id = ri.ingredient_id
        where ri.recipe_id = r.id
          and (
            i.display_name ilike '%' || btrim(p_query) || '%'
            or ri.raw_text ilike '%' || btrim(p_query) || '%'
          )
      )
    )
  order by r.created_at desc;
$$;

/**
 * Alle vergebenen Schlagwörter eines Haushalts, mit Anzahl.
 *
 * Für die Filterleiste: nur Schlagwörter anzeigen, die es auch gibt — eine
 * leere Auswahl zum Antippen wäre ärgerlicher als keine.
 */
create or replace function household_tags(p_household_id uuid)
returns table (tag text, anzahl bigint)
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select t.tag, count(*) as anzahl
  from recipes r
  cross join lateral unnest(r.tags) as t(tag)
  where r.household_id = p_household_id
  group by t.tag
  order by count(*) desc, t.tag;
$$;

-- ===================================================================
-- supabase/migrations/0012_zutaten_treffer.sql
-- ===================================================================

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

-- ===================================================================
-- supabase/seed/0001_units.sql
-- ===================================================================

-- AUTOMATISCH ERZEUGT von scripts/generate-units-seed.mjs
-- Nicht von Hand bearbeiten: Quelle ist src/lib/core/units.ts.
-- Neu erzeugen mit: npm run seed:units

insert into units (code, display, dimension, base_factor) values
  ('g', 'g', 'mass', 1),
  ('kg', 'kg', 'mass', 1000),
  ('mg', 'mg', 'mass', 0.001),
  ('Pfund', 'Pfund', 'mass', 500),
  ('ml', 'ml', 'volume', 1),
  ('cl', 'cl', 'volume', 10),
  ('dl', 'dl', 'volume', 100),
  ('l', 'l', 'volume', 1000),
  ('EL', 'EL', 'spoon', 1),
  ('TL', 'TL', 'spoon', 1),
  ('Prise', 'Prise', 'spoon', 1),
  ('Msp', 'Msp.', 'spoon', 1),
  ('Tropfen', 'Tropfen', 'spoon', 1),
  ('Stück', 'Stück', 'count', 1),
  ('Zehe', 'Zehe', 'count', 1),
  ('Bund', 'Bund', 'count', 1),
  ('Dose', 'Dose', 'count', 1),
  ('Packung', 'Packung', 'count', 1),
  ('Päckchen', 'Päckchen', 'count', 1),
  ('Scheibe', 'Scheibe', 'count', 1),
  ('Stange', 'Stange', 'count', 1),
  ('Zweig', 'Zweig', 'count', 1),
  ('Blatt', 'Blatt', 'count', 1),
  ('Becher', 'Becher', 'count', 1),
  ('Glas', 'Glas', 'count', 1),
  ('Tasse', 'Tasse', 'count', 1),
  ('Würfel', 'Würfel', 'count', 1),
  ('Kugel', 'Kugel', 'count', 1),
  ('Kopf', 'Kopf', 'count', 1),
  ('Knolle', 'Knolle', 'count', 1),
  ('Handvoll', 'Handvoll', 'count', 1)
on conflict (code) do update
  set display = excluded.display,
      dimension = excluded.dimension,
      base_factor = excluded.base_factor;

-- ===================================================================
-- supabase/seed/0002_stammdaten.sql
-- ===================================================================

-- AUTOMATISCH ERZEUGT von scripts/generate-ingredients-seed.mjs
-- Nicht von Hand bearbeiten: Quelle ist scripts/ingredient-seed-data.mjs.
-- Neu erzeugen mit: npm run seed:stammdaten

insert into categories (id, name, sort_order) values
  ('obst-gemuese', 'Obst & Gemüse', 10),
  ('backwaren', 'Brot & Backwaren', 20),
  ('fleisch-fisch', 'Fleisch & Fisch', 30),
  ('kuehlregal', 'Kühlregal', 40),
  ('tiefkuehl', 'Tiefkühl', 50),
  ('konserven', 'Konserven & Gläser', 60),
  ('trockenware', 'Nudeln, Reis & Trockenware', 70),
  ('backen', 'Backen & Süßes', 80),
  ('gewuerze', 'Gewürze, Öle & Saucen', 90),
  ('getraenke', 'Getränke', 100),
  ('haushalt', 'Haushalt', 110),
  ('sonstiges', 'Sonstiges', 999)
on conflict (id) do update
  set name = excluded.name, sort_order = excluded.sort_order;

-- name_norm entsteht über die Funktion der Datenbank selbst, damit sie nicht von
-- der TypeScript-Seite abweichen kann.
insert into ingredients (household_id, name_norm, display_name, category_id)
select null, normalize_ingredient_name(t.name), t.name, t.category_id
from (values
  ('Zwiebel', 'obst-gemuese'),
  ('Rote Zwiebel', 'obst-gemuese'),
  ('Schalotte', 'obst-gemuese'),
  ('Frühlingszwiebel', 'obst-gemuese'),
  ('Knoblauch', 'obst-gemuese'),
  ('Karotte', 'obst-gemuese'),
  ('Möhre', 'obst-gemuese'),
  ('Kartoffel', 'obst-gemuese'),
  ('Süßkartoffel', 'obst-gemuese'),
  ('Tomate', 'obst-gemuese'),
  ('Cherrytomate', 'obst-gemuese'),
  ('Paprika', 'obst-gemuese'),
  ('Zucchini', 'obst-gemuese'),
  ('Aubergine', 'obst-gemuese'),
  ('Gurke', 'obst-gemuese'),
  ('Lauch', 'obst-gemuese'),
  ('Staudensellerie', 'obst-gemuese'),
  ('Knollensellerie', 'obst-gemuese'),
  ('Kohlrabi', 'obst-gemuese'),
  ('Weißkohl', 'obst-gemuese'),
  ('Rotkohl', 'obst-gemuese'),
  ('Spitzkohl', 'obst-gemuese'),
  ('Blumenkohl', 'obst-gemuese'),
  ('Brokkoli', 'obst-gemuese'),
  ('Rosenkohl', 'obst-gemuese'),
  ('Wirsing', 'obst-gemuese'),
  ('Spinat', 'obst-gemuese'),
  ('Mangold', 'obst-gemuese'),
  ('Feldsalat', 'obst-gemuese'),
  ('Kopfsalat', 'obst-gemuese'),
  ('Rucola', 'obst-gemuese'),
  ('Eisbergsalat', 'obst-gemuese'),
  ('Romanasalat', 'obst-gemuese'),
  ('Champignons', 'obst-gemuese'),
  ('Pilze', 'obst-gemuese'),
  ('Pfifferlinge', 'obst-gemuese'),
  ('Kürbis', 'obst-gemuese'),
  ('Pastinake', 'obst-gemuese'),
  ('Rote Bete', 'obst-gemuese'),
  ('Radieschen', 'obst-gemuese'),
  ('Rettich', 'obst-gemuese'),
  ('Fenchel', 'obst-gemuese'),
  ('Spargel', 'obst-gemuese'),
  ('Grüne Bohnen', 'obst-gemuese'),
  ('Zuckerschoten', 'obst-gemuese'),
  ('Ingwer', 'obst-gemuese'),
  ('Chilischote', 'obst-gemuese'),
  ('Petersilie', 'obst-gemuese'),
  ('Basilikum', 'obst-gemuese'),
  ('Schnittlauch', 'obst-gemuese'),
  ('Dill', 'obst-gemuese'),
  ('Koriander', 'obst-gemuese'),
  ('Minze', 'obst-gemuese'),
  ('Rosmarin', 'obst-gemuese'),
  ('Thymian', 'obst-gemuese'),
  ('Salbei', 'obst-gemuese'),
  ('Zitrone', 'obst-gemuese'),
  ('Limette', 'obst-gemuese'),
  ('Orange', 'obst-gemuese'),
  ('Apfel', 'obst-gemuese'),
  ('Banane', 'obst-gemuese'),
  ('Birne', 'obst-gemuese'),
  ('Erdbeeren', 'obst-gemuese'),
  ('Himbeeren', 'obst-gemuese'),
  ('Blaubeeren', 'obst-gemuese'),
  ('Weintrauben', 'obst-gemuese'),
  ('Pfirsich', 'obst-gemuese'),
  ('Nektarine', 'obst-gemuese'),
  ('Pflaume', 'obst-gemuese'),
  ('Kirschen', 'obst-gemuese'),
  ('Mango', 'obst-gemuese'),
  ('Ananas', 'obst-gemuese'),
  ('Avocado', 'obst-gemuese'),
  ('Wassermelone', 'obst-gemuese'),
  ('Kiwi', 'obst-gemuese'),
  ('Datteln', 'obst-gemuese'),
  ('Feige', 'obst-gemuese'),
  ('Granatapfel', 'obst-gemuese'),
  ('Brot', 'backwaren'),
  ('Vollkornbrot', 'backwaren'),
  ('Toastbrot', 'backwaren'),
  ('Baguette', 'backwaren'),
  ('Brötchen', 'backwaren'),
  ('Fladenbrot', 'backwaren'),
  ('Tortillas', 'backwaren'),
  ('Wraps', 'backwaren'),
  ('Knäckebrot', 'backwaren'),
  ('Zwieback', 'backwaren'),
  ('Croissant', 'backwaren'),
  ('Burgerbrötchen', 'backwaren'),
  ('Rindergulasch', 'fleisch-fisch'),
  ('Rinderhackfleisch', 'fleisch-fisch'),
  ('Gemischtes Hackfleisch', 'fleisch-fisch'),
  ('Rinderfilet', 'fleisch-fisch'),
  ('Rumpsteak', 'fleisch-fisch'),
  ('Rinderbraten', 'fleisch-fisch'),
  ('Schweinefilet', 'fleisch-fisch'),
  ('Schweineschnitzel', 'fleisch-fisch'),
  ('Schweinebauch', 'fleisch-fisch'),
  ('Kasseler', 'fleisch-fisch'),
  ('Hähnchenbrust', 'fleisch-fisch'),
  ('Hähnchenschenkel', 'fleisch-fisch'),
  ('Hähnchenkeule', 'fleisch-fisch'),
  ('Ganzes Hähnchen', 'fleisch-fisch'),
  ('Putenbrust', 'fleisch-fisch'),
  ('Entenbrust', 'fleisch-fisch'),
  ('Lammkeule', 'fleisch-fisch'),
  ('Lammkotelett', 'fleisch-fisch'),
  ('Speck', 'fleisch-fisch'),
  ('Speckwürfel', 'fleisch-fisch'),
  ('Bacon', 'fleisch-fisch'),
  ('Schinken', 'fleisch-fisch'),
  ('Kochschinken', 'fleisch-fisch'),
  ('Serranoschinken', 'fleisch-fisch'),
  ('Salami', 'fleisch-fisch'),
  ('Bratwurst', 'fleisch-fisch'),
  ('Chorizo', 'fleisch-fisch'),
  ('Leberwurst', 'fleisch-fisch'),
  ('Lachsfilet', 'fleisch-fisch'),
  ('Kabeljau', 'fleisch-fisch'),
  ('Seelachs', 'fleisch-fisch'),
  ('Forelle', 'fleisch-fisch'),
  ('Garnelen', 'fleisch-fisch'),
  ('Muscheln', 'fleisch-fisch'),
  ('Tintenfisch', 'fleisch-fisch'),
  ('Räucherlachs', 'fleisch-fisch'),
  ('Milch', 'kuehlregal'),
  ('Vollmilch', 'kuehlregal'),
  ('H-Milch', 'kuehlregal'),
  ('Buttermilch', 'kuehlregal'),
  ('Kefir', 'kuehlregal'),
  ('Sahne', 'kuehlregal'),
  ('Schlagsahne', 'kuehlregal'),
  ('Crème fraîche', 'kuehlregal'),
  ('Schmand', 'kuehlregal'),
  ('Saure Sahne', 'kuehlregal'),
  ('Joghurt', 'kuehlregal'),
  ('Naturjoghurt', 'kuehlregal'),
  ('Griechischer Joghurt', 'kuehlregal'),
  ('Skyr', 'kuehlregal'),
  ('Quark', 'kuehlregal'),
  ('Magerquark', 'kuehlregal'),
  ('Frischkäse', 'kuehlregal'),
  ('Butter', 'kuehlregal'),
  ('Margarine', 'kuehlregal'),
  ('Butterschmalz', 'kuehlregal'),
  ('Eier', 'kuehlregal'),
  ('Gouda', 'kuehlregal'),
  ('Emmentaler', 'kuehlregal'),
  ('Bergkäse', 'kuehlregal'),
  ('Mozzarella', 'kuehlregal'),
  ('Feta', 'kuehlregal'),
  ('Parmesan', 'kuehlregal'),
  ('Pecorino', 'kuehlregal'),
  ('Ricotta', 'kuehlregal'),
  ('Mascarpone', 'kuehlregal'),
  ('Gorgonzola', 'kuehlregal'),
  ('Camembert', 'kuehlregal'),
  ('Brie', 'kuehlregal'),
  ('Halloumi', 'kuehlregal'),
  ('Reibekäse', 'kuehlregal'),
  ('Frische Hefe', 'kuehlregal'),
  ('Tofu', 'kuehlregal'),
  ('Räuchertofu', 'kuehlregal'),
  ('Blätterteig', 'kuehlregal'),
  ('Pizzateig', 'kuehlregal'),
  ('Hafermilch', 'kuehlregal'),
  ('Sojamilch', 'kuehlregal'),
  ('Mandelmilch', 'kuehlregal'),
  ('Hummus', 'kuehlregal'),
  ('TK-Erbsen', 'tiefkuehl'),
  ('TK-Spinat', 'tiefkuehl'),
  ('TK-Blattspinat', 'tiefkuehl'),
  ('TK-Beeren', 'tiefkuehl'),
  ('TK-Himbeeren', 'tiefkuehl'),
  ('TK-Gemüse', 'tiefkuehl'),
  ('Pommes frites', 'tiefkuehl'),
  ('Fischstäbchen', 'tiefkuehl'),
  ('Vanilleeis', 'tiefkuehl'),
  ('Blätterteig (TK)', 'tiefkuehl'),
  ('Tomatenmark', 'konserven'),
  ('Passierte Tomaten', 'konserven'),
  ('Gehackte Tomaten', 'konserven'),
  ('Dosentomaten', 'konserven'),
  ('Kokosmilch', 'konserven'),
  ('Kidneybohnen', 'konserven'),
  ('Kichererbsen (Dose)', 'konserven'),
  ('Weiße Bohnen', 'konserven'),
  ('Mais', 'konserven'),
  ('Oliven', 'konserven'),
  ('Kapern', 'konserven'),
  ('Gewürzgurken', 'konserven'),
  ('Sauerkraut', 'konserven'),
  ('Rotkohl (Glas)', 'konserven'),
  ('Thunfisch (Dose)', 'konserven'),
  ('Sardellen', 'konserven'),
  ('Erdnussbutter', 'konserven'),
  ('Marmelade', 'konserven'),
  ('Honig', 'konserven'),
  ('Apfelmus', 'konserven'),
  ('Pesto', 'konserven'),
  ('Ajvar', 'konserven'),
  ('Gemüsebrühe', 'konserven'),
  ('Rinderbrühe', 'konserven'),
  ('Hühnerbrühe', 'konserven'),
  ('Brühe', 'konserven'),
  ('Fond', 'konserven'),
  ('Tomatensauce', 'konserven'),
  ('Sardinen', 'konserven'),
  ('Nudeln', 'trockenware'),
  ('Spaghetti', 'trockenware'),
  ('Penne', 'trockenware'),
  ('Fusilli', 'trockenware'),
  ('Tagliatelle', 'trockenware'),
  ('Lasagneplatten', 'trockenware'),
  ('Spätzle', 'trockenware'),
  ('Reis', 'trockenware'),
  ('Basmatireis', 'trockenware'),
  ('Risottoreis', 'trockenware'),
  ('Milchreis', 'trockenware'),
  ('Couscous', 'trockenware'),
  ('Bulgur', 'trockenware'),
  ('Quinoa', 'trockenware'),
  ('Polenta', 'trockenware'),
  ('Haferflocken', 'trockenware'),
  ('Müsli', 'trockenware'),
  ('Cornflakes', 'trockenware'),
  ('Linsen', 'trockenware'),
  ('Rote Linsen', 'trockenware'),
  ('Belugalinsen', 'trockenware'),
  ('Semmelbrösel', 'trockenware'),
  ('Paniermehl', 'trockenware'),
  ('Mehl', 'trockenware'),
  ('Weizenmehl', 'trockenware'),
  ('Dinkelmehl', 'trockenware'),
  ('Vollkornmehl', 'trockenware'),
  ('Grieß', 'trockenware'),
  ('Speisestärke', 'trockenware'),
  ('Kartoffelstärke', 'trockenware'),
  ('Saucenbinder', 'trockenware'),
  ('Walnüsse', 'trockenware'),
  ('Haselnüsse', 'trockenware'),
  ('Mandeln', 'trockenware'),
  ('Gemahlene Mandeln', 'trockenware'),
  ('Cashewkerne', 'trockenware'),
  ('Pinienkerne', 'trockenware'),
  ('Sonnenblumenkerne', 'trockenware'),
  ('Kürbiskerne', 'trockenware'),
  ('Sesam', 'trockenware'),
  ('Leinsamen', 'trockenware'),
  ('Chiasamen', 'trockenware'),
  ('Rosinen', 'trockenware'),
  ('Trockenhefe', 'trockenware'),
  ('Backpulver', 'trockenware'),
  ('Natron', 'trockenware'),
  ('Kokosraspeln', 'trockenware'),
  ('Getrocknete Tomaten', 'trockenware'),
  ('Zucker', 'backen'),
  ('Puderzucker', 'backen'),
  ('Brauner Zucker', 'backen'),
  ('Vanillezucker', 'backen'),
  ('Vanilleschote', 'backen'),
  ('Vanilleextrakt', 'backen'),
  ('Zartbitterschokolade', 'backen'),
  ('Vollmilchschokolade', 'backen'),
  ('Kuvertüre', 'backen'),
  ('Schokoladenraspel', 'backen'),
  ('Kakaopulver', 'backen'),
  ('Marzipan', 'backen'),
  ('Gelatine', 'backen'),
  ('Agar-Agar', 'backen'),
  ('Ahornsirup', 'backen'),
  ('Agavendicksaft', 'backen'),
  ('Zuckerrübensirup', 'backen'),
  ('Rohrzucker', 'backen'),
  ('Salz', 'gewuerze'),
  ('Meersalz', 'gewuerze'),
  ('Pfeffer', 'gewuerze'),
  ('Paprikapulver', 'gewuerze'),
  ('Currypulver', 'gewuerze'),
  ('Kurkuma', 'gewuerze'),
  ('Kreuzkümmel', 'gewuerze'),
  ('Kümmel', 'gewuerze'),
  ('Koriandersamen', 'gewuerze'),
  ('Muskatnuss', 'gewuerze'),
  ('Zimt', 'gewuerze'),
  ('Nelken', 'gewuerze'),
  ('Kardamom', 'gewuerze'),
  ('Lorbeerblatt', 'gewuerze'),
  ('Wacholderbeeren', 'gewuerze'),
  ('Senfkörner', 'gewuerze'),
  ('Chiliflocken', 'gewuerze'),
  ('Cayennepfeffer', 'gewuerze'),
  ('Getrockneter Oregano', 'gewuerze'),
  ('Getrockneter Thymian', 'gewuerze'),
  ('Getrockneter Rosmarin', 'gewuerze'),
  ('Majoran', 'gewuerze'),
  ('Italienische Kräuter', 'gewuerze'),
  ('Kräuter der Provence', 'gewuerze'),
  ('Currypaste', 'gewuerze'),
  ('Olivenöl', 'gewuerze'),
  ('Rapsöl', 'gewuerze'),
  ('Sonnenblumenöl', 'gewuerze'),
  ('Sesamöl', 'gewuerze'),
  ('Kokosöl', 'gewuerze'),
  ('Essig', 'gewuerze'),
  ('Balsamico', 'gewuerze'),
  ('Weißweinessig', 'gewuerze'),
  ('Apfelessig', 'gewuerze'),
  ('Senf', 'gewuerze'),
  ('Dijonsenf', 'gewuerze'),
  ('Ketchup', 'gewuerze'),
  ('Mayonnaise', 'gewuerze'),
  ('Sojasauce', 'gewuerze'),
  ('Fischsauce', 'gewuerze'),
  ('Worcestershiresauce', 'gewuerze'),
  ('Tabasco', 'gewuerze'),
  ('Sriracha', 'gewuerze'),
  ('Harissa', 'gewuerze'),
  ('Tahini', 'gewuerze'),
  ('Zitronensaft', 'gewuerze'),
  ('Gemahlener Kreuzkümmel', 'gewuerze'),
  ('Mineralwasser', 'getraenke'),
  ('Rotwein', 'getraenke'),
  ('Weißwein', 'getraenke'),
  ('Sekt', 'getraenke'),
  ('Bier', 'getraenke'),
  ('Apfelsaft', 'getraenke'),
  ('Orangensaft', 'getraenke'),
  ('Tomatensaft', 'getraenke'),
  ('Kaffee', 'getraenke'),
  ('Espresso', 'getraenke'),
  ('Tee', 'getraenke'),
  ('Cola', 'getraenke'),
  ('Tonic Water', 'getraenke'),
  ('Wodka', 'getraenke'),
  ('Rum', 'getraenke'),
  ('Weinbrand', 'getraenke'),
  ('Portwein', 'getraenke'),
  ('Sherry', 'getraenke'),
  ('Mirin', 'getraenke'),
  ('Backpapier', 'haushalt'),
  ('Alufolie', 'haushalt'),
  ('Frischhaltefolie', 'haushalt'),
  ('Küchenrolle', 'haushalt'),
  ('Gefrierbeutel', 'haushalt'),
  ('Zahnstocher', 'haushalt'),
  ('Küchengarn', 'haushalt'),
  ('Müllbeutel', 'haushalt'),
  ('Spülmittel', 'haushalt')
) as t (name, category_id)
on conflict (name_norm) where household_id is null do update
  set category_id = excluded.category_id,
      display_name = excluded.display_name;

commit;
