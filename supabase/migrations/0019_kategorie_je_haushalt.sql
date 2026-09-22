-- Abteilung auch für globale Zutaten änderbar — nicht nur für eigene.
--
-- Eine globale Zutat aus dem Seed (households_id null) gehört allen
-- Haushalten gleichzeitig; ihre `category_id` direkt umzuhängen (wie es
-- `set_ingredient_category` für eigene Zutaten tut) würde die Abteilung für
-- jeden anderen Haushalt mit umstellen — das verhindert die RLS-Policy aus
-- 0006 zu Recht. Diese Tabelle legt die Wahl stattdessen daneben: eine
-- Abteilung pro Haushalt und Zutat, die beim Lesen die globale Abteilung
-- überlagert (siehe `listEntries` in shoppingList.ts), ohne die geteilte
-- Zutat selbst anzufassen. Für eigene Zutaten bleibt der bisherige, direkte
-- Weg unverändert — dort gibt es niemanden, dessen Abteilung mitrutschen
-- könnte.

create table household_ingredient_categories (
  household_id uuid not null references households (id) on delete cascade,
  ingredient_id uuid not null references ingredients (id) on delete cascade,
  category_id text not null references categories (id) on delete cascade,
  primary key (household_id, ingredient_id)
);

alter table household_ingredient_categories enable row level security;

create policy household_ingredient_categories_all on household_ingredient_categories
  for all to authenticated
  using (household_id in (select current_household_ids()))
  with check (household_id in (select current_household_ids()));
