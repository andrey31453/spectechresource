ALTER TABLE "services" ADD COLUMN "descriptionTop" TEXT, ADD COLUMN "descriptionBottom" TEXT;

CREATE TABLE "_EquipmentTypeToService" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_EquipmentTypeToService_AB_pkey" PRIMARY KEY ("A", "B")
);
CREATE INDEX "_EquipmentTypeToService_B_index" ON "_EquipmentTypeToService"("B");
ALTER TABLE "_EquipmentTypeToService" ADD CONSTRAINT "_EquipmentTypeToService_A_fkey" FOREIGN KEY ("A") REFERENCES "equipment_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_EquipmentTypeToService" ADD CONSTRAINT "_EquipmentTypeToService_B_fkey" FOREIGN KEY ("B") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;