-- Aktiver Haushalt: welchen von mehreren Haushalten Home, Liste und Aufgaben
-- gerade zeigen.
--
-- Rezepte, Einkaufsliste und Aufgaben hängen am Haushalt, nicht an der
-- Person (household_id ist Pflicht auf allen dreien). Wer in mehreren
-- Haushalten Mitglied ist — z. B. eigene Wohnung und Haushalt der Eltern —
-- soll deshalb zwischen ihnen wechseln können, ohne einen davon zu
-- verlassen: Verlassen löscht sonst irgendwann den ganzen Haushalt samt
-- Rezepten (0023_haushalt_verlassen.sql), wenn niemand mehr drin ist.
--
-- Ohne gesetzte Spalte bleibt der bisherige, stillschweigende Rückfall in
-- Kraft: der zuletzt beigetretene Haushalt (siehe loadHousehold() in
-- household.ts). Für alle mit nur einem Haushalt ändert sich also nichts.

alter table profiles
  add column active_household_id uuid references households (id) on delete set null;

-- Ersetzt profiles_update und profiles_insert aus 0024_profil.sql: dieselbe
-- Regel (nur das eigene Profil), plus die neue Spalte darf nur auf einen
-- Haushalt zeigen, in dem man selbst Mitglied ist — sonst könnte man sich per
-- active_household_id Zugriff auf fremde Rezepte erschleichen. Beide Policies,
-- weil setActiveHousehold() dasselbe Upsert nutzt wie setDisplayName() und
-- uploadAvatar() — noch ohne eigene profiles-Zeile trifft er die
-- INSERT-Policy, nicht die UPDATE-Policy.
drop policy profiles_update on profiles;
drop policy profiles_insert on profiles;

create policy profiles_update on profiles
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and (
      active_household_id is null
      or active_household_id in (select current_household_ids())
    )
  );

create policy profiles_insert on profiles
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and (
      active_household_id is null
      or active_household_id in (select current_household_ids())
    )
  );
