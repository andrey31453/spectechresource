import * as v from "valibot";
import { optionalText, requiredText, slugField } from "./catalog";
import { toFieldErrors, type FieldError } from "./errors";

/**
 * Схемы статических страниц (`Page`) — одни для админ-формы и админ-API.
 *
 * Страница открывается по корневому адресу `/{slug}`, поэтому часть кодов уже занята
 * разделами сайта: `katalog`, `uslugi`, `kontakty` и т.п. перекрывают `app/pages/[slug].vue`,
 * и сохранённая страница просто не откроется. Такие коды отклоняем на уровне схемы,
 * чтобы администратор увидел ошибку у поля, а не пустую страницу на сайте.
 */

const RESERVED_SLUGS: readonly string[] = ["admin", "api", "uploads", "katalog", "uslugi", "kontakty", "_nuxt"];
/** Посадочные живут по адресам `arenda-{вид}-v-{город}` — корневые страницы туда не пускаем. */
const LANDING_PREFIX = "arenda-";

const contentField = v.pipe(
  v.string("Заполните текст страницы"),
  v.trim(),
  v.minLength(1, "Заполните текст страницы"),
  v.maxLength(100_000, "Текст страницы — не больше 100 000 символов"),
);

const pageSlug = v.pipe(
  slugField(),
  v.check(
    (value) => !RESERVED_SLUGS.includes(value),
    "Этот адрес занят разделом сайта — выберите другой код",
  ),
  v.check(
    (value) => !value.startsWith(LANDING_PREFIX),
    "Адреса посадочных страниц начинаются с «arenda-» — выберите другой код",
  ),
);

const pageFields = {
  slug: pageSlug,
  title: requiredText(200, "заголовок страницы"),
  content: contentField,
  seoTitle: optionalText(200, "SEO-заголовок"),
  seoDescription: optionalText(300, "SEO-описание"),
  isPublished: v.boolean("Публикация — да или нет"),
};

export const PageCreateSchema = v.object({
  ...pageFields,
  isPublished: v.optional(pageFields.isPublished, true),
});

/** `partial`: PATCH присылает только изменённые поля, остальные Prisma не трогает. */
export const PageUpdateSchema = v.partial(v.object(pageFields));

export type PageCreateInput = v.InferOutput<typeof PageCreateSchema>;
export type PageUpdateInput = v.InferOutput<typeof PageUpdateSchema>;

export type AdminPageFieldError = FieldError;

export const toAdminPageFieldErrors = toFieldErrors;
