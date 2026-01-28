import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getFormById } from "@/lib/actions/forms";
import { FormFiller } from "./form-filler";

type FormDetail = NonNullable<Awaited<ReturnType<typeof getFormById>>>;

interface FillFormPageProps {
  params: Promise<{ formId: string }>;
}

export default async function FillFormPage({ params }: FillFormPageProps) {
  const session = await auth();
  const { formId } = await params;

  if (!session || session.user.role !== "teknisi") {
    redirect("/dashboard");
  }

  const form = await getFormById(formId);

  if (!form || !form.isActive) {
    redirect("/my-forms");
  }

  // Check if form is for this teknisi's sub-role
  if (form.subRoleId && form.subRoleId !== session.user.subRoleId) {
    redirect("/my-forms");
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{form.title}</h1>
        {form.description && (
          <p className="text-muted-foreground mt-1">{form.description}</p>
        )}
      </div>

      <FormFiller form={form as FormDetail} />
    </div>
  );
}
