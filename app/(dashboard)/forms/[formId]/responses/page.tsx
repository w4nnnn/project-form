import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getFormResponses } from "@/lib/actions/responses";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Eye, BarChart2 } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface ResponsesPageProps {
  params: Promise<{ formId: string }>;
}

export default async function ResponsesPage({ params }: ResponsesPageProps) {
  const session = await auth();
  const { formId } = await params;

  if (!session || (session.user.role !== "superadmin" && session.user.role !== "admin")) {
    redirect("/dashboard");
  }

  const { form, responses } = await getFormResponses(formId);

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
            <h1 className="text-2xl font-bold tracking-tight">Respon Form</h1>
            <p className="text-muted-foreground">{form.title}</p>
          </div>
        </div>
        <Button asChild>
          <Link href={`/forms/${formId}/analytics`}>
            <BarChart2 className="mr-2 h-4 w-4" />
            Lihat Statistik
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {responses.length} Respon
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Waktu Pengisian</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {responses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Belum ada respon
                    </TableCell>
                  </TableRow>
                ) : (
                  responses.map((response, index) => (
                    <TableRow key={response.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="font-medium">
                        {response.user?.name || "-"}
                      </TableCell>
                      <TableCell>{response.user?.email || "-"}</TableCell>
                      <TableCell>
                        {format(response.submittedAt, "dd MMM yyyy HH:mm", {
                          locale: id,
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/forms/${formId}/responses/${response.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
