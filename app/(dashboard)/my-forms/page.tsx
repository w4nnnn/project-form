import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getMyForms } from "@/lib/actions/forms";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

export default async function MyFormsPage() {
  const session = await auth();

  if (!session || session.user.role !== "teknisi") {
    redirect("/dashboard");
  }

  const forms = await getMyForms();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Form Saya</h1>
        <p className="text-muted-foreground">
          Form yang tersedia untuk {session.user.subRoleName || "Anda"}
        </p>
      </div>

      {forms.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Tidak ada form tersedia</h3>
            <p className="text-sm text-muted-foreground">
              Belum ada form yang dibuat untuk {session.user.subRoleName || "jenis teknisi Anda"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {forms.map((form) => (
            <Card key={form.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="line-clamp-1">{form.title}</CardTitle>
                    <CardDescription className="line-clamp-2 mt-1">
                      {form.description || "Tidak ada deskripsi"}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Pertanyaan</span>
                  <Badge variant="secondary">{form.questions.length}</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Dibuat</span>
                  <span>{format(form.createdAt, "dd MMM yyyy", { locale: id })}</span>
                </div>
                <Button asChild className="w-full">
                  <Link href={`/my-forms/${form.id}`}>
                    Isi Form
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
