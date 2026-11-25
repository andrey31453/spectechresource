ALTER TABLE "equipment_models" ADD COLUMN "slug" TEXT;

WITH codes AS (
  SELECT "id", "typeId", COALESCE(NULLIF(trim(both '-' from regexp_replace(
    translate(lower("brand" || '-' || "model"),
      'абвгдеёзийклмнопрстуфхыэ', 'abvgdeeziyklmnoprstufhye'),
    '[^a-z0-9]+', '-', 'g')), ''), 'model') AS code
  FROM "equipment_models"
), numbered AS (
  SELECT *, row_number() OVER (PARTITION BY "typeId", code ORDER BY "id") AS n FROM codes
)
UPDATE "equipment_models" AS m
SET "slug" = left(numbered.code, 60) || CASE WHEN numbered.n > 1 THEN '-' || m."id" ELSE '' END
FROM numbered WHERE m."id" = numbered."id";

ALTER TABLE "equipment_models" ALTER COLUMN "slug" SET NOT NULL;
CREATE UNIQUE INDEX "equipment_models_typeId_slug_key" ON "equipment_models"("typeId", "slug");