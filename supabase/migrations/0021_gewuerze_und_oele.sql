-- "Noch vorrätig?" ist keine eigene Abteilung mehr.
--
-- Stattdessen: die Abteilung "Gewürze, Öle & Saucen" wird zu "Gewürze und
-- Öle" — Saucen ziehen nach Sonstiges um, weil man die tatsächlich verbraucht
-- und regelmäßig nachkauft, anders als Gewürze und Öle. Die Gewürze und die
-- Brühe aus der kurzlebigen "noch-vorraetig"-Abteilung (0020) wandern zurück
-- in "Gewürze und Öle". ListView zeigt diese eine Abteilung dann komplett
-- unter der Überschrift "Noch vorrätig?" an (siehe STOCK_CHECK_CATEGORY_ID).

update categories set name = 'Gewürze und Öle' where id = 'gewuerze';

update ingredients set category_id = 'gewuerze'
where category_id = 'noch-vorraetig';

update ingredients set category_id = 'sonstiges'
where category_id = 'gewuerze'
  and name_norm in (
    'currypaste',
    'senf',
    'dijonsenf',
    'ketchup',
    'mayonnaise',
    'sojasauce',
    'fischsauce',
    'worcestershiresauce',
    'tabasco',
    'sriracha',
    'harissa',
    'tahini'
  );

delete from categories where id = 'noch-vorraetig';
