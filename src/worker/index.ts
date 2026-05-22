import { initDatabase } from "@/db/database";
import App from "./hono";
export  { DailySummary } from "./durable-objects/daily-summary";


export default {
  fetch(request: Request, env: ServiceBindings, ctx: ExecutionContext) {
    initDatabase(env.DB);
    return App.fetch(request, env, ctx);
  },
} satisfies ExportedHandler<ServiceBindings>;