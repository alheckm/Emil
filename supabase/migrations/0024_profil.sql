-- Klarname und Profilfoto.
--
-- Bisher gab es dafür absichtlich keine eigene Tabelle (siehe der alte
-- Kommentar in `einstellungen/haushalt/page.tsx`): `auth.users` ist für die
-- App nicht lesbar, und eine zweite Kopie der E-Mail-Adresse wäre mehr
-- Datenhaltung als Nutzen gewesen. Jetzt kommt echter Inhalt dazu — Name und
-- Foto —, der diese eigene Tabelle rechtfertigt.

create table profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_path text,
  updated_at timestamptz not null default now()
);

create trigger profiles_touch_updated_at
  before update on profiles
  for each row execute function touch_updated_at();

/**
 * Alle Nutzer-IDs aus allen Haushalten des angemeldeten Nutzers, ihn selbst
 * eingeschlossen.
 *
 * Anders als `current_household_ids()` geht es hier nicht um Haushalte,
 * sondern um Personen: Name und Foto sollen in jedem gemeinsamen Haushalt
 * sichtbar sein, nicht an einen einzelnen Pfad-Präfix gebunden (wie bei
 * `recipe-images`). SECURITY DEFINER aus demselben Grund wie dort — sonst
 * bricht die rekursive Prüfung auf `household_members` ab.
 */
create or replace function current_housemate_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select distinct user_id from household_members
  where household_id in (select current_household_ids());
$$;

revoke all on function current_housemate_ids() from public, anon;
grant execute on function current_housemate_ids() to authenticated;

alter table profiles enable row level security;

create policy profiles_select on profiles
  for select to authenticated
  using (user_id in (select current_housemate_ids()));

create policy profiles_insert on profiles
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy profiles_update on profiles
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- ------------------------------------------------------------------ Storage --

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', false)
on conflict (id) do nothing;

-- Der erste Pfadabschnitt ist die user_id: {user_id}/{datei}. Sichtbar für
-- alle Mitbewohner:innen (wie die Profilzeile selbst), änderbar nur vom
-- Konto, dem die Datei gehört.
create policy avatars_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'avatars'
    and ((storage.foldername(name))[1])::uuid in (select current_housemate_ids())
  );

create policy avatars_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and ((storage.foldername(name))[1])::uuid = (select auth.uid())
  );

create policy avatars_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'avatars'
    and ((storage.foldername(name))[1])::uuid = (select auth.uid())
  );
