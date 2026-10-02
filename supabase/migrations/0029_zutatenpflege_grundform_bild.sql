-- Zutatenpflege: Grundformschlüssel für Ein-/Mehrzahl und ein Bild-Slug an der
-- Zutat selbst (statt einer Namenstabelle im Code).
--
-- 1. `singular_key`: macht „Äpfel" und „Apfel", „Tomaten" und „Tomate" zu
--    demselben Schlüssel. Umlaute werden aufgelöst, danach fällt ein
--    angehängtes „n" und dann ein „e" weg. Unter fünf Buchstaben bleibt alles
--    unverändert („Tee", „Ei"). Fehltreffer lassen sich mit einem Alias
--    überstimmen; die Ähnlichkeitssuche bleibt als letzte Stufe bestehen.

create or replace function singular_key(p_name text)
returns text
language sql
immutable
set search_path = public, pg_temp
as $$
  select case
    when length(f.t) >= 5
      then regexp_replace(regexp_replace(f.t, 'n$', ''), 'e$', '')
    else f.t
  end
  from (
    select translate(normalize_ingredient_name(p_name), 'äöüß', 'aous') as t
  ) f;
$$;

-- 2. `resolve_ingredient`: Grundformtreffer vor der Ähnlichkeitssuche.

create or replace function resolve_ingredient(p_household_id uuid, p_name text)
returns uuid
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_norm text := normalize_ingredient_name(p_name);
  v_tk_pattern constant text := '(^|[^[:alpha:]])tk($|[^[:alpha:]])';
  v_wants_tk boolean;
  v_key text;
  v_id uuid;
begin
  if v_norm = '' then
    raise exception 'Die Zutat braucht einen Namen';
  end if;

  v_wants_tk := v_norm ~ v_tk_pattern or v_norm like 'tiefk%';

  select id into v_id from ingredients
  where name_norm = v_norm
    and (household_id = p_household_id or household_id is null)
  order by (household_id is not null) desc
  limit 1;
  if v_id is not null then return v_id; end if;

  select a.ingredient_id into v_id
  from ingredient_aliases a
  join ingredients i on i.id = a.ingredient_id
  where a.alias_norm = v_norm
    and (i.household_id = p_household_id or i.household_id is null)
  order by (a.household_id is not null) desc
  limit 1;
  if v_id is not null then return v_id; end if;

  -- Mehrzahl und Einzahl („Äpfel"/„Apfel", „Tomaten"/„Tomate") haben denselben
  -- Grundformschlüssel; der Treffer zählt wie ein Alias.
  v_key := singular_key(v_norm);
  select id into v_id from ingredients
  where (household_id = p_household_id or household_id is null)
    and singular_key(name_norm) = v_key
    and (v_wants_tk or name_norm !~ v_tk_pattern)
  order by (household_id is not null) desc
  limit 1;
  if v_id is not null then return v_id; end if;

  select a.ingredient_id into v_id
  from ingredient_aliases a
  join ingredients i on i.id = a.ingredient_id
  where singular_key(a.alias_norm) = v_key
    and (i.household_id = p_household_id or i.household_id is null)
    and (v_wants_tk or i.name_norm !~ v_tk_pattern)
  order by (a.household_id is not null) desc
  limit 1;
  if v_id is not null then return v_id; end if;

  select id into v_id from ingredients
  where (household_id = p_household_id or household_id is null)
    and similarity(name_norm, v_norm) >= 0.62
    and (v_wants_tk or name_norm !~ v_tk_pattern)
  order by similarity(name_norm, v_norm) desc, (household_id is not null) desc
  limit 1;
  if v_id is not null then return v_id; end if;

  insert into ingredients (household_id, name_norm, display_name, category_id)
  values (
    p_household_id, v_norm,
    upper(left(btrim(p_name), 1)) || substr(btrim(p_name), 2),
    'sonstiges'
  )
  on conflict (household_id, name_norm) where household_id is not null
    do nothing
  returning id into v_id;

  if v_id is null then
    select id into v_id from ingredients
    where household_id = p_household_id and name_norm = v_norm;
  end if;

  return v_id;
end;
$$;

-- 3. Bild an der Zutat. `image_slug` verweist auf
-- public/zutaten-marktregal/<slug>-bold.webp. Gefüllt aus der bisherigen
-- Namenstabelle (über die Grundform, also trifft „Wacholderbeere" auch
-- „Wacholderbeeren", unabhängig von Groß-/Kleinschreibung); danach pflegt
-- scripts/ingredient-images/publish-map.mjs die Spalte.

alter table ingredients add column if not exists image_slug text;

update ingredients i
set image_slug = v.slug
from (values
  ('250 g Quark', 'quark'),
  ('300 g möhren', 'moehre'),
  ('800 g Buschbohnen', 'gruene-bohnen'),
  ('Aubergine', 'aubergine'),
  ('Avocado', 'avocado'),
  ('Banane', 'banane'),
  ('Beeren', 'beeren'),
  ('Berglinsen', 'berglinsen'),
  ('Blätterteig', 'blaetterteig'),
  ('Blaubeeren', 'blaubeeren'),
  ('Bohnen', 'bohnen'),
  ('Brat- oder mildes Olivenöl', 'bratoel'),
  ('Bratöl', 'bratoel'),
  ('Brokkoli', 'brokkoli'),
  ('Brot', 'brot'),
  ('Buschbohnen', 'gruene-bohnen'),
  ('Butter', 'butter'),
  ('Couscous', 'couscous'),
  ('Currypulver', 'currypulver'),
  ('Datteln', 'datteln'),
  ('Dinkel-Mandel-Drink', 'mandelmilch'),
  ('Eier', 'eier'),
  ('Erdbeeren', 'erdbeeren'),
  ('Frischkäse', 'frischkaese'),
  ('Frühlingszwiebel', 'fruehlingszwiebel'),
  ('Gehackte Tomaten', 'gehackte-tomaten'),
  ('Gemahlener Kreuzkümmel', 'gemahlener-kreuzkuemmel'),
  ('Gemüsebrühe', 'gemuesebruehe'),
  ('Gemüsebrühepulver', 'gemuesebruehe'),
  ('getrocknete Aprikosen', 'getrocknete-aprikosen'),
  ('Gewürznelke', 'gewuerznelke'),
  ('Glatte Petersilie', 'petersilie'),
  ('Goji Beeren', 'goji-beeren'),
  ('Grüne Bohnen', 'gruene-bohnen'),
  ('Gulasch', 'gulasch'),
  ('Gurke', 'gurke'),
  ('Hafermilch', 'hafermilch'),
  ('Holzspieße', 'holzspiesse'),
  ('Ingwer', 'ingwer'),
  ('Joghurt', 'joghurt'),
  ('Kalbsfond', 'kalbsfond'),
  ('Karotte', 'karotte'),
  ('Kartoffel', 'kartoffel'),
  ('Käse', 'kaese'),
  ('Knoblauch', 'knoblauch'),
  ('Knoblauchzehe', 'knoblauchzehe'),
  ('Kokosnüsse', 'kokosnuesse'),
  ('Koriander', 'koriander'),
  ('Kresse', 'kresse'),
  ('Kuchen', 'kuchen'),
  ('Lachs', 'lachsfilet'),
  ('Lachsfilet', 'lachsfilet'),
  ('Lauch', 'lauch'),
  ('Lauchzwiebel', 'fruehlingszwiebel'),
  ('Limettensaft', 'limettensaft'),
  ('Lorbeerblätter', 'lorbeerblaetter'),
  ('Mandelmilch', 'mandelmilch'),
  ('Meerrettich', 'meerrettich'),
  ('Möhre', 'moehre'),
  ('Nudeln', 'nudeln'),
  ('Oliven', 'oliven'),
  ('Orangensaft', 'orangensaft'),
  ('Petersilie', 'petersilie'),
  ('Pizza', 'pizza'),
  ('Quark', 'quark'),
  ('Radieschen', 'radieschen'),
  ('Radischen', 'radieschen'),
  ('Rote Linsen', 'rote-linsen'),
  ('Saft', 'saft'),
  ('Salami', 'salami'),
  ('Salat', 'salat'),
  ('Salz', 'salz'),
  ('scharfes Currypulver', 'scharfes-currypulver'),
  ('Schmand', 'schmand'),
  ('Schmand 150 g', 'schmand'),
  ('schwarzer Pfeffer', 'schwarzer-pfeffer'),
  ('Schweineschmalz', 'schweineschmalz'),
  ('Sekt', 'sekt'),
  ('Stückige Tomaten', 'gehackte-tomaten'),
  ('TK-Beeren', 'tk-beeren'),
  ('Tofu', 'tofu'),
  ('Tofuwiener', 'tofuwiener'),
  ('Tomate', 'tomate'),
  ('Wacholderbeere', 'wacholderbeere'),
  ('Walnüsse', 'walnuesse'),
  ('Wasser', 'wasser'),
  ('Zwiebel', 'zwiebel')
) as v(name, slug)
where i.image_slug is null
  and singular_key(i.display_name) = singular_key(v.name);
