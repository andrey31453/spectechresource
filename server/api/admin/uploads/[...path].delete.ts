import { isSafeUploadPath, uploadUrlFromPath } from "#shared/utils/uploads";
import { requireAdmin } from "../../../utils/admin-guard";
import { throwConflict, throwNotFound } from "../../../utils/admin-request";
import { findUploadUsages } from "../../../utils/upload-references";
import { removeUploadGroup } from "../../../utils/uploads";

/**
 * Удаление загруженного файла: `DELETE /api/admin/uploads/2026/11/<uuid>.jpg`.
 *
 * Файл, на который ссылается каталог, не удаляем (`409` со списком мест): иначе на сайте
 * останется битая картинка. «Сироты» убирает задача `uploads:cleanup`.
 */
export default defineEventHandler(async (event) => {
  requireAdmin(event);

  const relativePath = String(getRouterParam(event, "path") ?? "");

  if (!isSafeUploadPath(relativePath)) {
    throwNotFound("Файл не найден");
  }

  const usages = await findUploadUsages(usePrisma(), uploadUrlFromPath(relativePath));

  if (usages.length > 0) {
    throwConflict(`Файл используется: ${usages.join(", ")}. Сначала уберите его из этих записей.`);
  }

  const removed = await removeUploadGroup(relativePath);

  if (!removed) {
    throwNotFound("Файл не найден");
  }

  return { ok: true };
});
