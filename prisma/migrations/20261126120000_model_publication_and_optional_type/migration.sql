-- Imported models may remain unassigned until an administrator reviews them.
ALTER TABLE "equipment_models" ADD COLUMN "isPublished" BOOLEAN NOT NULL DEFAULT false;
UPDATE "equipment_models" SET "isPublished" = "isAvailable";
ALTER TABLE "equipment_models" DROP COLUMN "isAvailable";
ALTER TABLE "equipment_models" ALTER COLUMN "typeId" DROP NOT NULL;
ALTER TABLE "equipment_models" DROP CONSTRAINT "equipment_models_typeId_fkey";
ALTER TABLE "equipment_models" ADD CONSTRAINT "equipment_models_typeId_fkey"
  FOREIGN KEY ("typeId") REFERENCES "equipment_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;