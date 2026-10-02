-- Schlagwörter eines Rezepts sind eine feste Liste: vegan, vegetarisch,
-- proteinreich, snack (src/lib/core/recipeTags.ts). „Saisonal" und „≤ 30 Min"
-- sind keine Schlagwörter, sondern folgen aus season_months bzw.
-- total_time_min.

-- Bestehendes angleichen: klein schreiben, Unbekanntes („süßes") entfernen,
-- „vegan" schließt „vegetarisch" ein.
update recipes r
set tags = coalesce((
  select array_agg(t order by array_position(
    array['vegan', 'vegetarisch', 'proteinreich', 'snack'], t))
  from (
    select distinct lower(btrim(x)) as t from unnest(r.tags) x
    union
    select 'vegetarisch' where 'vegan' = any (select lower(btrim(y)) from unnest(r.tags) y)
  ) s
  where t in ('vegan', 'vegetarisch', 'proteinreich', 'snack')
), '{}'::text[])
where r.tags <> '{}'::text[];

alter table recipes
  add constraint recipes_tags_check
    check (tags <@ array['vegan', 'vegetarisch', 'proteinreich', 'snack']::text[]);
