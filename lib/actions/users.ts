"use server";

import { db } from "@/lib/db";
import { users, subRoles } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const userSchema = z.object({
  name: z.string().min(1, "Nama diperlukan"),
  username: z.string().min(3, "Username minimal 3 karakter"),
  password: z.string().min(6, "Password minimal 6 karakter").optional(),
  role: z.enum(["superadmin", "admin", "teknisi"]),
  subRoleId: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

export async function getUsers() {
  const session = await auth();
  if (!session || session.user.role !== "superadmin") {
    throw new Error("Unauthorized");
  }

  const allUsers = await db.query.users.findMany({
    with: {
      subRole: true,
    },
    orderBy: (users, { desc }) => [desc(users.createdAt)],
  });

  return allUsers;
}

export async function createUser(data: z.infer<typeof userSchema>) {
  const session = await auth();
  if (!session || session.user.role !== "superadmin") {
    throw new Error("Unauthorized");
  }

  const validated = userSchema.parse(data);

  // Check if username already exists
  const existing = await db.query.users.findFirst({
    where: eq(users.email, validated.username),
  });

  if (existing) {
    throw new Error("Username sudah terdaftar");
  }

  if (!validated.password) {
    throw new Error("Password diperlukan untuk user baru");
  }

  const hashedPassword = await bcrypt.hash(validated.password, 10);

  await db.insert(users).values({
    id: uuidv4(),
    name: validated.name,
    email: validated.username,
    password: hashedPassword,
    role: validated.role,
    subRoleId: validated.role === "teknisi" ? validated.subRoleId : null,
    isActive: validated.isActive,
  });

  revalidatePath("/admin/users");
  return { success: true };
}

export async function updateUser(
  id: string,
  data: Partial<z.infer<typeof userSchema>>
) {
  const session = await auth();
  if (!session || session.user.role !== "superadmin") {
    throw new Error("Unauthorized");
  }

  const updateData: Record<string, unknown> = {
    name: data.name,
    email: data.username,
    role: data.role,
    subRoleId: data.role === "teknisi" ? data.subRoleId : null,
    isActive: data.isActive,
    updatedAt: new Date(),
  };

  // Only update password if provided
  if (data.password && data.password.length >= 6) {
    updateData.password = await bcrypt.hash(data.password, 10);
  }

  await db.update(users).set(updateData).where(eq(users.id, id));

  revalidatePath("/admin/users");
  return { success: true };
}

export async function deleteUser(id: string) {
  const session = await auth();
  if (!session || session.user.role !== "superadmin") {
    throw new Error("Unauthorized");
  }

  // Prevent deleting yourself
  if (id === session.user.id) {
    throw new Error("Tidak dapat menghapus akun sendiri");
  }

  await db.delete(users).where(eq(users.id, id));

  revalidatePath("/admin/users");
  return { success: true };
}

export async function toggleUserStatus(id: string) {
  const session = await auth();
  if (!session || session.user.role !== "superadmin") {
    throw new Error("Unauthorized");
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, id),
  });

  if (!user) {
    throw new Error("User tidak ditemukan");
  }

  await db
    .update(users)
    .set({ isActive: !user.isActive, updatedAt: new Date() })
    .where(eq(users.id, id));

  revalidatePath("/admin/users");
  return { success: true };
}
