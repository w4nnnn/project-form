import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getFormById } from "@/lib/actions/forms";
import { getSubRoles } from "@/lib/actions/sub-roles";
import { FormBuilder } from "../../create/form-builder";

interface EditFormPageProps {
  params: Promise<{ formId: string }>;
}

export default async function EditFormPage({ params }: EditFormPageProps) {
  const session = await auth();
  const { formId } = await params;

  if (!session || (session.user.role !== "superadmin" && session.user.role !== "admin")) {
    redirect("/dashboard");
  }

  const [form, subRoles] = await Promise.all([
    getFormById(formId),
    getSubRoles(),
  ]);

  if (!form) {
    redirect("/forms");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Edit Form</h1>
        <p className="text-muted-foreground">
          Edit form &quot;{form.title}&quot;
        </p>
      </div>

      <FormBuilder subRoles={subRoles} initialData={form} />
    </div>
  );
}
