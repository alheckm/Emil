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
