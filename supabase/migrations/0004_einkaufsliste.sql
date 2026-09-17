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
