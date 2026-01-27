import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getForms } from "@/lib/actions/forms";
import { db } from "@/lib/db";
import { responses } from "@/lib/db/schema";
import { eq, count } from "drizzle-orm";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, BarChart2 } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

export default async function AdminFormsPage() {
  const session = await auth();

  if (!session || session.user.role !== "superadmin") {
    redirect("/dashboard");
  }

  const forms = await getForms();

  // Get response count for each form
  const formsWithResponses = await Promise.all(
    forms.map(async (form) => {
      const [responseCount] = await db
        .select({ count: count() })
        .from(responses)
        .where(eq(responses.formId, form.id));
      return {
        ...form,
        responseCount: responseCount.count,
      };
    })
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Semua Form</h1>
        <p className="text-muted-foreground">
          Lihat semua form yang ada di sistem
        </p>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Judul</TableHead>
              <TableHead>Dibuat Oleh</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>Pertanyaan</TableHead>
              <TableHead>Respon</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Tanggal</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {formsWithResponses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  Belum ada form
                </TableCell>
              </TableRow>
            ) : (
              formsWithResponses.map((form) => (
                <TableRow key={form.id}>
                  <TableCell className="font-medium">{form.title}</TableCell>
                  <TableCell>{form.createdBy?.name || "-"}</TableCell>
                  <TableCell>
                    {form.subRole ? (
                      <Badge variant="secondary">{form.subRole.name}</Badge>
                    ) : (
                      <span className="text-muted-foreground">Semua</span>
                    )}
                  </TableCell>
                  <TableCell>{form.questions.length}</TableCell>
                  <TableCell>{form.responseCount}</TableCell>
                  <TableCell>
                    <Badge variant={form.isActive ? "default" : "outline"}>
                      {form.isActive ? "Aktif" : "Nonaktif"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(form.createdAt, "dd MMM yyyy", { locale: id })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/forms/${form.id}/responses`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/forms/${form.id}/analytics`}>
                          <BarChart2 className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
