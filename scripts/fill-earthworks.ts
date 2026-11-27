import "dotenv/config";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { earthworksContent, earthworksDescriptions, earthworksFaq, earthworksSlug } from "../shared/content/earthworks";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env["DATABASE_URL"] }),
});

try {
  const backupPath = join(await mkdtemp(join(tmpdir(), "spectech-earthworks-")), "before.json");
  await prisma.$transaction(async (tx) => {
    const service = await tx.service.findUniqueOrThrow({
      where: { slug: earthworksSlug }, include: { faq: true },
    });
    await writeFile(backupPath, JSON.stringify(service, null, 2), { mode: 0o600 });
    await tx.service.update({ where: { id: service.id }, data: { ...earthworksContent, ...earthworksDescriptions } });
    for (const [index, item] of earthworksFaq.entries()) {
      if (service.faq.some((existing) => existing.question === item.question)) continue;
      await tx.faqItem.create({
        data: { ...item, scope: "SERVICE", serviceId: service.id, sortOrder: (index + 1) * 10 },
      });
    }
  });
  console.log(`Обновлена только услуга ${earthworksSlug}. Резервная копия: ${backupPath}`);
} finally {
  await prisma.$disconnect();
}