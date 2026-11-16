import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { revokeAllAdminSessions } from "../server/utils/admin-sessions";
import { hashPassword, PASSWORD_LIMITS } from "../server/utils/password";

/**
 * Создание администратора админки.
 *
 *   ADMIN_EMAIL=admin@example.ru ADMIN_PASSWORD='…' npm run admin:create
 *   ADMIN_EMAIL=admin@example.ru ADMIN_PASSWORD='…' npm run admin:create -- --update
 *
 * `--update` меняет пароль существующего пользователя и **отзывает все его сессии**:
 * смена пароля должна выбрасывать из админки везде, где вход был со старым.
 * Пароль читается только из переменной окружения — в истории команд и в репозитории его нет.
 */

const email = process.env["ADMIN_EMAIL"]?.trim().toLowerCase() ?? "";
const password = process.env["ADMIN_PASSWORD"] ?? "";
const name = process.env["ADMIN_NAME"]?.trim() || null;
const rawRole = process.env["ADMIN_ROLE"]?.trim().toUpperCase() || null;
const connectionString = process.env["DATABASE_URL"];
const shouldUpdate = process.argv.includes("--update");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

function fail(message: string): never {
  console.error(`✗ ${message}`);
  process.exit(1);
}

if (!connectionString) fail("DATABASE_URL не задан — проверьте .env (см. .env.example)");
if (!email) fail("ADMIN_EMAIL не задан: ADMIN_EMAIL=admin@example.ru ADMIN_PASSWORD='…' npm run admin:create");
if (!EMAIL_RE.test(email)) fail(`ADMIN_EMAIL выглядит некорректно: ${email}`);
if (rawRole && rawRole !== "ADMIN" && rawRole !== "EDITOR") fail("ADMIN_ROLE — только ADMIN или EDITOR");
if (password.length < PASSWORD_LIMITS.min) fail(`Пароль короче ${PASSWORD_LIMITS.min} символов — так проще перебрать`);
if (password.length > PASSWORD_LIMITS.max) fail(`Пароль длиннее ${PASSWORD_LIMITS.max} символов`);

const role = rawRole === "ADMIN" || rawRole === "EDITOR" ? rawRole : null;

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

try {
  const existing = await prisma.adminUser.findUnique({ where: { email } });

  if (existing && !shouldUpdate) {
    fail(`Пользователь ${email} уже существует. Сменить пароль: добавьте -- --update`);
  }

  const passwordHash = await hashPassword(password);

  if (existing) {
    // `--update` не затирает то, что не передали: имя и роль меняются только явно,
    // а `isActive` включаем — сброс пароля заодно возвращает доступ уволенному сотруднику.
    await prisma.adminUser.update({
      where: { id: existing.id },
      data: {
        passwordHash,
        isActive: true,
        ...(name ? { name } : {}),
        ...(role ? { role } : {}),
      },
    });
    const revoked = await revokeAllAdminSessions(prisma, existing.id);
    console.log(`✓ Пароль обновлён: ${email} (роль ${role ?? existing.role}), отозвано сессий: ${revoked}`);
  } else {
    await prisma.adminUser.create({ data: { email, passwordHash, name, role: role ?? "EDITOR" } });
    console.log(`✓ Администратор создан: ${email} (роль ${role ?? "EDITOR"})`);
  }
} finally {
  await prisma.$disconnect();
}
