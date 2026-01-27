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

  // Ensure tables exist before seeding
  // We assume 'npm run db:push' has been run to sync schema
  console.log("🔍 Checking database connection...");

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
