import "dotenv/config";
import type { Config } from "drizzle-kit";

const dbUrl = process.env.DB_URL!;

export default {
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: dbUrl,
  },
} satisfies Config;
