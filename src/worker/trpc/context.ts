import { getDb } from "@/db/database";

export function createContext({
  req,
  env,
  workerCtx,
  userId,
}: {
  req: Request;
  env: ServiceBindings;
  workerCtx: ExecutionContext;
  userId: string;
}) {
  return {
    req,
    env,
    workerCtx,
    db: getDb(),
    userId,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
