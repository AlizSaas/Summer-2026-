import { Hono, type Context } from "hono";
import { createMiddleware } from "hono/factory";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@/worker/trpc/router";
import { createContext } from "@/worker/trpc/context";
import { createAuth } from "@/worker/auth";
import { handleChat } from "@/worker/ai/chat";
import { cors } from "hono/cors";

const App = new Hono<{
  Bindings: ServiceBindings;
  Variables: { userId: string; userEmail?: string };
}>();

// eslint-disable-next-line react-hooks/rules-of-hooks
App.use('*', cors({
  origin: (origin) => origin, // reflect origin back (works for any origin)
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

const authMiddleware = createMiddleware<{
  Bindings: ServiceBindings;
  Variables: { userId: string; userEmail?: string };
}>(async (c, next) => {
  const auth = createAuth(c.env);
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user) {
    return c.text("Unauthorized", 401);
  }
  c.set("userId", session.user.id);
  if (session.user.email) {
    c.set("userEmail", session.user.email);
  }
  await next();
});

type AppEnv = { Bindings: ServiceBindings; Variables: { userId: string; userEmail?: string } }

const trpcHandler = (c: Context<AppEnv>) => {
  const userId = c.get("userId");
  return fetchRequestHandler({
    endpoint: "/trpc",
    req: c.req.raw,
    router: appRouter,
    createContext: () =>
      createContext({
        req: c.req.raw,
        env: c.env,
        workerCtx: c.executionCtx as ExecutionContext,
        userId,
      }),
  });
};

App.all("/trpc/*", authMiddleware, trpcHandler);
App.all("/trpc", authMiddleware, trpcHandler);

App.on(["POST", "GET"], "/api/auth/*", (c) => {
  const auth = createAuth(c.env);
  return auth.handler(c.req.raw);
});

App.post("/api/chat", authMiddleware, (c) => handleChat(c));

App.post("/api/summary/schedule", authMiddleware, async (c) => {
  // eslint-disable-next-line no-useless-assignment
  let body: { email?: string; hour?: number } = {};
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON" }, 400);
  }

  const userId = c.get("userId");
  const id = c.env.DAILY_SUMMARY.idFromName(userId);
  const stub = c.env.DAILY_SUMMARY.get(id);

  return stub.fetch("https://daily-summary/schedule", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-user-id": userId,
    },
    body: JSON.stringify(body),
  });
});

App.post("/api/summary/cancel", authMiddleware, async (c) => {
  const userId = c.get("userId");
  const id = c.env.DAILY_SUMMARY.idFromName(userId);
  const stub = c.env.DAILY_SUMMARY.get(id);

  return stub.fetch("https://daily-summary/cancel", {
    method: "POST",
    headers: {
      "x-user-id": userId,
    },
  });
});

export default App;