"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
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
import { Plus, Pencil, Trash2, Loader2, Users } from "lucide-react";
import { createSubRole, updateSubRole, deleteSubRole } from "@/lib/actions/sub-roles";
import type { SubRole } from "@/lib/db/schema";

const subRoleSchema = z.object({
  name: z.string().min(1, "Nama diperlukan"),
  description: z.string().optional(),
});

type SubRoleFormValues = z.infer<typeof subRoleSchema>;

interface SubRolesClientProps {
  subRoles: (SubRole & { userCount: number })[];
}

export function SubRolesClient({ subRoles }: SubRolesClientProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingSubRole, setEditingSubRole] = useState<SubRole | null>(null);
  const [deletingSubRole, setDeletingSubRole] = useState<SubRole & { userCount: number } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<SubRoleFormValues>({
    resolver: zodResolver(subRoleSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const resetForm = () => {
    form.reset({
      name: "",
      description: "",
    });
  };

  const handleCreate = async (data: SubRoleFormValues) => {
    setIsLoading(true);
    try {
      await createSubRole(data);
      toast.success("Sub-role berhasil dibuat");
      setIsCreateOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message || "Gagal membuat sub-role");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = async (data: SubRoleFormValues) => {
    if (!editingSubRole) return;
    setIsLoading(true);
    try {
      await updateSubRole(editingSubRole.id, data);
      toast.success("Sub-role berhasil diupdate");
      setEditingSubRole(null);
      resetForm();
    } catch (error: any) {
      toast.error(error.message || "Gagal mengupdate sub-role");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingSubRole) return;
    setIsLoading(true);
    try {
      await deleteSubRole(deletingSubRole.id);
      toast.success("Sub-role berhasil dihapus");
      setDeletingSubRole(null);
    } catch (error: any) {
      toast.error(error.message || "Gagal menghapus sub-role");
    } finally {
      setIsLoading(false);
    }
  };

  const openEditDialog = (subRole: SubRole) => {
    form.reset({
      name: subRole.name,
      description: subRole.description || "",
    });
    setEditingSubRole(subRole);
  };

  return (
    <>
      <div className="flex justify-end">
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Tambah Sub-Role
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tambah Sub-Role Baru</DialogTitle>
              <DialogDescription>
                Buat jenis teknisi baru untuk sistem
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleCreate)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama</FormLabel>
                      <FormControl>
                        <Input placeholder="Contoh: Teknisi Mesin" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Deskripsi (Opsional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Deskripsi singkat tentang jenis teknisi ini"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Simpan
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>Deskripsi</TableHead>
              <TableHead>Jumlah User</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subRoles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  Belum ada sub-role
                </TableCell>
              </TableRow>
            ) : (
              subRoles.map((subRole) => (
                <TableRow key={subRole.id}>
                  <TableCell className="font-medium">{subRole.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {subRole.description || "-"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="gap-1">
                      <Users className="h-3 w-3" />
                      {subRole.userCount}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(subRole)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeletingSubRole(subRole)}
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

      {/* Edit Dialog */}
      <Dialog open={!!editingSubRole} onOpenChange={(open) => !open && setEditingSubRole(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Sub-Role</DialogTitle>
            <DialogDescription>Ubah data sub-role</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleEdit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama</FormLabel>
                    <FormControl>
                      <Input placeholder="Contoh: Teknisi Mesin" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deskripsi (Opsional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Deskripsi singkat tentang jenis teknisi ini"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Update
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingSubRole} onOpenChange={(open) => !open && setDeletingSubRole(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Sub-Role?</AlertDialogTitle>
            <AlertDialogDescription>
              {deletingSubRole?.userCount && deletingSubRole.userCount > 0 ? (
                <>
                  Tidak dapat menghapus sub-role &quot;{deletingSubRole?.name}&quot; karena 
                  masih ada {deletingSubRole.userCount} user yang menggunakan sub-role ini.
                </>
              ) : (
                <>
                  Apakah Anda yakin ingin menghapus sub-role &quot;{deletingSubRole?.name}&quot;? 
                  Tindakan ini tidak dapat dibatalkan.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            {(!deletingSubRole?.userCount || deletingSubRole.userCount === 0) && (
              <AlertDialogAction onClick={handleDelete} disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Hapus
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
