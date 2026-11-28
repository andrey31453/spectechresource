import { readFileSync, existsSync } from "node:fs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
try {
  if (process.argv[2] === "export") {
    const services = await prisma.service.findMany({ include: { equipmentTypes: { select: { slug: true } } } });
    process.stdout.write(JSON.stringify(services.map(({ id: _id, createdAt: _created, updatedAt: _updated, ...data }) => data)));
  } else {
    if (process.env.CONFIRM_SERVICES !== "SYNC SERVICES ONLY") throw new Error("Explicit confirmation required");
    const rows = JSON.parse(readFileSync(process.argv[2]!, "utf8"));
    if (!Array.isArray(rows) || rows.length === 0) throw new Error("Nonempty services array required");
    const fields = ["slug", "title", "description", "descriptionTop", "descriptionBottom", "image", "seoTitle", "seoDescription", "seoText", "sortOrder", "isPublished", "equipmentTypes"];
    const slugs = new Set<string>();
    for (const row of rows) {
      if (!row || Object.keys(row).some(key => !fields.includes(key)) || typeof row.slug !== "string" || typeof row.title !== "string" || !Array.isArray(row.equipmentTypes)) throw new Error("Invalid service payload");
      if (slugs.has(row.slug)) throw new Error("Duplicate service slug");
      slugs.add(row.slug);
      if (row.image?.startsWith("/uploads/")) {
        if (!/^\/uploads\/\d{4}\/\d{2}\/[a-f0-9-]+-full\.webp$/.test(row.image)
          || !existsSync(`/opt/spectech/shared${row.image}`)) throw new Error("Service upload missing or invalid");
      }
    }
    await prisma.$transaction(async tx => {
      for (const { equipmentTypes, ...data } of rows) {
        const links = [];
        for (const ref of equipmentTypes) {
          if (typeof ref?.slug !== "string") throw new Error("Invalid equipment reference");
          const type = await tx.equipmentType.findUniqueOrThrow({ where: { slug: ref.slug }, select: { id: true } });
          links.push(type);
        }
        await tx.service.upsert({ where: { slug: data.slug }, create: { ...data, equipmentTypes: { connect: links } }, update: { ...data, equipmentTypes: { set: links } } });
      }
    }, { timeout: 30000 });
    console.log(`Updated ${rows.length} services; other tables unchanged`);
  }
} finally {
  await prisma.$disconnect();
}