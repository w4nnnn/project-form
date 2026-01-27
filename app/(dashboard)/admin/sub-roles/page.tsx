import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getSubRoles } from "@/lib/actions/sub-roles";
import { SubRolesClient } from "./sub-roles-client";

export default async function SubRolesPage() {
  const session = await auth();

  if (!session || session.user.role !== "superadmin") {
    redirect("/dashboard");
  }

  const subRoles = await getSubRoles();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Kelola Sub-Role</h1>
        <p className="text-muted-foreground">
          Kelola jenis-jenis teknisi yang ada di sistem
        </p>
      </div>

      <SubRolesClient subRoles={subRoles} />
    </div>
  );
}
