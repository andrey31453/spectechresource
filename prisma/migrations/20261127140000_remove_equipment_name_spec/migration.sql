-- Название товара хранится в brand/model, а не в дублирующей характеристике.
DELETE FROM equipment_specs
WHERE lower(btrim(regexp_replace(replace(name, chr(160), ' '), '[[:space:]:]+', ' ', 'g')))
  = 'название техники';