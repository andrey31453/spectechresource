import type { PrismaClient } from "../../generated/prisma/client";
import { throwFieldError } from "./admin-request";

/** Проверка справочника до записи связей; undefined у PATCH означает «не менять». */
export async function validateServiceEquipment(prisma: Pick<PrismaClient, "equipmentType">, ids: string[] | undefined) {
  if (!ids?.length) return;
  const count = await prisma.equipmentType.count({ where: { id: { in: ids } } });
  if (count !== ids.length) throwFieldError("equipmentTypeIds", "Один из выбранных видов техники не существует");
}

export function serviceEquipmentRelation(ids: string[] | undefined) {
  return ids === undefined ? undefined : { set: ids.map((id) => ({ id })) };
}