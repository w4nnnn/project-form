import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";
import path from "path";

const dbUrl = process.env.DB_URL!;
const resolvedPath = dbUrl.startsWith("file:")
  ? dbUrl.replace("file:", "")
  : path.isAbsolute(dbUrl)
    ? dbUrl
    : path.join(process.cwd(), dbUrl);

const sqlite = new Database(resolvedPath);
const db = drizzle(sqlite, { schema });

async function seed() {
  console.log("🌱 Starting database seed...");

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
      email: "superadmin",
      password: superadminPassword,
      role: "superadmin",
      isActive: true,
    });
    console.log("✅ Superadmin created: superadmin / admin123");
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
      email: "admin",
      password: adminPassword,
      role: "admin",
      isActive: true,
    });
    console.log("✅ Admin created: admin / admin123");
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
        email: `teknisi${i + 1}`,
        password: teknisiPassword,
        role: "teknisi",
        subRoleId: subRole.id,
        isActive: true,
      });
      console.log(`✅ Teknisi created: teknisi${i + 1} / teknisi123 (${subRole.name})`);
    } catch (error) {
      console.log(`⚠️ Teknisi ${i + 1} already exists`);
    }
  }

  // Create sample forms
  console.log("📝 Creating sample forms...");

  // Get Admin ID (either freshly created or existing)
  const adminUser = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.email, "admin"),
  });

  if (adminUser) {
    // 1. Form Checklist Harian Mesin (Specific to Teknisi Mesin)
    const mesinSubRole = subRoles.find(r => r.name === "Teknisi Mesin");

    if (mesinSubRole) {
      const formId = uuidv4();
      try {
        await db.insert(schema.forms).values({
          id: formId,
          title: "Checklist Harian Mesin Genset",
          description: "Laporan pemeriksaan harian untuk unit Genset Utama",
          subRoleId: mesinSubRole.id,
          createdById: adminUser.id,
          isActive: true,
        });

        // Questions for Genset Form
        const questions = [
          {
            type: "short_text",
            label: "Nomor Unit Genset",
            description: "Masukkan nomor identifikasi unit",
            required: true,
            order: 0,
          },
          {
            type: "multiple_choice",
            label: "Kondisi Oli Mesin",
            options: ["Normal", "Kotor/Perlu Ganti", "Volume Kurang", "Bocor"],
            required: true,
            order: 1,
          },
          {
            type: "rating",
            label: "Kondisi Fisik Unit",
            description: "Berikan penilaian kondisi fisik secara umum",
            ratingMax: 5,
            required: true,
            order: 2,
          },
          {
            type: "file_upload",
            label: "Foto Unit",
            description: "Upload foto kondisi terkini unit",
            required: false,
            order: 3,
          },
        ];

        for (const q of questions) {
          await db.insert(schema.questions).values({
            id: uuidv4(),
            formId: formId,
            ...q,
          } as any);
        }
        console.log("✅ Form created: Checklist Harian Mesin Genset");
      } catch (e) {
        console.log("⚠️ Form Checklist Harian Mesin Genset might already exist");
      }
    }

    // 2. Form Laporan Insiden (General - All Technicians)
    const incidentFormId = uuidv4();
    try {
      await db.insert(schema.forms).values({
        id: incidentFormId,
        title: "Laporan Insiden Lapangan",
        description: "Form untuk melaporkan kejadian tidak terduga atau kerusakan mendadak",
        subRoleId: null, // For all technicians
        createdById: adminUser.id,
        isActive: true,
      });

      const incidentQuestions = [
        {
          type: "date",
          label: "Tanggal Kejadian",
          required: true,
          order: 0,
        },
        {
          type: "time",
          label: "Waktu Kejadian",
          required: true,
          order: 1,
        },
        {
          type: "dropdown",
          label: "Lokasi",
          options: ["Terminal 1", "Terminal 2", "Runway", "Hangar", "Parkir Area"],
          required: true,
          order: 2,
        },
        {
          type: "paragraph",
          label: "Kronologi Kejadian",
          description: "Jelaskan detail kejadian secara rinci",
          required: true,
          order: 3,
        },
        {
          type: "linear_scale",
          label: "Tingkat Urgensi",
          scaleMin: 1,
          scaleMax: 5,
          scaleMinLabel: "Rendah",
          scaleMaxLabel: "Kritis",
          required: true,
          order: 4,
        },
      ];

      for (const q of incidentQuestions) {
        await db.insert(schema.questions).values({
          id: uuidv4(),
          formId: incidentFormId,
          ...q,
        } as any);
      }
      console.log("✅ Form created: Laporan Insiden Lapangan");
    } catch (e) {
      console.log("⚠️ Form Laporan Insiden Lapangan might already exist");
    }
  }

  console.log("\n🎉 Seed completed!");
  console.log("\n📋 Login credentials:");
  console.log("   Superadmin: superadmin / admin123");
  console.log("   Admin: admin / admin123");
  console.log("   Teknisi 1: teknisi1 / teknisi123");
  console.log("   Teknisi 2: teknisi2 / teknisi123");
  console.log("   Teknisi 3: teknisi3 / teknisi123");

  sqlite.close();
}

seed().catch(console.error);
