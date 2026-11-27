import type { ServiceEquipmentDto } from "~/types/catalog";

/** Всегда возвращает согласованные вид/модели/выбор, в том числе при обновлении данных. */
export function serviceShowcaseSelection(equipment: ServiceEquipmentDto, typeSlug: string, modelId: string) {
  const type = equipment.types.find((item) => item.slug === typeSlug) ?? equipment.types[0];
  const models = type ? equipment.models.filter((model) => model.typeSlug === type.slug) : [];
  const model = models.find((item) => item.id === modelId) ?? models[0];
  return { type, models, model };
}