import type { ImageMime } from "#shared/utils/uploads";

/** Ответ `POST /api/admin/uploads` — зеркало `server/api/admin/uploads/index.post.ts`. */
export interface AdminUploadDto {
  path: string;
  url: string;
  size: number;
  mime: ImageMime;
  originalName: string | null;
}
