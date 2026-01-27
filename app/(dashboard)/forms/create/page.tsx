import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getSubRoles } from "@/lib/actions/sub-roles";
import { FormBuilder } from "./form-builder";

export default async function CreateFormPage() {
  const session = await auth();

  if (!session || (session.user.role !== "superadmin" && session.user.role !== "admin")) {
    redirect("/dashboard");
  }

  const subRoles = await getSubRoles();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Buat Form Baru</h1>
        <p className="text-muted-foreground">
          Buat form dengan berbagai jenis pertanyaan
        </p>
      </div>

      <FormBuilder subRoles={subRoles} />
    </div>
  );
}
