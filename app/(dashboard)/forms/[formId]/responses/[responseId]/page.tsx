import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getResponseById, type ResponseWithRelations } from "@/lib/actions/responses";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, FileText, Download } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface ResponseDetailPageProps {
  params: Promise<{ formId: string; responseId: string }>;
}

export default async function ResponseDetailPage({ params }: ResponseDetailPageProps) {
  const session = await auth();
  const { formId, responseId } = await params;

  if (!session || (session.user.role !== "superadmin" && session.user.role !== "admin")) {
    redirect("/dashboard");
  }

  const response = (await getResponseById(responseId)) as ResponseWithRelations | null;

  if (!response) {
    redirect(`/forms/${formId}/responses`);
  }

  const getAnswerDisplay = (question: typeof response.form.questions[0]) => {
    const answer = response.answers.find((a) => a.questionId === question.id);
    
    if (!answer) {
      return <span className="text-muted-foreground italic">Tidak dijawab</span>;
    }

    if (question.type === "file_upload" && answer.fileUrl) {
      return (
        <a
          href={answer.fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-primary hover:underline"
        >
          <FileText className="h-4 w-4" />
          Lihat File
          <Download className="h-4 w-4" />
        </a>
      );
    }

    if (question.type === "checkboxes" && answer.value) {
      try {
        const values = JSON.parse(answer.value) as string[];
        return (
          <div className="flex flex-wrap gap-1">
            {values.map((v, i) => (
              <Badge key={i} variant="secondary">{v}</Badge>
            ))}
          </div>
        );
      } catch {
        return answer.value;
      }
    }

    if (question.type === "rating" && answer.value) {
      const rating = parseInt(answer.value);
      const max = question.ratingMax || 5;
      return (
        <div className="flex items-center gap-1">
          {Array.from({ length: max }).map((_, i) => (
            <span key={i} className={i < rating ? "text-yellow-500" : "text-gray-300"}>
              ★
            </span>
          ))}
          <span className="ml-2 text-sm text-muted-foreground">
            ({rating}/{max})
          </span>
        </div>
      );
    }

    if (question.type === "linear_scale" && answer.value) {
      const value = parseInt(answer.value);
      return (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {question.scaleMinLabel || question.scaleMin}
          </span>
          <Badge variant="default">{value}</Badge>
          <span className="text-sm text-muted-foreground">
            {question.scaleMaxLabel || question.scaleMax}
          </span>
        </div>
      );
    }

    return answer.value || <span className="text-muted-foreground italic">Tidak dijawab</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/forms/${formId}/responses`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Detail Respon</h1>
          <p className="text-muted-foreground">{response.form.title}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informasi Responden</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Nama</span>
            <span className="font-medium">{response.user?.name || "-"}</span>
          </div>
          <Separator />
          <div className="flex justify-between">
            <span className="text-muted-foreground">Username</span>
            <span className="font-medium">{response.user?.email || "-"}</span>
          </div>
          <Separator />
          <div className="flex justify-between">
            <span className="text-muted-foreground">Waktu Pengisian</span>
            <span className="font-medium">
              {format(response.submittedAt, "dd MMMM yyyy, HH:mm", { locale: id })}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Jawaban</CardTitle>
          <CardDescription>
            {response.form.questions.length} pertanyaan
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {response.form.questions.map((question, index) => (
            <div key={question.id} className="space-y-2">
              <div className="flex items-start gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs">
                  {index + 1}
                </span>
                <div className="flex-1 space-y-1">
                  <p className="font-medium">
                    {question.label}
                    {question.required && (
                      <span className="text-destructive ml-1">*</span>
                    )}
                  </p>
                  {question.description && (
                    <p className="text-sm text-muted-foreground">
                      {question.description}
                    </p>
                  )}
                  <div className="mt-2 p-3 bg-muted/50 rounded-md">
                    {getAnswerDisplay(question)}
                  </div>
                </div>
              </div>
              {index < response.form.questions.length - 1 && <Separator className="mt-4" />}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
