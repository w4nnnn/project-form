import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getForms } from "@/lib/actions/forms";
import { getSubRoles } from "@/lib/actions/sub-roles";
import { db } from "@/lib/db";
import { responses } from "@/lib/db/schema";
import { eq, count } from "drizzle-orm";
import { FormsClient } from "./forms-client";

type FormItem = Awaited<ReturnType<typeof getForms>>[number];

export default async function FormsPage() {
  const session = await auth();

  if (!session || (session.user.role !== "superadmin" && session.user.role !== "admin")) {
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
    <div className="space-y-8 animate-fade-in">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Kelola Form</h1>
        <p className="text-muted-foreground/80">
          Buat, edit, atau hapus form untuk teknisi
        </p>
      </div>

      <FormsClient forms={formsWithResponses} subRoles={subRoles} />
    </div>
  );
}
