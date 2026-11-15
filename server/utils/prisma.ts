import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client";

let client: PrismaClient | undefined;

/**
 * Единый Prisma-клиент на процесс Nitro.
 * Prisma 7 не содержит Rust-движка: подключение только через driver adapter (ADR-11).
 */
export function usePrisma(): PrismaClient {
  if (client) return client;

  const { databaseUrl } = useRuntimeConfig();
  const connectionString = databaseUrl || process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL не задан — проверьте .env (см. .env.example)");
  }

  client = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  return client;
}
