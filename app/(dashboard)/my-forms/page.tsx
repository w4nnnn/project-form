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
    <div className="space-y-8 animate-fade-in">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Form Saya</h1>
        <p className="text-muted-foreground/80">
          Form yang tersedia untuk <span className="font-medium text-foreground">{session.user.subRoleName || "Anda"}</span>
        </p>
      </div>

      {forms.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
              <ClipboardList className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <h3 className="text-lg font-semibold">Tidak ada form tersedia</h3>
            <p className="text-sm text-muted-foreground/80 text-center max-w-sm mt-1">
              Belum ada form yang dibuat untuk {session.user.subRoleName || "jenis teknisi Anda"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {forms.map((form, index) => (
            <Card key={form.id} className="group hover-lift" style={{ animationDelay: `${index * 50}ms` }}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="line-clamp-1 text-lg">{form.title}</CardTitle>
                    <CardDescription className="line-clamp-2">
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
                  <span className="font-medium">{format(form.createdAt, "dd MMM yyyy", { locale: id })}</span>
                </div>
                <Button asChild className="w-full group-hover:shadow-md transition-shadow">
                  <Link href={`/my-forms/${form.id}`}>
                    Isi Form
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
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
