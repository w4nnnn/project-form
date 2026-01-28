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
    <div className="space-y-8 animate-fade-in">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Riwayat Pengisian</h1>
        <p className="text-muted-foreground/80">
          Form yang sudah Anda isi
        </p>
      </div>

      <Card>
        <CardHeader className="border-b border-border/50">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <History className="h-4 w-4 text-primary" />
            </div>
            <span>{responses.length} Pengisian</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
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
                  <TableCell colSpan={4} className="text-center py-16 text-muted-foreground">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center">
                        <History className="h-6 w-6 text-muted-foreground/50" />
                      </div>
                      <p>Belum ada pengisian form</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                responses.map((response, index) => (
                  <TableRow key={response.id} className="group">
                    <TableCell className="font-medium text-muted-foreground">{index + 1}</TableCell>
                    <TableCell className="font-medium">
                      {response.form?.title || "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(response.submittedAt, "dd MMM yyyy HH:mm", {
                        locale: id,
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon-sm" asChild className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary/10 hover:text-primary">
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
        </CardContent>
      </Card>
    </div>
  );
}
