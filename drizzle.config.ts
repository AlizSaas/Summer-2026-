import type { Config } from "drizzle-kit";
import { config as dotenvConfig } from "dotenv";

dotenvConfig({ path: ".env" });

const config: Config = {
  out: "./src/db/drizzle-out",
  dialect: "sqlite",
  driver: "d1-http",
  schema: ["./src/db/drizzle-out/schema.ts",],
  dbCredentials: {
    accountId: process.env.CF_ACCOUNT_ID!,
    databaseId: process.env.CF_D1DATASET_ID!,
    token: process.env.CF_TOKEN!,
  },
  tablesFilter: ["!_cf_KV"], // Exclude Cloudflare internal tables
};

export default config satisfies Config;
