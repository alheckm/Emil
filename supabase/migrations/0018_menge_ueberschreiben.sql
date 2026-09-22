-- Menge einer Zeile lässt sich jetzt direkt anpassen — unabhängig davon, ob
-- sie aus einem Rezept, von Hand oder aus beidem kommt.
--
-- `amount_override` ersetzt `total_amount`, sobald gesetzt: Rezept- und
-- Handanteile bleiben unverändert liegen (ein Rezept, das später erneut
-- aufgelegt wird, rechnet weiterhin aus seinen eigenen Zutaten), aber die
-- Liste zeigt für diese Zeile die von Hand eingestellte Zahl, bis jemand sie
-- wieder ändert. Kein eigener Weg, die Anpassung wieder aufzuheben — das
-- deckt der Stepper in der Detailleiste (ListView.tsx) selbst schon ab.

alter table shopping_list_entries
  add column amount_override numeric(12, 4);

-- Die View zieht ihre Spalten per e.* — das wird beim Anlegen einmal
-- ausgeschrieben und kennt amount_override sonst nie. `create or replace`
-- kann Spalten nur hinten anhängen, deshalb neu anlegen (wie schon in 0009).
drop view shopping_list_entry_totals;

create view shopping_list_entry_totals
with (security_invoker = true) as
select
  e.*,
  src.source_count,
  src.quantified_count,
  case
    when e.amount_override is not null then e.amount_override
    when e.manual_amount is null and coalesce(src.quantified_count, 0) = 0
      then null
    else coalesce(e.manual_amount, 0) + coalesce(src.sum_amount, 0)
  end as total_amount,
  -- Mindestens eine Quelle ohne Menge („Salz und Pfeffer" neben „1 TL Salz").
  coalesce(src.source_count, 0) > coalesce(src.quantified_count, 0)
    as has_unquantified
from shopping_list_entries e
left join lateral (
  select
    count(*) as source_count,
    count(s.amount_base) as quantified_count,
    sum(s.amount_base) as sum_amount
  from shopping_list_sources s
  where s.entry_id = e.id
) src on true;

/**
 * Menge einer Zeile von Hand festlegen — der Mengen-Stepper in der
 * Detailleiste. Läuft wie set_entry_checked ohne Zeitstempel-Vergleich:
 * anders als das Häkchen ist die Menge kein Feld, das zwei Handys im
 * Supermarkt im selben Moment gegenläufig setzen — letzter Schreiber gewinnt
 * reicht hier.
 */
create or replace function set_entry_amount(
  p_entry_id uuid,
  p_amount numeric
)
returns shopping_list_entries
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_entry shopping_list_entries;
begin
  if p_amount is not null and p_amount < 0 then
    raise exception 'Die Menge darf nicht negativ sein';
  end if;

  update shopping_list_entries
  set amount_override = p_amount,
      updated_at = now()
  where id = p_entry_id
  returning * into v_entry;

  if v_entry is null then
    raise exception 'Diese Zeile gibt es nicht mehr';
  end if;

  return v_entry;
end;
$$;

-- Wie in 0007: `execute` steht neuen Funktionen sonst auch dem
-- nicht angemeldeten `anon` offen.
revoke all on function set_entry_amount(uuid, numeric) from public, anon;
grant execute on function set_entry_amount(uuid, numeric) to authenticated;
