-- Grundlage für die automatische Rezept-Pflege (siehe docs/plan-rezept-pflege.md):
-- ein wöchentlicher, lokal laufender Claude-Lauf bestimmt Tags, Saison,
-- Nährwerte und Mengenangaben in der Anleitung. Damit dabei nichts
-- unwiderruflich verloren geht, hält recipe_revisions den Stand vor jeder
-- automatischen Änderung fest.

alter table recipes
  add column nutrition jsonb,
  add constraint recipes_nutrition_check
    check (nutrition is null or jsonb_typeof(nutrition) = 'object');

comment on column recipes.nutrition is
  'Geschätzte Nährwerte je Portion (kcal, protein_g, carbs_g, fat_g) — eine '
  'Schätzung durch die automatische Pflege, keine Laboranalyse. null = noch '
  'nicht geschätzt.';

-- Zeitpunkt der letzten automatischen Pflege. "Offen" (noch zu bearbeiten)
-- heißt: nie gepflegt, oder seither von Hand geändert — touch_updated_at()
-- hebt updated_at bei jeder Bearbeitung über pflege_stand und macht das
-- Rezept damit von selbst wieder sichtbar für den nächsten Lauf.
alter table recipes
  add column pflege_stand timestamptz;

create table recipe_revisions (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references recipes (id) on delete cascade,
  household_id uuid not null references households (id) on delete cascade,
  -- Rezeptzeile + alle Zutatenzeilen, wie sie unmittelbar vor der Änderung
  -- in der Datenbank standen — die einzige Stelle, die einen automatischen
  -- Eingriff wieder rückgängig machen kann.
  vorher jsonb not null,
  felder text[] not null default '{}',
  lauf_id text,
  quelle text not null default 'claude-pflege',
  created_at timestamptz not null default now()
);

create index recipe_revisions_recipe_idx
  on recipe_revisions (recipe_id, created_at desc);

alter table recipe_revisions enable row level security;

create policy recipe_revisions_select on recipe_revisions
  for select to authenticated
  using (household_id in (select current_household_ids()));

-- Bewusst keine insert/update/delete-Policy: Revisionen entstehen nur über
-- scripts/rezept-pflege/pflege.mjs, das mit dem Secret Key schreibt und RLS
-- damit ohnehin umgeht. Ein Haushaltsmitglied kann seinen eigenen Verlauf
-- lesen, aber nicht manipulieren.
