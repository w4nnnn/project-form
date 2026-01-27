"use server";

import { db } from "@/lib/db";
import { subRoles, users } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { eq, count } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const subRoleSchema = z.object({
  name: z.string().min(1, "Nama diperlukan"),
  description: z.string().optional(),
});

export async function getSubRoles() {
  const session = await auth();
  if (!session) {
    throw new Error("Unauthorized");
  }

  const allSubRoles = await db.query.subRoles.findMany({
    orderBy: (subRoles, { asc }) => [asc(subRoles.name)],
  });

  // Get user count for each sub-role
  const subRolesWithCount = await Promise.all(
    allSubRoles.map(async (subRole) => {
      const [userCount] = await db
        .select({ count: count() })
        .from(users)
        .where(eq(users.subRoleId, subRole.id));
      return {
        ...subRole,
        userCount: userCount.count,
      };
    })
  );

  return subRolesWithCount;
}

export async function createSubRole(data: z.infer<typeof subRoleSchema>) {
  const session = await auth();
  if (!session || session.user.role !== "superadmin") {
    throw new Error("Unauthorized");
  }

  const validated = subRoleSchema.parse(data);

  // Check if name already exists
  const existing = await db.query.subRoles.findFirst({
    where: eq(subRoles.name, validated.name),
  });

  if (existing) {
    throw new Error("Nama sub-role sudah ada");
  }

  await db.insert(subRoles).values({
    id: uuidv4(),
    name: validated.name,
    description: validated.description || null,
  });

  revalidatePath("/admin/sub-roles");
  return { success: true };
}

export async function updateSubRole(
  id: string,
  data: z.infer<typeof subRoleSchema>
) {
  const session = await auth();
  if (!session || session.user.role !== "superadmin") {
    throw new Error("Unauthorized");
  }

  const validated = subRoleSchema.parse(data);

  await db
    .update(subRoles)
    .set({
      name: validated.name,
      description: validated.description || null,
    })
    .where(eq(subRoles.id, id));

  revalidatePath("/admin/sub-roles");
  return { success: true };
}

export async function deleteSubRole(id: string) {
  const session = await auth();
  if (!session || session.user.role !== "superadmin") {
    throw new Error("Unauthorized");
  }

  // Check if any users have this sub-role
  const [userCount] = await db
    .select({ count: count() })
    .from(users)
    .where(eq(users.subRoleId, id));

  if (userCount.count > 0) {
    throw new Error(
      `Tidak dapat menghapus. Masih ada ${userCount.count} user dengan sub-role ini.`
    );
  }

  await db.delete(subRoles).where(eq(subRoles.id, id));

  revalidatePath("/admin/sub-roles");
  return { success: true };
}
