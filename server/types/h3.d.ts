import type { AdminIdentity } from "../utils/auth";

declare module "h3" {
  interface H3EventContext {
    /** Заполняется `server/middleware/admin-auth.ts` для запросов с валидной сессией. */
    admin?: AdminIdentity;
  }
}
