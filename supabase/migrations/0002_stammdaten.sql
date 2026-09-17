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
