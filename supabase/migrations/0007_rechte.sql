-- Ausführungsrechte und search_path der eigenen Funktionen.
--
-- Zwei Dinge, die der Supabase-Linter zu Recht anmahnt und die man nur einmal
-- richtig macht:
--
-- 1. `search_path` festnageln. Ohne feste Einstellung entscheidet die Sitzung
--    des Aufrufers, welches `public` gemeint ist. Bei `security definer` ist
--    das der klassische Weg, fremden Code mit Besitzerrechten auszuführen;
--    bei `security invoker` immerhin eine Quelle stiller Fehlgriffe.
--    `pg_temp` steht bewusst hinten: sonst könnte eine temporäre Tabelle eine
--    echte überdecken.
--
-- 2. `anon` die Rechte nehmen. Die RPC-Funktionen sind über
--    `/rest/v1/rpc/<name>` von außen erreichbar, und Postgres gibt neuen
--    Funktionen standardmäßig `execute` an `public` — also auch an den
--    nicht angemeldeten `anon`-Rollennutzer. Innen fielen die Aufrufe zwar
--    über `auth.uid() is null` hin, aber eine Grenze, die erst im
--    Funktionsrumpf greift, ist keine Grenze.
--
--    `revoke from public` allein genügt hier nicht: Supabase vergibt per
--    `alter default privileges` zusätzlich ein ausdrückliches `execute` an
--    `anon`, `authenticated` und `service_role`. Ein ausdrückliches Recht
--    überlebt den Entzug an `public` — `anon` muss einzeln genannt werden.
--    Aus demselben Grund reichte 0001 bei `current_household_ids` nicht aus;
--    die Funktion steht darum unten noch einmal.
--
-- `touch_updated_at` (Trigger) und `normalize_ingredient_name` (Index-Ausdruck)
-- werden nie über die API gerufen und behalten ihre Rechte; sie bekommen nur
-- den festen `search_path`.

alter function touch_updated_at()             set search_path = public, pg_temp;
alter function normalize_ingredient_name(text) set search_path = public, pg_temp;
alter function active_list_id(uuid)           set search_path = public, pg_temp;
alter function add_recipe_to_list(uuid, uuid, int, jsonb)
                                              set search_path = public, pg_temp;
alter function remove_recipe_from_list(uuid, uuid)
                                              set search_path = public, pg_temp;
alter function set_entry_checked(uuid, boolean, timestamptz)
                                              set search_path = public, pg_temp;

revoke all on function create_household(text) from public, anon;
grant execute on function create_household(text) to authenticated;

revoke all on function create_invite(uuid) from public, anon;
grant execute on function create_invite(uuid) to authenticated;

revoke all on function redeem_invite(text) from public, anon;
grant execute on function redeem_invite(text) to authenticated;

revoke all on function delete_own_household_data() from public, anon;
grant execute on function delete_own_household_data() to authenticated;

revoke all on function current_household_ids() from public, anon;
grant execute on function current_household_ids() to authenticated;

revoke all on function active_list_id(uuid) from public, anon;
grant execute on function active_list_id(uuid) to authenticated;

revoke all on function add_recipe_to_list(uuid, uuid, int, jsonb) from public, anon;
grant execute on function add_recipe_to_list(uuid, uuid, int, jsonb) to authenticated;

revoke all on function remove_recipe_from_list(uuid, uuid) from public, anon;
grant execute on function remove_recipe_from_list(uuid, uuid) to authenticated;

revoke all on function set_entry_checked(uuid, boolean, timestamptz) from public, anon;
grant execute on function set_entry_checked(uuid, boolean, timestamptz) to authenticated;
