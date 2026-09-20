-- `pflege_stand` muss exakt mit `updated_at` übereinstimmen, sonst bleibt
-- „offen" (pflege_stand < updated_at, siehe pflege.mjs) für immer wahr: ein
-- clientseitig erzeugter Zeitstempel liegt praktisch immer vor dem, den
-- `touch_updated_at()` per `now()` im selben Moment in der Datenbank setzt.
-- `now()` ist innerhalb einer Transaktion konstant — darum setzt diese
-- Funktion NUR `pflege_stand = now()`, im selben Statement, in dem der
-- Trigger `updated_at` auf denselben Wert setzt.
create or replace function touch_recipe_pflege(p_id uuid)
returns void
language sql
security invoker
set search_path = public, pg_temp
as $$
  update recipes set pflege_stand = now() where id = p_id;
$$;

-- Nur für scripts/rezept-pflege/pflege.mjs (service_role) gedacht — kein Grund,
-- warum ein Haushaltsmitglied das über die REST-API aufrufen sollte.
revoke all on function touch_recipe_pflege(uuid) from public, anon, authenticated;
