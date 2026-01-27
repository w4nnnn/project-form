import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getUsers } from "@/lib/actions/users";
import { getSubRoles } from "@/lib/actions/sub-roles";
import { UsersClient } from "./users-client";

export default async function UsersPage() {
  const session = await auth();

  if (!session || session.user.role !== "superadmin") {
    redirect("/dashboard");
  }

  const [users, subRoles] = await Promise.all([getUsers(), getSubRoles()]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Kelola User</h1>
        <p className="text-muted-foreground">
          Tambah, edit, atau hapus user sistem
        </p>
      </div>

      <UsersClient users={users} subRoles={subRoles} />
    </div>
  );
}
