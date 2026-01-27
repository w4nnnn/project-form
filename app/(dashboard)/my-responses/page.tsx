import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getMyResponses } from "@/lib/actions/responses";
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
import { Eye, History } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

export default async function MyResponsesPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const responses = await getMyResponses();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Riwayat Pengisian</h1>
        <p className="text-muted-foreground">
          Form yang sudah Anda isi
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            {responses.length} Pengisian
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No</TableHead>
                  <TableHead>Form</TableHead>
                  <TableHead>Waktu Pengisian</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {responses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      Belum ada pengisian form
                    </TableCell>
                  </TableRow>
                ) : (
                  responses.map((response, index) => (
                    <TableRow key={response.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="font-medium">
                        {response.form?.title || "-"}
                      </TableCell>
                      <TableCell>
                        {format(response.submittedAt, "dd MMM yyyy HH:mm", {
                          locale: id,
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/my-responses/${response.id}`}>
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
