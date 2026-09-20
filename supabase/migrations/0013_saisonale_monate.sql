-- Saisonale Monate je Rezept — vorbereitet für die geplante automatische
-- Verschlagwortung, die diese Spalte später befüllt. Bis dahin bleibt sie
-- leer, und der „Saisonal“-Schnellfilter in der Rezeptübersicht zeigt
-- entsprechend nichts an.
alter table recipes
  add column season_months smallint[] not null default '{}'::smallint[];

alter table recipes
  add constraint recipes_season_months_check
    check (season_months <@ array[1,2,3,4,5,6,7,8,9,10,11,12]::smallint[]);
