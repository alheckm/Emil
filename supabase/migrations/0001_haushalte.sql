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
