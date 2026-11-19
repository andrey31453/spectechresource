/**
 * Сид: справочник каталога + минимальный демо-контент для вёрстки.
 *
 * Данные каталога (8 разделов, 39 видов) взяты из docs/tz-structured.md §6.
 * Идемпотентен: справочники пишутся через upsert по slug (модели — по `(typeId, brand, model)`),
 * FAQ — по тексту вопроса (демо-ответы обновляются), блоки контента — по `sortOrder`
 * (демо-тексты обновляются, строки с другими `sortOrder` из админки не трогаются).
 *
 * ⚠️ Всё, что помечено ДЕМО (телефон, цифры доверия, цены, модели, тексты),
 * подлежит замене реальными данными заказчика через админку.
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

// Prisma 7 без Rust-движка: подключение только через driver adapter.
const adapter = new PrismaPg({ connectionString: process.env["DATABASE_URL"] });
const prisma = new PrismaClient({ adapter });

// ДЕМО: h1 и короткие описания — заменить реальными текстами через админку.
const categories = [
  { slug: "zemleroynaya-tehnika", title: "Землеройная техника", h1: "Аренда землеройной техники в Москве", shortDesc: "Экскаваторы, траншеекопатели и планировщики для земляных работ.", sortOrder: 10 },
  { slug: "pogruzochnaya-tehnika", title: "Погрузочная техника", h1: "Аренда погрузочной техники в Москве", shortDesc: "Мини-погрузчики, вилочные и телескопические погрузчики.", sortOrder: 20 },
  { slug: "podyomnaya-tehnika", title: "Подъёмная техника", h1: "Аренда подъёмной техники в Москве", shortDesc: "Автокраны, гусеничные краны и автовышки.", sortOrder: 30 },
  { slug: "dorozhno-remontnaya-tehnika", title: "Дорожно-ремонтная техника", h1: "Аренда дорожно-ремонтной техники в Москве", shortDesc: "Грейдеры, катки, фрезы и асфальтоукладчики.", sortOrder: 40 },
  { slug: "stroitelnaya-tehnika", title: "Строительная техника", h1: "Аренда строительной техники в Москве", shortDesc: "Бетононасосы, бетоносмесители и вибропогружатели.", sortOrder: 50 },
  { slug: "transportnaya-tehnika", title: "Транспортная техника", h1: "Аренда транспортной техники в Москве", shortDesc: "Манипуляторы, самосвалы, длинномеры и тралы.", sortOrder: 60 },
  { slug: "kommunalnaya-tehnika", title: "Коммунальная техника", h1: "Аренда коммунальной техники в Москве", shortDesc: "Илососы, водовозы и поливомоечные машины.", sortOrder: 70 },
  { slug: "svaeboynaya-tehnika", title: "Сваебойная техника", h1: "Аренда сваебойной техники в Москве", shortDesc: "Сваебойные установки для свайных работ.", sortOrder: 80 },
];

type TypeSeed = {
  categorySlug: string;
  slug: string;
  name: string;
  nameGenitive: string;
  priceUnit?: "SHIFT" | "HOUR" | "PER_METER";
};

// 39 видов техники — порядок и слаги строго по ТЗ.
const types: TypeSeed[] = [
  // Землеройная (9)
  { categorySlug: "zemleroynaya-tehnika", slug: "gusenichnogo-ekskavatora", name: "Гусеничные экскаваторы", nameGenitive: "гусеничного экскаватора" },
  { categorySlug: "zemleroynaya-tehnika", slug: "kolesnogo-ekskavatora", name: "Колёсные экскаваторы", nameGenitive: "колёсного экскаватора" },
  { categorySlug: "zemleroynaya-tehnika", slug: "ekskavatora-razrushitelya", name: "Экскаваторы-разрушители", nameGenitive: "экскаватора-разрушителя" },
  { categorySlug: "zemleroynaya-tehnika", slug: "plavayushchego-ekskavatora", name: "Плавающие экскаваторы", nameGenitive: "плавающего экскаватора" },
  { categorySlug: "zemleroynaya-tehnika", slug: "ekskavatora-planirovshchika", name: "Экскаваторы-планировщики", nameGenitive: "экскаватора-планировщика" },
  { categorySlug: "zemleroynaya-tehnika", slug: "ekskavatora-pogruzchika", name: "Экскаваторы-погрузчики", nameGenitive: "экскаватора-погрузчика" },
  { categorySlug: "zemleroynaya-tehnika", slug: "mini-ekskavatora", name: "Мини-экскаваторы", nameGenitive: "мини-экскаватора" },
  { categorySlug: "zemleroynaya-tehnika", slug: "transheekopatelya", name: "Траншеекопатели", nameGenitive: "траншеекопателя", priceUnit: "PER_METER" },
  { categorySlug: "zemleroynaya-tehnika", slug: "ekskavatora-s-dlinnoy-streloy", name: "Экскаваторы с длинной стрелой", nameGenitive: "экскаватора с длинной стрелой" },
  // Погрузочная (4)
  { categorySlug: "pogruzochnaya-tehnika", slug: "mini-pogruzchika", name: "Мини-погрузчики", nameGenitive: "мини-погрузчика" },
  { categorySlug: "pogruzochnaya-tehnika", slug: "vilochnogo-pogruzchika", name: "Вилочные погрузчики", nameGenitive: "вилочного погрузчика" },
  { categorySlug: "pogruzochnaya-tehnika", slug: "teleskopicheskogo-pogruzchika", name: "Телескопические погрузчики", nameGenitive: "телескопического погрузчика" },
  { categorySlug: "pogruzochnaya-tehnika", slug: "frontalnogo-pogruzchika", name: "Фронтальные погрузчики", nameGenitive: "фронтального погрузчика" },
  // Подъёмная (4)
  { categorySlug: "podyomnaya-tehnika", slug: "avtokrana", name: "Автокраны", nameGenitive: "автокрана" },
  { categorySlug: "podyomnaya-tehnika", slug: "bashennogo-avtokrana", name: "Башенные автокраны", nameGenitive: "башенного автокрана" },
  { categorySlug: "podyomnaya-tehnika", slug: "gusenichnogo-krana", name: "Гусеничные краны", nameGenitive: "гусеничного крана" },
  { categorySlug: "podyomnaya-tehnika", slug: "avtovyshki", name: "Автовышки", nameGenitive: "автовышки" },
  // Дорожно-ремонтная (7)
  { categorySlug: "dorozhno-remontnaya-tehnika", slug: "avtogreydera", name: "Автогрейдеры", nameGenitive: "автогрейдера" },
  { categorySlug: "dorozhno-remontnaya-tehnika", slug: "asfaltoukladchika", name: "Асфальтоукладчики", nameGenitive: "асфальтоукладчика" },
  { categorySlug: "dorozhno-remontnaya-tehnika", slug: "buldozera", name: "Бульдозеры", nameGenitive: "бульдозера" },
  { categorySlug: "dorozhno-remontnaya-tehnika", slug: "gidromolota", name: "Гидромолоты", nameGenitive: "гидромолота" },
  { categorySlug: "dorozhno-remontnaya-tehnika", slug: "dorozhnoy-frezy", name: "Дорожные фрезы", nameGenitive: "дорожной фрезы" },
  { categorySlug: "dorozhno-remontnaya-tehnika", slug: "katka", name: "Катки", nameGenitive: "катка" },
  { categorySlug: "dorozhno-remontnaya-tehnika", slug: "kompressora", name: "Компрессоры", nameGenitive: "компрессора" },
  // Строительная (5)
  { categorySlug: "stroitelnaya-tehnika", slug: "avtobetononasosa", name: "Автобетононасосы", nameGenitive: "автобетононасоса" },
  { categorySlug: "stroitelnaya-tehnika", slug: "avtobetonosmesitelya", name: "Автобетоносмесители", nameGenitive: "автобетоносмесителя" },
  { categorySlug: "stroitelnaya-tehnika", slug: "vibropogruzhatelya", name: "Вибропогружатели", nameGenitive: "вибропогружателя" },
  { categorySlug: "stroitelnaya-tehnika", slug: "greyfera", name: "Грейферы", nameGenitive: "грейфера" },
  { categorySlug: "stroitelnaya-tehnika", slug: "podemnika", name: "Подъёмники", nameGenitive: "подъёмника" },
  // Транспортная (5)
  { categorySlug: "transportnaya-tehnika", slug: "manipulyatora", name: "Манипуляторы", nameGenitive: "манипулятора" },
  { categorySlug: "transportnaya-tehnika", slug: "dlinnomera", name: "Длинномеры", nameGenitive: "длинномера" },
  { categorySlug: "transportnaya-tehnika", slug: "samosvala", name: "Самосвалы", nameGenitive: "самосвала" },
  { categorySlug: "transportnaya-tehnika", slug: "nizkoramnoy-platformy", name: "Низкорамные платформы (тралы)", nameGenitive: "низкорамной платформы (трала)" },
  { categorySlug: "transportnaya-tehnika", slug: "bortovoy-mashiny", name: "Бортовые машины", nameGenitive: "бортовой машины" },
  // Коммунальная (4)
  { categorySlug: "kommunalnaya-tehnika", slug: "ilososa", name: "Илососы", nameGenitive: "илососа" },
  { categorySlug: "kommunalnaya-tehnika", slug: "polivomoechnoy-mashiny", name: "Поливомоечные машины", nameGenitive: "поливомоечной машины" },
  { categorySlug: "kommunalnaya-tehnika", slug: "vodovoza", name: "Водовозы", nameGenitive: "водовоза" },
  { categorySlug: "kommunalnaya-tehnika", slug: "vakuumnoy-mashiny", name: "Вакуумные машины", nameGenitive: "вакуумной машины" },
  // Сваебойная (1)
  { categorySlug: "svaeboynaya-tehnika", slug: "svaeboynoy-ustanovki", name: "Сваебойные установки", nameGenitive: "сваебойной установки" },
];

// ДЕМО: цены «от» для шести видов (чтобы таблица цен на главной была видна),
// у остальных null → в UI «цена по запросу». Ставим только если админ ещё не задал своё.
const priceFromDemo: Record<string, string> = {
  "gusenichnogo-ekskavatora": "26000.00",
  "kolesnogo-ekskavatora": "22000.00",
  "mini-ekskavatora": "13500.00",
  "mini-pogruzchika": "9000.00",
  "avtokrana": "18000.00",
  "katka": "12000.00",
  "samosvala": "14000.00",
  "ilososa": "15000.00",
};

// ДЕМО: описания услуг — тексты из брифа главной (docs/specs/home.md §3.6).
const services = [
  {
    slug: "zemlyanye-raboty",
    title: "Земляные работы",
    description: "Разработка грунта, котлованы и траншеи, обратная засыпка. Экскаваторы от 1,5 до 20 т.",
  },
  {
    slug: "vyvoz-grunta",
    title: "Вывоз грунта",
    description: "Самосвалы 10–30 т, погрузка экскаватором, утилизация по договору.",
  },
  {
    slug: "demontazh",
    title: "Демонтаж",
    description: "Экскаваторы-разрушители, гидромолоты и грейферы; вывоз обломков.",
  },
  {
    slug: "planirovka-uchastka",
    title: "Планировка участка",
    description: "Планировщики и грейдеры, уплотнение катком, подготовка под благоустройство.",
  },
  {
    slug: "perevozka-tehniki-tralom",
    title: "Перевозка техники тралом",
    description: "Низкорамные платформы для доставки техники на объект и между площадками.",
  },
];

// ДЕМО: тексты преимуществ — бриф главной §3.7. Иконки — ключи из админки.
const advantages = [
  {
    title: "Собственный парк",
    text: "120 единиц в наличии, без посредников и «машин от партнёров».",
    icon: "fleet",
    sortOrder: 10,
  },
  {
    title: "Подача от 4 часов",
    text: "Диспетчер на связи 08:00–20:00, срочные заявки согласуем по телефону.",
    icon: "clock",
    sortOrder: 20,
  },
  {
    title: "Машинисты с допусками",
    text: "Удостоверения, стаж от 5 лет, инструктаж на объекте.",
    icon: "crew",
    sortOrder: 30,
  },
  {
    title: "Документы для юрлиц",
    text: "Договор, счёт, УПД, акты, путевые листы. С НДС и без НДС.",
    icon: "docs",
    sortOrder: 40,
  },
  {
    title: "Подмена при поломке",
    text: "Если техника встала не по вине заказчика — подаём резервную машину.",
    icon: "gear",
    sortOrder: 50,
  },
  {
    title: "Прозрачная цена",
    text: "Смена 8 часов, час сверх — по тарифу. Доставку и ГСМ считаем заранее.",
    icon: "shield",
    sortOrder: 60,
  },
];

// ДЕМО: сроки в текстах шагов — бриф главной §3.9, заменить реальными SLA.
const workSteps = [
  {
    title: "Заявка",
    text: "Оставляете заявку на сайте или звоните. Уточняем задачу, объект и сроки — 5 минут.",
    sortOrder: 10,
  },
  {
    title: "Расчёт",
    text: "Подбираем технику, считаем смену с доставкой, присылаем КП — до 1 часа.",
    sortOrder: 20,
  },
  {
    title: "Договор",
    text: "Согласуем условия, выставляем счёт, готовим закрывающие документы — от 1 дня.",
    sortOrder: 30,
  },
  {
    title: "Подача",
    text: "Машина приезжает на объект в согласованное время. Инструктаж и путевой лист — от 4 часов.",
    sortOrder: 40,
  },
];

// ДЕМО: цифры-заглушки, заменить реальными значениями заказчика.
// Порядок значим: первые три записи выводятся в первом экране (120 ед., 4 часа, 12 лет —
// бриф §3.2), все шесть — в блоке «Парк и база» (§3.8).
const trustStats = [
  { value: "120", unit: "ед.", label: "техники в парке", sortOrder: 10 },
  { value: "4", unit: "часа", label: "средняя подача", sortOrder: 20 },
  { value: "12", unit: "лет", label: "на рынке аренды", sortOrder: 30 },
  { value: "39", unit: null, label: "видов техники", sortOrder: 40 },
  { value: "8", unit: null, label: "разделов каталога", sortOrder: 50 },
  { value: "6", unit: null, label: "механиков и машинистов в смене", sortOrder: 60 },
];

const faqSeed: Array<{
  scope: "GLOBAL" | "TYPE";
  typeSlug?: string;
  question: string;
  answer: string;
  sortOrder: number;
}> = [
  // ГЛАВНАЯ: 11 частых вопросов (бриф главной §3.17).
  // ⚠️ Ответы про ГСМ, НДС, замену машины и работу с физлицами — проект решения:
  // подтвердить у заказчика до запуска сайта.
  {
    scope: "GLOBAL",
    question: "Какая минимальная смена?",
    answer: "Стандартная смена — 8 часов. Минимальный заказ — 4 часа; для тяжёлой техники условия уточняйте у менеджера.",
    sortOrder: 10,
  },
  {
    scope: "GLOBAL",
    question: "Кто оплачивает топливо?",
    answer: "ГСМ оплачивает заказчик, если в договоре не согласовано иное. Расход зависит от модели и режима работы.",
    sortOrder: 20,
  },
  {
    scope: "GLOBAL",
    question: "Можно ли арендовать технику без экипажа?",
    answer: "Да, часть техники сдаём без экипажа — при наличии у арендатора допуска и ответственности за эксплуатацию. Гусеничную и тяжёлую технику, как правило, сдаём только с машинистом.",
    sortOrder: 30,
  },
  {
    scope: "GLOBAL",
    question: "Как быстро подадите технику?",
    answer: "По Москве — от 4 часов при наличии свободной машины; в область — в зависимости от адреса и габаритов. Срочные заявки согласуем по телефону.",
    sortOrder: 40,
  },
  {
    scope: "GLOBAL",
    question: "Работаете ли вы с НДС?",
    answer: "Да, работаем с НДС и без — по схеме заказчика. Предоставляем счёт, УПД и акты.",
    sortOrder: 50,
  },
  {
    scope: "GLOBAL",
    question: "Какие документы получим?",
    answer: "Договор, счёт, УПД, акт выполненных работ и путевые листы. Для тендера — карточку предприятия и реквизиты.",
    sortOrder: 60,
  },
  {
    scope: "GLOBAL",
    question: "Что если техника сломается?",
    answer: "Заменим машину или пересчитаем смену. Простой по нашей вине не оплачивается.",
    sortOrder: 70,
  },
  {
    scope: "GLOBAL",
    question: "Можно ли заказать технику на неделю или месяц?",
    answer: "Да. На длительный срок ставка ниже — считаем индивидуально, заявку лучше оставить заранее.",
    sortOrder: 80,
  },
  {
    scope: "GLOBAL",
    question: "Доставляете ли в область?",
    answer: "Да, тралом или самоходом. Стоимость доставки зависит от адреса, габаритов и времени подачи.",
    sortOrder: 90,
  },
  {
    scope: "GLOBAL",
    question: "Работаете ли с физлицами?",
    answer: "Основные клиенты — юрлица и ИП: договор, закрывающие документы, оплата по счёту. Частные заказы рассматриваем по конкретной задаче.",
    sortOrder: 100,
  },
  {
    scope: "GLOBAL",
    question: "Участвуете ли в тендерах?",
    answer: "Да: 44-ФЗ, 223-ФЗ и коммерческие закупки. Готовим КП и документы в сроки заказчика.",
    sortOrder: 110,
  },
  {
    scope: "TYPE",
    typeSlug: "gusenichnogo-ekskavatora",
    question: "Какая минимальная смена?",
    answer: "Минимальный заказ — 4 часа, стандартная смена — 8 часов.",
    sortOrder: 10,
  },
  {
    scope: "TYPE",
    typeSlug: "gusenichnogo-ekskavatora",
    question: "Сдаёте ли технику без экипажа?",
    answer: "Гусеничные экскаваторы сдаются только с машинистом — так требует техника безопасности на объекте.",
    sortOrder: 20,
  },
  {
    scope: "TYPE",
    typeSlug: "mini-ekskavatora",
    question: "Поместится ли мини-экскаватор на участок?",
    answer: "Ширина мини-экскаватора — от 1,4 м, он проходит в стандартные ворота и работает на ограниченной площади.",
    sortOrder: 10,
  },
  {
    scope: "TYPE",
    typeSlug: "avtokrana",
    question: "Как рассчитывается стоимость автокрана?",
    answer: "Стоимость зависит от грузоподъёмности, вылета стрелы и времени работы; доставка считается отдельно.",
    sortOrder: 10,
  },
];

// ДЕМО-модели: по две на два популярных вида. Остальные виды — «цена по запросу».
const demoModels: Array<{
  typeSlug: string;
  brand: string;
  model: string;
  pricePerShift: string;
  pricePerHour: string;
  sortOrder: number;
  specs: Array<{ name: string; value: string }>;
}> = [
  {
    typeSlug: "gusenichnogo-ekskavatora",
    brand: "Hitachi",
    model: "ZX200-5G",
    pricePerShift: "28000.00",
    pricePerHour: "4000.00",
    sortOrder: 10,
    specs: [
      { name: "Масса, т", value: "20" },
      { name: "Мощность, л.с.", value: "163" },
      { name: "Глубина копания, м", value: "6,7" },
      { name: "Объём ковша, м³", value: "0,9" },
    ],
  },
  {
    typeSlug: "gusenichnogo-ekskavatora",
    brand: "JCB",
    model: "JS205",
    pricePerShift: "26000.00",
    pricePerHour: "3800.00",
    sortOrder: 20,
    specs: [
      { name: "Масса, т", value: "20,6" },
      { name: "Мощность, л.с.", value: "155" },
      { name: "Глубина копания, м", value: "6,6" },
      { name: "Объём ковша, м³", value: "1,0" },
    ],
  },
  {
    typeSlug: "mini-ekskavatora",
    brand: "JCB",
    model: "8018 CTS",
    pricePerShift: "14000.00",
    pricePerHour: "2200.00",
    sortOrder: 10,
    specs: [
      { name: "Масса, т", value: "1,8" },
      { name: "Ширина, м", value: "1,4" },
      { name: "Глубина копания, м", value: "2,4" },
      { name: "Объём ковша, м³", value: "0,05" },
    ],
  },
  {
    typeSlug: "mini-ekskavatora",
    brand: "Kubota",
    model: "KX016-4",
    pricePerShift: "13500.00",
    pricePerHour: "2100.00",
    sortOrder: 20,
    specs: [
      { name: "Масса, т", value: "1,6" },
      { name: "Ширина, м", value: "1,4" },
      { name: "Глубина копания, м", value: "2,3" },
      { name: "Объём ковша, м³", value: "0,04" },
    ],
  },
];

async function main() {
  // 1. Город (create-if-missing: правки из админки не затираем)
  const city = await prisma.city.upsert({
    where: { slug: "moskva" },
    update: {},
    create: { slug: "moskva", name: "Москва", nameIn: "Москве", isDefault: true, sortOrder: 10 },
  });

  // 2. Настройки сайта — singleton. ДЕМО-контакты заменить реальными.
  await prisma.siteSettings.upsert({
    where: { id: "main" },
    update: {},
    create: {
      id: "main",
      phone: "+7 (495) 000-00-00", // ДЕМО
      email: "info@example.ru", // ДЕМО
      workingHours: "Пн–Вс, 08:00–20:00",
      address: "Москва, адрес уточняется", // ДЕМО
      cityId: city.id,
    },
  });

  // 3. Разделы каталога
  const categoryIds = new Map<string, string>();
  for (const c of categories) {
    const row = await prisma.category.upsert({
      where: { slug: c.slug },
      update: { title: c.title, sortOrder: c.sortOrder },
      create: {
        slug: c.slug,
        title: c.title,
        h1: c.h1,
        shortDesc: c.shortDesc,
        sortOrder: c.sortOrder,
      },
    });

    // ДЕМО-h1 заполняем только если админ ещё не задал свой — правки не затираем.
    if (!row.h1 || !row.shortDesc) {
      await prisma.category.update({
        where: { slug: c.slug },
        data: { h1: row.h1 ?? c.h1, shortDesc: row.shortDesc ?? c.shortDesc },
      });
    }

    categoryIds.set(c.slug, row.id);
  }

  // 4. Виды техники (39). Цены, заданные админом, не затираем:
  //    ДЕМО-цена «от» проставляется только там, где поле ещё пустое.
  const typeIds = new Map<string, string>();
  for (const [index, t] of types.entries()) {
    const categoryId = categoryIds.get(t.categorySlug);
    if (!categoryId) throw new Error(`Неизвестный раздел: ${t.categorySlug}`);

    const row = await prisma.equipmentType.upsert({
      where: { slug: t.slug },
      update: {
        categoryId,
        name: t.name,
        nameGenitive: t.nameGenitive,
        priceUnit: t.priceUnit ?? "SHIFT",
        sortOrder: (index + 1) * 10,
      },
      create: {
        categoryId,
        slug: t.slug,
        name: t.name,
        nameGenitive: t.nameGenitive,
        priceUnit: t.priceUnit ?? "SHIFT",
        sortOrder: (index + 1) * 10,
        priceFrom: priceFromDemo[t.slug] ?? null,
      },
    });

    const demoPrice = priceFromDemo[t.slug];
    if (demoPrice && row.priceFrom === null) {
      await prisma.equipmentType.update({
        where: { slug: t.slug },
        data: { priceFrom: demoPrice },
      });
    }

    typeIds.set(t.slug, row.id);
  }

  // 5. Демо-модели и их характеристики (у характеристик нет натурального ключа — пересобираем)
  for (const m of demoModels) {
    const typeId = typeIds.get(m.typeSlug);
    if (!typeId) throw new Error(`Неизвестный вид техники: ${m.typeSlug}`);

    const row = await prisma.equipmentModel.upsert({
      where: { typeId_brand_model: { typeId, brand: m.brand, model: m.model } },
      update: { sortOrder: m.sortOrder },
      create: {
        typeId,
        brand: m.brand,
        model: m.model,
        pricePerShift: m.pricePerShift,
        pricePerHour: m.pricePerHour,
        sortOrder: m.sortOrder,
      },
    });

    await prisma.equipmentSpec.deleteMany({ where: { modelId: row.id } });
    await prisma.equipmentSpec.createMany({
      data: m.specs.map((s, i) => ({
        modelId: row.id,
        name: s.name,
        value: s.value,
        sortOrder: (i + 1) * 10,
      })),
    });
  }

  // 6. FAQ — сид обновляет ответы демо-вопросов и не дублирует их.
  //    Вопросы прошлых версий сида удаляем, чтобы на главной не оставался мусор.
  const legacyDemoQuestions = [
    "Как заказать технику?",
    "Работаете ли вы с юридическими лицами?",
    "Сколько часов длится минимальная смена?",
  ];
  await prisma.faqItem.deleteMany({
    where: { scope: "GLOBAL", question: { in: legacyDemoQuestions } },
  });

  for (const f of faqSeed) {
    const data = {
      scope: f.scope,
      equipmentTypeId: f.typeSlug ? (typeIds.get(f.typeSlug) ?? null) : null,
      question: f.question,
      answer: f.answer,
      sortOrder: f.sortOrder,
    };
    const exists = await prisma.faqItem.findFirst({
      where: { question: f.question, scope: f.scope },
    });

    if (exists) {
      await prisma.faqItem.update({ where: { id: exists.id }, data });
      continue;
    }

    await prisma.faqItem.create({ data });
  }

  // 7. Блоки контента — синхронизация по sortOrder: демо-тексты обновляются,
  //    строки с другими sortOrder (добавленные в админке) не трогаем.
  for (const item of advantages) {
    const existing = await prisma.advantage.findFirst({
      where: { sortOrder: item.sortOrder },
      orderBy: { id: "asc" },
    });

    if (existing) {
      await prisma.advantage.update({ where: { id: existing.id }, data: item });
    } else {
      await prisma.advantage.create({ data: item });
    }
  }

  for (const item of workSteps) {
    const existing = await prisma.workStep.findFirst({
      where: { sortOrder: item.sortOrder },
      orderBy: { id: "asc" },
    });

    if (existing) {
      await prisma.workStep.update({ where: { id: existing.id }, data: item });
    } else {
      await prisma.workStep.create({ data: item });
    }
  }

  for (const item of trustStats) {
    const existing = await prisma.trustStat.findFirst({
      where: { sortOrder: item.sortOrder },
      orderBy: { id: "asc" },
    });

    if (existing) {
      await prisma.trustStat.update({ where: { id: existing.id }, data: item });
    } else {
      await prisma.trustStat.create({ data: item });
    }
  }

  // 8. Услуги
  for (const [index, s] of services.entries()) {
    await prisma.service.upsert({
      where: { slug: s.slug },
      update: { title: s.title, description: s.description, sortOrder: (index + 1) * 10 },
      create: {
        slug: s.slug,
        title: s.title,
        description: s.description,
        sortOrder: (index + 1) * 10,
      },
    });
  }

  // 9. Политика ПДн — ДЕМО-текст, заменить юридическим текстом заказчика
  const pageSlug = "politika-obrabotki-personalnyh-dannyh";
  await prisma.page.upsert({
    where: { slug: pageSlug },
    update: {},
    create: {
      slug: pageSlug,
      title: "Политика обработки персональных данных",
      content: [
        "> ДЕМО-текст. Заменить юридическим текстом заказчика до запуска сайта.",
        "",
        "## 1. Общие положения",
        "",
        "Настоящая политика определяет порядок обработки персональных данных пользователей сайта.",
        "",
        "## 2. Какие данные собираются",
        "",
        "Имя, телефон, адрес электронной почты и комментарий, которые пользователь указывает в формах.",
        "",
        "## 3. Цели обработки",
        "",
        "Обработка заявок на аренду техники и связь с пользователем по указанным контактам.",
      ].join("\n"),
    },
  });

  // Ранняя версия сида дублировала H1 внутри markdown — срезаем его, если он совпал с title.
  const existingPage = await prisma.page.findUnique({ where: { slug: pageSlug } });
  if (existingPage?.content.startsWith(`# ${existingPage.title}`)) {
    await prisma.page.update({
      where: { slug: pageSlug },
      data: { content: existingPage.content.replace(/^# .+\n{1,2}/, "") },
    });
  }

  // 10. Итог
  const [categoryCount, typeCount, modelCount, faqCount, serviceCount, pageCount] = await Promise.all([
    prisma.category.count(),
    prisma.equipmentType.count(),
    prisma.equipmentModel.count(),
    prisma.faqItem.count(),
    prisma.service.count(),
    prisma.page.count(),
  ]);

  console.log(
    `+ моделей: ${modelCount}, FAQ: ${faqCount}, услуг: ${serviceCount}, страниц: ${pageCount}\n` +
      `Итого в БД: разделов ${categoryCount}, видов техники ${typeCount}`,
  );
}

main()
  .catch((error) => {
    console.error("Сид упал:", error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
