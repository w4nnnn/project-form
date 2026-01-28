import { config } from "dotenv";

config({ path: ".env.local" });

import type { Config } from "drizzle-kit";

const dbUrl = process.env.DB_URL;

if (!dbUrl) {
  throw new Error("DB_URL is required. Set it in your environment or .env.local");
}

export default {
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: dbUrl,
  },
} satisfies Config;
