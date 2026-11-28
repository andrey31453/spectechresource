import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const release = readFileSync(new URL("../deploy/release.sh", import.meta.url), "utf8");
const workflow = readFileSync(new URL("../.github/workflows/production-deploy.yml", import.meta.url), "utf8");

describe("production deployment safeguards", () => {
  it("backs up the database before applying pending migrations", () => {
    expect(release).toContain("set -euo pipefail");
    expect(release.indexOf("pg_dump -Fc")).toBeGreaterThan(-1);
    expect(release.indexOf("pg_dump -Fc")).toBeLessThan(release.indexOf("prisma migrate deploy"));
  });

  it("does not seed, reset, import data or initialize administrators", () => {
    expect(release).not.toMatch(/seed\.ts|fill-earthworks|init-admin|migrate reset|migrate dev|db push|import-catalog|pg_restore/);
    expect(workflow).not.toContain("ADMIN_PASSWORD_HASH");
  });

  it("deploys main serially", () => {
    expect(workflow).toContain("branches: [main]");
    expect(workflow).toContain("if: github.ref == 'refs/heads/main'");
    expect(workflow).toContain("cancel-in-progress: false");
  });
});