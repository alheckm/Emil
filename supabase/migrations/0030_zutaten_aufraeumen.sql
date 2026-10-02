-- Zutaten-Aufräumlauf vom 2026-10-02 (freigegeben).
--
-- A. Abteilung für eigene Zutaten, die in „Sonstiges" gelandet waren.
-- B. Drei eigene Dubletten gehen in die Stamm-Zutat auf: Rezeptzeilen und
--    Listeneinträge ziehen um; ein Eintrag, der dort schon mit gleicher
--    Einheit steht, bleibt unberührt.

update ingredients i
set category_id = v.kat
from (values
  ('berglinsen', 'trockenware'),
  ('getrocknete aprikosen', 'trockenware'),
  ('goji beeren', 'trockenware'),
  ('brötchen, brezeln, croissant', 'backwaren'),
  ('kuchen', 'backwaren'),
  ('gulasch', 'fleisch-fisch'),
  ('lachs', 'fleisch-fisch'),
  ('käse', 'kuehlregal'),
  ('tofuwiener', 'kuehlregal'),
  ('kalbsfond', 'konserven'),
  ('stückige tomaten', 'konserven'),
  ('saft', 'getraenke'),
  ('wasser', 'getraenke'),
  ('salz und pfeffer', 'gewuerze'),
  ('schwarzer pfeffer', 'gewuerze'),
  ('schweineschmalz', 'gewuerze'),
  ('holzspieße', 'haushalt'),
  ('pizza', 'tiefkuehl')
) as v(name_norm, kat)
where i.household_id is not null
  and i.category_id = 'sonstiges'
  and i.name_norm = v.name_norm;

create temp table zutat_dubletten on commit drop as
select o.id as eigene_id, s.id as stamm_id
from (values
  ('300 g lauch', 'lauch'),
  ('wacholderbeere', 'wacholderbeeren'),
  ('salat', 'salat')
) as v(eigen, stamm)
join ingredients o on o.household_id is not null and o.name_norm = v.eigen
join ingredients s on s.household_id is null and s.name_norm = v.stamm;

update recipe_ingredients r
set ingredient_id = d.stamm_id
from zutat_dubletten d
where r.ingredient_id = d.eigene_id;

update shopping_list_entries e
set ingredient_id = d.stamm_id
from zutat_dubletten d
where e.ingredient_id = d.eigene_id
  and not exists (
    select 1 from shopping_list_entries x
    where x.list_id = e.list_id and x.ingredient_id = d.stamm_id
      and x.merge_unit = e.merge_unit
  );

update ingredients s
set image_slug = o.image_slug
from zutat_dubletten d
join ingredients o on o.id = d.eigene_id
where s.id = d.stamm_id and s.image_slug is null and o.image_slug is not null;

delete from ingredients where id in (select eigene_id from zutat_dubletten);
