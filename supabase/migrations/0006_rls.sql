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
