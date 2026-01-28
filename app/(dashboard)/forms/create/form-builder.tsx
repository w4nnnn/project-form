"use client";

import { useState } from "react";
import {
  DndContext,
  closestCenter,
  type DragEndEvent,
  type DraggableAttributes,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Loader2,
  Save,
  Type,
  AlignLeft,
  List,
  CheckSquare,
  ChevronDownSquare,
  Calendar,
  Clock,
  Upload,
  Sliders,
  Star,
  X,
  GripVertical,
} from "lucide-react";
import { createForm, updateForm } from "@/lib/actions/forms";
import type { SubRole, Form as FormType, Question } from "@/lib/db/schema";

const questionTypes = [
  { value: "short_text", label: "Teks Pendek", icon: Type },
  { value: "paragraph", label: "Paragraf", icon: AlignLeft },
  { value: "multiple_choice", label: "Pilihan Ganda", icon: List },
  { value: "checkboxes", label: "Kotak Centang", icon: CheckSquare },
  { value: "dropdown", label: "Dropdown", icon: ChevronDownSquare },
  { value: "date", label: "Tanggal", icon: Calendar },
  { value: "time", label: "Waktu", icon: Clock },
  { value: "datetime", label: "Tanggal & Waktu", icon: Calendar },
  { value: "file_upload", label: "Upload File", icon: Upload },
  { value: "linear_scale", label: "Skala Linear", icon: Sliders },
  { value: "rating", label: "Rating", icon: Star },
] as const;

const questionSchema = z.object({
  type: z.enum([
    "short_text",
    "paragraph",
    "multiple_choice",
    "checkboxes",
    "dropdown",
    "date",
    "time",
    "datetime",
    "file_upload",
    "linear_scale",
    "rating",
  ]),
  label: z.string().min(1, "Label pertanyaan diperlukan"),
  description: z.string().optional(),
  options: z.array(z.string()).optional(),
  required: z.boolean(),
  scaleMin: z.number().optional(),
  scaleMax: z.number().optional(),
  scaleMinLabel: z.string().optional(),
  scaleMaxLabel: z.string().optional(),
  ratingMax: z.number().optional(),
});

const formSchema = z.object({
  title: z.string().min(1, "Judul form diperlukan"),
  description: z.string().optional(),
  subRoleId: z.string().optional(),
  isActive: z.boolean(),
  questions: z.array(questionSchema).min(1, "Minimal 1 pertanyaan diperlukan"),
});

type FormValues = z.infer<typeof formSchema>;

interface FormBuilderProps {
  subRoles: (SubRole & { userCount: number })[];
  initialData?: FormType & { questions: Question[] };
}

export function FormBuilder({ subRoles, initialData }: FormBuilderProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData
      ? {
        title: initialData.title,
        description: initialData.description || "",
        subRoleId: initialData.subRoleId || "all",
        isActive: initialData.isActive,
        questions: initialData.questions.map((q) => ({
          type: q.type,
          label: q.label,
          description: q.description || "",
          options: q.options || [],
          required: q.required,
          scaleMin: q.scaleMin || undefined,
          scaleMax: q.scaleMax || undefined,
          scaleMinLabel: q.scaleMinLabel || undefined,
          scaleMaxLabel: q.scaleMaxLabel || undefined,
          ratingMax: q.ratingMax || undefined,
        })),
      }
      : {
        title: "",
        description: "",
        subRoleId: "all",
        isActive: true,
        questions: [
          {
            type: "short_text",
            label: "",
            description: "",
            options: [],
            required: false,
          },
        ],
      },
  });

  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: "questions",
  });

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    try {
      const payload = {
        ...data,
        subRoleId: data.subRoleId === "all" ? null : data.subRoleId || null,
        questions: data.questions.map((q, index) => ({
          ...q,
          order: index,
        })),
      };

      if (initialData) {
        await updateForm(initialData.id, payload);
        toast.success("Form berhasil diupdate");
      } else {
        await createForm(payload);
        toast.success("Form berhasil dibuat");
      }
      router.push("/forms");
    } catch (error: any) {
      toast.error(error.message || "Gagal menyimpan form");
    } finally {
      setIsLoading(false);
    }
  };

  const addQuestion = (type: string) => {
    const defaultValues: Partial<FormValues["questions"][0]> = {
      type: type as any,
      label: "",
      description: "",
      required: false,
    };

    if (["multiple_choice", "checkboxes", "dropdown"].includes(type)) {
      defaultValues.options = ["Opsi 1"];
    }

    if (type === "linear_scale") {
      defaultValues.scaleMin = 1;
      defaultValues.scaleMax = 5;
      defaultValues.scaleMinLabel = "";
      defaultValues.scaleMaxLabel = "";
    }

    if (type === "rating") {
      defaultValues.ratingMax = 5;
    }

    append(defaultValues as FormValues["questions"][0]);
  };

  const moveQuestion = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex >= 0 && newIndex < fields.length) {
      move(index, newIndex);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = fields.findIndex((field) => field.id === active.id);
    const newIndex = fields.findIndex((field) => field.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      move(oldIndex, newIndex);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Form Settings */}
        <Card className="border-0 shadow-sm bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-medium tracking-tight">Pengaturan Form</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-foreground/80">Judul Form</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Contoh: Checklist Harian Mesin" 
                      className="h-11 bg-background/50 border-muted-foreground/20 focus:border-primary/50 transition-colors"
                      {...field} 
                    />
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
                  <FormLabel className="text-sm font-medium text-foreground/80">Deskripsi (Opsional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Deskripsi singkat tentang form ini"
                      className="min-h-[100px] bg-background/50 border-muted-foreground/20 focus:border-primary/50 transition-colors resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="subRoleId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-foreground/80">Target Teknisi</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-11 bg-background/50 border-muted-foreground/20">
                          <SelectValue placeholder="Semua teknisi" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="all">Semua teknisi</SelectItem>
                        {subRoles.map((sr) => (
                          <SelectItem key={sr.id} value={sr.id}>
                            {sr.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription className="text-xs text-muted-foreground/70">
                      Pilih jenis teknisi yang dapat mengisi form ini
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-xl border border-muted-foreground/10 bg-muted/30 p-4 transition-colors hover:bg-muted/50">
                    <div className="space-y-1">
                      <FormLabel className="text-sm font-medium">Status Aktif</FormLabel>
                      <FormDescription className="text-xs text-muted-foreground/70">
                        Form aktif dapat diisi oleh teknisi
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Questions */}
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-medium tracking-tight">Pertanyaan</h2>
            <span className="text-sm text-muted-foreground/70 bg-muted/50 px-3 py-1 rounded-full">
              {fields.length} pertanyaan
            </span>
          </div>

          <DndContext
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={fields.map((field) => field.id)}
              strategy={verticalListSortingStrategy}
            >
              {fields.map((field, index) => (
                <SortableQuestionCard
                  key={field.id}
                  id={field.id}
                  index={index}
                  form={form}
                  onRemove={() => remove(index)}
                  onMoveUp={() => moveQuestion(index, "up")}
                  onMoveDown={() => moveQuestion(index, "down")}
                  canMoveUp={index > 0}
                  canMoveDown={index < fields.length - 1}
                  canRemove={fields.length > 1}
                />
              ))}
            </SortableContext>
          </DndContext>

          {/* Add Question */}
          <Card className="border border-dashed border-muted-foreground/20 bg-muted/20 hover:bg-muted/30 transition-colors">
            <CardContent className="py-8">
              <div className="text-center space-y-5">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground/70">
                    Tambah pertanyaan baru
                  </p>
                  <p className="text-xs text-muted-foreground/60">
                    Pilih tipe pertanyaan yang ingin ditambahkan
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-2 max-w-2xl mx-auto">
                  {questionTypes.map((qt) => (
                    <Button
                      key={qt.value}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addQuestion(qt.value)}
                      className="h-9 bg-background/60 border-muted-foreground/15 hover:bg-background hover:border-primary/30 hover:text-primary transition-all"
                    >
                      <qt.icon className="mr-2 h-3.5 w-3.5" />
                      {qt.label}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push("/forms")}
            className="px-6 text-muted-foreground hover:text-foreground"
          >
            Batal
          </Button>
          <Button 
            type="submit" 
            disabled={isLoading}
            className="px-6 shadow-sm hover:shadow-md transition-shadow"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            {initialData ? "Update Form" : "Simpan Form"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

interface SortableQuestionCardProps extends QuestionCardProps {
  id: string;
}

function SortableQuestionCard({ id, ...props }: SortableQuestionCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || "transform 200ms cubic-bezier(0.25, 1, 0.5, 1)",
    opacity: isDragging ? 0.95 : 1,
    zIndex: isDragging ? 50 : 1,
    position: "relative",
  } as const;

  return (
    <div ref={setNodeRef} style={style} className="mb-4">
      <QuestionCard
        {...props}
        dragHandleAttributes={attributes}
        dragHandleListeners={listeners}
        isDragging={isDragging}
      />
    </div>
  );
}

interface QuestionCardProps {
  index: number;
  form: ReturnType<typeof useForm<FormValues>>;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  canRemove: boolean;
  dragHandleAttributes?: DraggableAttributes;
  dragHandleListeners?: ReturnType<typeof useSortable>["listeners"];
  isDragging?: boolean;
}

function QuestionCard({
  index,
  form,
  onRemove,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  canRemove,
  dragHandleAttributes,
  dragHandleListeners,
  isDragging,
}: QuestionCardProps) {
  const questionType = form.watch(`questions.${index}.type`);
  const options = form.watch(`questions.${index}.options`) || [];

  const needsOptions = ["multiple_choice", "checkboxes", "dropdown"].includes(
    questionType
  );
  const isLinearScale = questionType === "linear_scale";
  const isRating = questionType === "rating";

  const addOption = () => {
    const currentOptions = form.getValues(`questions.${index}.options`) || [];
    form.setValue(`questions.${index}.options`, [
      ...currentOptions,
      `Opsi ${currentOptions.length + 1}`,
    ]);
  };

  const removeOption = (optIndex: number) => {
    const currentOptions = form.getValues(`questions.${index}.options`) || [];
    form.setValue(
      `questions.${index}.options`,
      currentOptions.filter((_, i) => i !== optIndex)
    );
  };

  const updateOption = (optIndex: number, value: string) => {
    const currentOptions = form.getValues(`questions.${index}.options`) || [];
    const newOptions = [...currentOptions];
    newOptions[optIndex] = value;
    form.setValue(`questions.${index}.options`, newOptions);
  };

  const questionTypeInfo = questionTypes.find((qt) => qt.value === questionType);

  return (
    <Card className={`border-0 shadow-sm transition-all duration-200 ${isDragging ? "shadow-lg ring-2 ring-primary/20 scale-[1.02]" : "hover:shadow-md bg-card/80 backdrop-blur-sm"}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-xs font-medium text-primary">
              {index + 1}
            </span>
            {questionTypeInfo && (
              <span className="text-sm text-muted-foreground/80 flex items-center gap-1.5 bg-muted/50 px-2.5 py-1 rounded-md">
                <questionTypeInfo.icon className="h-3.5 w-3.5" />
                {questionTypeInfo.label}
              </span>
            )}
          </div>
          <div className="flex items-center gap-0.5">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="cursor-grab h-8 w-8 text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted/50 active:cursor-grabbing"
              aria-label="Pindah pertanyaan"
              {...(dragHandleAttributes || {})}
              {...(dragHandleListeners || {})}
            >
              <GripVertical className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onMoveUp}
              disabled={!canMoveUp}
              className="h-8 w-8 text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted/50 disabled:opacity-30"
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onMoveDown}
              disabled={!canMoveDown}
              className="h-8 w-8 text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted/50 disabled:opacity-30"
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onRemove}
              disabled={!canRemove}
              className="h-8 w-8 text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 disabled:opacity-30"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5 pt-0">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name={`questions.${index}.type`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-foreground/80">Tipe Pertanyaan</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-10 bg-background/50 border-muted-foreground/15">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {questionTypes.map((qt) => (
                      <SelectItem key={qt.value} value={qt.value}>
                        <span className="flex items-center gap-2">
                          <qt.icon className="h-3.5 w-3.5 text-muted-foreground" />
                          {qt.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name={`questions.${index}.required`}
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-xl border border-muted-foreground/10 bg-muted/20 p-3 transition-colors hover:bg-muted/30">
                <FormLabel className="text-sm font-medium text-foreground/80">Wajib Diisi</FormLabel>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name={`questions.${index}.label`}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium text-foreground/80">Pertanyaan</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Masukkan pertanyaan" 
                  className="h-10 bg-background/50 border-muted-foreground/15 focus:border-primary/40 transition-colors"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name={`questions.${index}.description`}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium text-foreground/70">Deskripsi (Opsional)</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Deskripsi tambahan untuk pertanyaan" 
                  className="h-10 bg-background/50 border-muted-foreground/15 focus:border-primary/40 transition-colors text-muted-foreground"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Options for multiple choice, checkboxes, dropdown */}
        {needsOptions && (
          <div className="space-y-3 p-4 rounded-xl bg-muted/20 border border-muted-foreground/10">
            <FormLabel className="text-sm font-medium text-foreground/80">Opsi Jawaban</FormLabel>
            <div className="space-y-2">
              {options.map((option, optIndex) => (
                <div key={optIndex} className="flex items-center gap-2 group">
                  <div className="flex items-center justify-center w-6 h-6 rounded-md bg-muted/50 text-xs text-muted-foreground font-medium">
                    {optIndex + 1}
                  </div>
                  <Input
                    value={option}
                    onChange={(e) => updateOption(optIndex, e.target.value)}
                    placeholder={`Opsi ${optIndex + 1}`}
                    className="h-9 bg-background/70 border-muted-foreground/15 focus:border-primary/40"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeOption(optIndex)}
                    disabled={options.length <= 1}
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive hover:bg-destructive/10 disabled:opacity-30"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <Button 
              type="button" 
              variant="ghost" 
              size="sm" 
              onClick={addOption}
              className="text-primary/80 hover:text-primary hover:bg-primary/10"
            >
              <Plus className="mr-2 h-4 w-4" />
              Tambah Opsi
            </Button>
          </div>
        )}

        {/* Linear Scale options */}
        {isLinearScale && (
          <div className="space-y-4 p-4 rounded-xl bg-muted/20 border border-muted-foreground/10">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name={`questions.${index}.scaleMin`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-foreground/80">Nilai Minimum</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        className="h-10 bg-background/70 border-muted-foreground/15"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`questions.${index}.scaleMax`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-foreground/80">Nilai Maximum</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        className="h-10 bg-background/70 border-muted-foreground/15"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name={`questions.${index}.scaleMinLabel`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-foreground/70">Label Minimum (Opsional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Contoh: Sangat Buruk" 
                        className="h-10 bg-background/70 border-muted-foreground/15"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`questions.${index}.scaleMaxLabel`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-foreground/70">Label Maximum (Opsional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Contoh: Sangat Baik" 
                        className="h-10 bg-background/70 border-muted-foreground/15"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        )}

        {/* Rating options */}
        {isRating && (
          <div className="p-4 rounded-xl bg-muted/20 border border-muted-foreground/10">
            <FormField
              control={form.control}
              name={`questions.${index}.ratingMax`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-foreground/80">Jumlah Bintang</FormLabel>
                  <Select
                    onValueChange={(val) => field.onChange(parseInt(val))}
                    value={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger className="h-10 bg-background/70 border-muted-foreground/15 w-40">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {[3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                        <SelectItem key={n} value={n.toString()}>
                          <span className="flex items-center gap-2">
                            <Star className="h-3.5 w-3.5 text-amber-500" />
                            {n} bintang
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
