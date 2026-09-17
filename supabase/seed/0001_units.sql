-- AUTOMATISCH ERZEUGT von scripts/generate-units-seed.mjs
-- Nicht von Hand bearbeiten: Quelle ist src/lib/core/units.ts.
-- Neu erzeugen mit: npm run seed:units

insert into units (code, display, dimension, base_factor) values
  ('g', 'g', 'mass', 1),
  ('kg', 'kg', 'mass', 1000),
  ('mg', 'mg', 'mass', 0.001),
  ('Pfund', 'Pfund', 'mass', 500),
  ('ml', 'ml', 'volume', 1),
  ('cl', 'cl', 'volume', 10),
  ('dl', 'dl', 'volume', 100),
  ('l', 'l', 'volume', 1000),
  ('EL', 'EL', 'spoon', 1),
  ('TL', 'TL', 'spoon', 1),
  ('Prise', 'Prise', 'spoon', 1),
  ('Msp', 'Msp.', 'spoon', 1),
  ('Tropfen', 'Tropfen', 'spoon', 1),
  ('Stück', 'Stück', 'count', 1),
  ('Zehe', 'Zehe', 'count', 1),
  ('Bund', 'Bund', 'count', 1),
  ('Dose', 'Dose', 'count', 1),
  ('Packung', 'Packung', 'count', 1),
  ('Päckchen', 'Päckchen', 'count', 1),
  ('Scheibe', 'Scheibe', 'count', 1),
  ('Stange', 'Stange', 'count', 1),
  ('Zweig', 'Zweig', 'count', 1),
  ('Blatt', 'Blatt', 'count', 1),
  ('Becher', 'Becher', 'count', 1),
  ('Glas', 'Glas', 'count', 1),
  ('Tasse', 'Tasse', 'count', 1),
  ('Würfel', 'Würfel', 'count', 1),
  ('Kugel', 'Kugel', 'count', 1),
  ('Kopf', 'Kopf', 'count', 1),
  ('Knolle', 'Knolle', 'count', 1),
  ('Handvoll', 'Handvoll', 'count', 1)
on conflict (code) do update
  set display = excluded.display,
      dimension = excluded.dimension,
      base_factor = excluded.base_factor;
