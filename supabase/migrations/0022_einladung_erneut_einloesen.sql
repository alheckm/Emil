-- redeem_invite() erneut aufrufbar machen für den, der schon dran war.
--
-- Der Einladungslink (/beitreten/[code]) löst den Code automatisch ein,
-- sobald die Seite mit einer Sitzung steht — per useEffect im Browser. Ein
-- erneuter Render derselben Seite (Entwicklungsmodus, ein Refresh) ruft die
-- Funktion dann ein zweites Mal mit demselben Code auf. Bisher endete das in
-- "schon benutzt", obwohl der Beitritt längst geklappt hat. Nur ein fremder
-- Zweitversuch soll weiter scheitern.
create or replace function redeem_invite(p_code text)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_invite invites;
begin
  if auth.uid() is null then
    raise exception 'Nicht angemeldet';
  end if;

  select * into v_invite from invites
  where code = upper(btrim(p_code))
  for update;

  if v_invite is null then
    raise exception 'Diesen Einladungscode gibt es nicht';
  end if;

  if v_invite.used_by is not null then
    if v_invite.used_by = auth.uid() then
      return v_invite.household_id;
    end if;
    raise exception 'Dieser Einladungscode wurde schon benutzt';
  end if;

  if v_invite.expires_at < now() then
    raise exception 'Dieser Einladungscode ist abgelaufen';
  end if;

  insert into household_members (household_id, user_id, role)
  values (v_invite.household_id, auth.uid(), 'member')
  on conflict (household_id, user_id) do nothing;

  update invites set used_by = auth.uid(), used_at = now()
  where code = v_invite.code;

  return v_invite.household_id;
end;
$$;
