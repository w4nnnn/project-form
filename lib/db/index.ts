import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import path from "path";

// Resolve DB file location from env (fallback to ./data.db)
const dbUrl = process.env.DB_URL!;
const resolvedPath = dbUrl.startsWith("file:")
	? dbUrl.replace("file:", "")
	: path.isAbsolute(dbUrl)
		? dbUrl
		: path.join(process.cwd(), dbUrl);

const sqlite = new Database(resolvedPath);
export const db = drizzle(sqlite, { schema });

// Export schema for use elsewhere
export * from "./schema";
