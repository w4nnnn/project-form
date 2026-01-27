import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";
import path from "path";

const sqlite = new Database(path.join(process.cwd(), "data.db"));
const db = drizzle(sqlite, { schema });

async function seed() {
  console.log("🌱 Starting database seed...");

  // Create tables manually (since we're not using migrations for simplicity)
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT,
      email TEXT NOT NULL UNIQUE,
      email_verified INTEGER,
      image TEXT,
      password TEXT,
      role TEXT NOT NULL DEFAULT 'teknisi',
      sub_role_id TEXT REFERENCES sub_roles(id) ON DELETE SET NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      updated_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      provider TEXT NOT NULL,
      provider_account_id TEXT NOT NULL,
      refresh_token TEXT,
      access_token TEXT,
      expires_at INTEGER,
      token_type TEXT,
      scope TEXT,
      id_token TEXT,
      session_state TEXT
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      session_token TEXT NOT NULL UNIQUE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS verification_tokens (
      identifier TEXT NOT NULL,
      token TEXT NOT NULL UNIQUE,
      expires INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sub_roles (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS forms (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      sub_role_id TEXT REFERENCES sub_roles(id) ON DELETE SET NULL,
      created_by_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      updated_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS questions (
      id TEXT PRIMARY KEY,
      form_id TEXT NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      label TEXT NOT NULL,
      description TEXT,
      options TEXT,
      required INTEGER NOT NULL DEFAULT 0,
      "order" INTEGER NOT NULL,
      scale_min INTEGER,
      scale_max INTEGER,
      scale_min_label TEXT,
      scale_max_label TEXT,
      rating_max INTEGER,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS responses (
      id TEXT PRIMARY KEY,
      form_id TEXT NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      submitted_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS answers (
      id TEXT PRIMARY KEY,
      response_id TEXT NOT NULL REFERENCES responses(id) ON DELETE CASCADE,
      question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
      value TEXT,
      file_url TEXT
    );
  `);

  console.log("✅ Tables created");

  // Create sub-roles
  const subRoleData = [
    { id: uuidv4(), name: "Teknisi Mesin", description: "Teknisi yang menangani peralatan mesin dan mekanik" },
    { id: uuidv4(), name: "Teknisi Listrik", description: "Teknisi yang menangani instalasi dan peralatan listrik" },
    { id: uuidv4(), name: "Teknisi Elektronik", description: "Teknisi yang menangani peralatan elektronik dan sistem kontrol" },
    { id: uuidv4(), name: "Teknisi HVAC", description: "Teknisi yang menangani sistem pendingin dan ventilasi" },
    { id: uuidv4(), name: "Teknisi Ground Support", description: "Teknisi yang menangani peralatan ground support equipment" },
  ];

  for (const subRole of subRoleData) {
    try {
      await db.insert(schema.subRoles).values(subRole);
      console.log(`✅ Sub-role created: ${subRole.name}`);
    } catch (error) {
      console.log(`⚠️ Sub-role already exists: ${subRole.name}`);
    }
  }

  // Create superadmin user
  const superadminPassword = await bcrypt.hash("admin123", 10);
  const superadminId = uuidv4();

  try {
    await db.insert(schema.users).values({
      id: superadminId,
      name: "Super Admin",
      email: "admin@airport.com",
      password: superadminPassword,
      role: "superadmin",
      isActive: true,
    });
    console.log("✅ Superadmin created: admin@airport.com / admin123");
  } catch (error) {
    console.log("⚠️ Superadmin already exists");
  }

  // Create admin user
  const adminPassword = await bcrypt.hash("admin123", 10);
  const adminId = uuidv4();

  try {
    await db.insert(schema.users).values({
      id: adminId,
      name: "Admin",
      email: "formadmin@airport.com",
      password: adminPassword,
      role: "admin",
      isActive: true,
    });
    console.log("✅ Admin created: formadmin@airport.com / admin123");
  } catch (error) {
    console.log("⚠️ Admin already exists");
  }

  // Create sample teknisi users
  const teknisiPassword = await bcrypt.hash("teknisi123", 10);
  const subRoles = await db.query.subRoles.findMany();

  for (let i = 0; i < Math.min(3, subRoles.length); i++) {
    const subRole = subRoles[i];
    try {
      await db.insert(schema.users).values({
        id: uuidv4(),
        name: `Teknisi ${subRole.name.split(" ")[1]}`,
        email: `teknisi${i + 1}@airport.com`,
        password: teknisiPassword,
        role: "teknisi",
        subRoleId: subRole.id,
        isActive: true,
      });
      console.log(`✅ Teknisi created: teknisi${i + 1}@airport.com / teknisi123 (${subRole.name})`);
    } catch (error) {
      console.log(`⚠️ Teknisi ${i + 1} already exists`);
    }
  }

  console.log("\n🎉 Seed completed!");
  console.log("\n📋 Login credentials:");
  console.log("   Superadmin: admin@airport.com / admin123");
  console.log("   Admin: formadmin@airport.com / admin123");
  console.log("   Teknisi 1: teknisi1@airport.com / teknisi123");
  console.log("   Teknisi 2: teknisi2@airport.com / teknisi123");
  console.log("   Teknisi 3: teknisi3@airport.com / teknisi123");

  sqlite.close();
}

seed().catch(console.error);
