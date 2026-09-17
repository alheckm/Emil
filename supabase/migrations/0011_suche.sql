-- Rezeptsuche über Titel und Zutaten.
--
-- Als Datenbankfunktion und nicht als Filter im Client, weil die Suche über
-- zwei Tabellen geht: „Zwiebel" soll auch Rezepte finden, deren Titel das Wort
-- nicht enthält. Über PostgREST wäre das ein umständlicher Mehrfachabruf; hier
-- ist es eine Abfrage, die die vorhandenen Trigram-Indizes nutzt.
--
-- SECURITY INVOKER: die Funktion sieht genau das, was der Aufrufer sehen darf.
-- Die RLS-Policies auf recipes und ingredients greifen unverändert.

create or replace function search_recipes(
  p_household_id uuid,
  p_query text default null,
  p_tag text default null
)
returns setof recipes
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select r.*
  from recipes r
  where r.household_id = p_household_id
    and (p_tag is null or p_tag = '' or r.tags @> array[p_tag])
    and (
      p_query is null or btrim(p_query) = ''
      or r.title ilike '%' || btrim(p_query) || '%'
      or exists (
        select 1
        from recipe_ingredients ri
        left join ingredients i on i.id = ri.ingredient_id
        where ri.recipe_id = r.id
          and (
            i.display_name ilike '%' || btrim(p_query) || '%'
            or ri.raw_text ilike '%' || btrim(p_query) || '%'
          )
      )
    )
  order by r.created_at desc;
$$;

/**
 * Alle vergebenen Schlagwörter eines Haushalts, mit Anzahl.
 *
 * Für die Filterleiste: nur Schlagwörter anzeigen, die es auch gibt — eine
 * leere Auswahl zum Antippen wäre ärgerlicher als keine.
 */
create or replace function household_tags(p_household_id uuid)
returns table (tag text, anzahl bigint)
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select t.tag, count(*) as anzahl
  from recipes r
  cross join lateral unnest(r.tags) as t(tag)
  where r.household_id = p_household_id
  group by t.tag
  order by count(*) desc, t.tag;
$$;
