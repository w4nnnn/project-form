import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getFormStatistics } from "@/lib/actions/responses";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Eye } from "lucide-react";
import { AnalyticsCharts } from "./analytics-charts";

interface AnalyticsPageProps {
  params: Promise<{ formId: string }>;
}

export default async function AnalyticsPage({ params }: AnalyticsPageProps) {
  const session = await auth();
  const { formId } = await params;

  if (!session || (session.user.role !== "superadmin" && session.user.role !== "admin")) {
    redirect("/dashboard");
  }

  const statistics = await getFormStatistics(formId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/forms">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Statistik Form</h1>
            <p className="text-muted-foreground">{statistics.form.title}</p>
          </div>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/forms/${formId}/responses`}>
            <Eye className="mr-2 h-4 w-4" />
            Lihat Respon
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ringkasan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-3xl font-bold">{statistics.totalResponses}</p>
              <p className="text-sm text-muted-foreground">Total Respon</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-3xl font-bold">{statistics.form.questions.length}</p>
              <p className="text-sm text-muted-foreground">Pertanyaan</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-3xl font-bold">
                {statistics.form.questions.filter((q) => q.required).length}
              </p>
              <p className="text-sm text-muted-foreground">Pertanyaan Wajib</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {statistics.totalResponses > 0 ? (
        <AnalyticsCharts questionStats={statistics.questionStats} />
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">
              Belum ada respon untuk ditampilkan statistiknya
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
