/** DTO админ-API: то, что реально приходит в браузер (без хешей и служебных полей). */

export interface AdminUserDto {
  id: string;
  email: string;
  name: string | null;
}

/** Ошибка валидации поля — тот же формат, что у публичных API. */
export interface AdminFieldError {
  field: string;
  message: string;
}
