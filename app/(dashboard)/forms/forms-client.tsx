"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
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
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, Eye, BarChart2, Loader2 } from "lucide-react";
import { deleteForm, toggleFormStatus } from "@/lib/actions/forms";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import type { Form, SubRole, Question } from "@/lib/db/schema";

interface FormsClientProps {
  forms: (Form & { 
    subRole: SubRole | null; 
    questions: Question[];
    responseCount: number;
    createdBy: { id: string; name: string | null; email: string | null } | null;
  })[];
  subRoles: (SubRole & { userCount: number })[];
}

export function FormsClient({ forms, subRoles }: FormsClientProps) {
  const [deletingForm, setDeletingForm] = useState<Form | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    if (!deletingForm) return;
    setIsLoading(true);
    try {
      await deleteForm(deletingForm.id);
      toast.success("Form berhasil dihapus");
      setDeletingForm(null);
    } catch (error: any) {
      toast.error(error.message || "Gagal menghapus form");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async (form: Form) => {
    try {
      await toggleFormStatus(form.id);
      toast.success(`Form ${form.isActive ? "dinonaktifkan" : "diaktifkan"}`);
    } catch (error: any) {
      toast.error(error.message || "Gagal mengubah status form");
    }
  };

  return (
    <>
      <div className="flex justify-end">
        <Button asChild className="shadow-sm">
          <Link href="/forms/create">
            <Plus className="mr-2 h-4 w-4" />
            Buat Form Baru
          </Link>
        </Button>
      </div>

      <div className="rounded-xl border border-border/60 bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Judul</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>Pertanyaan</TableHead>
              <TableHead>Respon</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Tanggal</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {forms.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-16 text-muted-foreground">
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center">
                      <Plus className="h-6 w-6 text-muted-foreground/50" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Belum ada form</p>
                      <p className="text-sm">Klik &quot;Buat Form Baru&quot; untuk memulai.</p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              forms.map((form) => (
                <TableRow key={form.id} className="group">
                  <TableCell className="font-medium">{form.title}</TableCell>
                  <TableCell>
                    {form.subRole ? (
                      <Badge variant="secondary">{form.subRole.name}</Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">Semua</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{form.questions.length}</span>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{form.responseCount}</span>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={form.isActive}
                      onCheckedChange={() => handleToggleStatus(form)}
                    />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(form.createdAt, "dd MMM yyyy", { locale: id })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <Button variant="ghost" size="icon-sm" asChild className="hover:bg-primary/10 hover:text-primary">
                        <Link href={`/forms/${form.id}/edit`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="icon-sm" asChild className="hover:bg-primary/10 hover:text-primary">
                        <Link href={`/forms/${form.id}/responses`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="icon-sm" asChild className="hover:bg-primary/10 hover:text-primary">
                        <Link href={`/forms/${form.id}/analytics`}>
                          <BarChart2 className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setDeletingForm(form)}
                        className="hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingForm} onOpenChange={(open) => !open && setDeletingForm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Form?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus form &quot;{deletingForm?.title}&quot;? 
              Semua pertanyaan dan respon akan ikut dihapus. Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
