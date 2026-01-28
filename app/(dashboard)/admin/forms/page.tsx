import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getForms } from "@/lib/actions/forms";
import { getSubRoles } from "@/lib/actions/sub-roles";
import { db } from "@/lib/db";
import { responses } from "@/lib/db/schema";
import { eq, count } from "drizzle-orm";
import { FormsClient } from "../../forms/forms-client";

type FormItem = Awaited<ReturnType<typeof getForms>>[number];

export default async function AdminFormsPage() {
  const session = await auth();

  if (!session || session.user.role !== "superadmin") {
    redirect("/dashboard");
  }

  const [forms, subRoles] = await Promise.all([getForms(), getSubRoles()]);

  // Get response count for each form
  const formsWithResponses: (FormItem & { responseCount: number })[] = await Promise.all(
    forms.map(async (form) => {
      const [responseCount] = await db
        .select({ count: count() })
        .from(responses)
        .where(eq(responses.formId, form.id));
      return {
        ...form,
        responseCount: responseCount.count,
        createdBy: form.createdBy ?? null,
      };
    })
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Semua Form</h1>
        <p className="text-muted-foreground">
          Kelola semua form yang ada di sistem
        </p>
      </div>

      <FormsClient forms={formsWithResponses} subRoles={subRoles} />
    </div>
  );
}
