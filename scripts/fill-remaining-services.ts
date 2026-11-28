import "dotenv/config";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parse } from "valibot";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { remainingServices } from "../shared/content/remaining-services";
import { ServiceUpdateSchema } from "../shared/schemas/admin-services";
import { FaqCreateSchema } from "../shared/schemas/admin-content";

const connectionString = process.env["DATABASE_URL"];
if (!connectionString || !["localhost", "127.0.0.1", "[::1]"].includes(new URL(connectionString).hostname)) {
  throw new Error("Наполнение разрешено только для локальной DATABASE_URL");
}
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

try {
  const backupPath = join(await mkdtemp(join(tmpdir(), "spectech-services-")), "before.json");
  await prisma.$transaction(async (tx) => {
    const services = await tx.service.findMany({
      where: { slug: { in: remainingServices.map((item) => item.slug) } },
      include: { faq: true, equipmentTypes: true },
    });
    if (services.length !== remainingServices.length) throw new Error("Не найдены все четыре услуги");
    await writeFile(backupPath, JSON.stringify(services, null, 2), { mode: 0o600 });
    for (const item of remainingServices) {
      const service = services.find((existing) => existing.slug === item.slug)!;
      const types = await tx.equipmentType.findMany({
        where: { slug: { in: item.equipmentSlugs }, isPublished: true, category: { isPublished: true } },
        select: { id: true },
      });
      if (types.length !== item.equipmentSlugs.length) throw new Error(`Не найдены виды техники для ${item.slug}`);
      const content = parse(ServiceUpdateSchema, item.content);
      await tx.service.update({
        where: { id: service.id },
        data: { ...content, equipmentTypes: { connect: types } },
      });
      for (const [index, faq] of item.faq.entries()) {
        const data = parse(FaqCreateSchema, { ...faq, scope: "SERVICE", serviceId: service.id, sortOrder: (index + 1) * 10 });
        if (service.faq.some((existing) => existing.question === faq.question)) continue;
        await tx.faqItem.create({ data });
      }
    }
  }, { timeout: 15000 });
  console.log(`Обновлены четыре услуги. Резервная копия: ${backupPath}`);
} finally {
  await prisma.$disconnect();
}