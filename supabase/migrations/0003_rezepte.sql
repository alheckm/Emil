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
