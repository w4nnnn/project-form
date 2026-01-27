"use server";

import { db } from "@/lib/db";
import { forms, questions, responses, answers, QuestionType } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { eq, and, desc } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const questionSchema = z.object({
  type: z.enum([
    "short_text",
    "paragraph",
    "multiple_choice",
    "checkboxes",
    "dropdown",
    "date",
    "time",
    "file_upload",
    "linear_scale",
    "rating",
  ]),
  label: z.string().min(1, "Label pertanyaan diperlukan"),
  description: z.string().optional(),
  options: z.array(z.string()).optional(),
  required: z.boolean().default(false),
  order: z.number(),
  scaleMin: z.number().optional(),
  scaleMax: z.number().optional(),
  scaleMinLabel: z.string().optional(),
  scaleMaxLabel: z.string().optional(),
  ratingMax: z.number().optional(),
});

const formSchema = z.object({
  title: z.string().min(1, "Judul form diperlukan"),
  description: z.string().optional(),
  subRoleId: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
  questions: z.array(questionSchema),
});

export async function getForms() {
  const session = await auth();
  if (!session) {
    throw new Error("Unauthorized");
  }

  const role = session.user.role;

  if (role === "superadmin") {
    return await db.query.forms.findMany({
      with: {
        subRole: true,
        createdBy: {
          columns: {
            id: true,
            name: true,
            email: true,
          },
        },
        questions: true,
      },
      orderBy: [desc(forms.createdAt)],
    });
  }

  if (role === "admin") {
    return await db.query.forms.findMany({
      where: eq(forms.createdById, session.user.id),
      with: {
        subRole: true,
        createdBy: {
          columns: {
            id: true,
            name: true,
            email: true,
          },
        },
        questions: true,
      },
      orderBy: [desc(forms.createdAt)],
    });
  }

  throw new Error("Unauthorized");
}

export async function getFormById(id: string) {
  const session = await auth();
  if (!session) {
    throw new Error("Unauthorized");
  }

  const form = await db.query.forms.findFirst({
    where: eq(forms.id, id),
    with: {
      subRole: true,
      createdBy: {
        columns: {
          id: true,
          name: true,
          email: true,
        },
      },
      questions: {
        orderBy: (questions, { asc }) => [asc(questions.order)],
      },
    },
  });

  if (!form) {
    throw new Error("Form tidak ditemukan");
  }

  // Check access
  const role = session.user.role;
  if (role === "admin" && form.createdById !== session.user.id) {
    throw new Error("Unauthorized");
  }

  if (role === "teknisi" && form.subRoleId !== session.user.subRoleId) {
    throw new Error("Form tidak tersedia untuk Anda");
  }

  return form;
}

export async function createForm(data: z.infer<typeof formSchema>) {
  const session = await auth();
  if (!session || (session.user.role !== "superadmin" && session.user.role !== "admin")) {
    throw new Error("Unauthorized");
  }

  const validated = formSchema.parse(data);

  const formId = uuidv4();

  await db.insert(forms).values({
    id: formId,
    title: validated.title,
    description: validated.description || null,
    subRoleId: validated.subRoleId || null,
    createdById: session.user.id,
    isActive: validated.isActive,
  });

  // Insert questions
  for (const question of validated.questions) {
    await db.insert(questions).values({
      id: uuidv4(),
      formId,
      type: question.type,
      label: question.label,
      description: question.description || null,
      options: question.options || null,
      required: question.required,
      order: question.order,
      scaleMin: question.scaleMin,
      scaleMax: question.scaleMax,
      scaleMinLabel: question.scaleMinLabel,
      scaleMaxLabel: question.scaleMaxLabel,
      ratingMax: question.ratingMax,
    });
  }

  revalidatePath("/forms");
  revalidatePath("/admin/forms");
  return { success: true, formId };
}

export async function updateForm(id: string, data: z.infer<typeof formSchema>) {
  const session = await auth();
  if (!session || (session.user.role !== "superadmin" && session.user.role !== "admin")) {
    throw new Error("Unauthorized");
  }

  const form = await db.query.forms.findFirst({
    where: eq(forms.id, id),
  });

  if (!form) {
    throw new Error("Form tidak ditemukan");
  }

  if (session.user.role === "admin" && form.createdById !== session.user.id) {
    throw new Error("Unauthorized");
  }

  const validated = formSchema.parse(data);

  await db.update(forms).set({
    title: validated.title,
    description: validated.description || null,
    subRoleId: validated.subRoleId || null,
    isActive: validated.isActive,
    updatedAt: new Date(),
  }).where(eq(forms.id, id));

  // Delete existing questions and insert new ones
  await db.delete(questions).where(eq(questions.formId, id));

  for (const question of validated.questions) {
    await db.insert(questions).values({
      id: uuidv4(),
      formId: id,
      type: question.type,
      label: question.label,
      description: question.description || null,
      options: question.options || null,
      required: question.required,
      order: question.order,
      scaleMin: question.scaleMin,
      scaleMax: question.scaleMax,
      scaleMinLabel: question.scaleMinLabel,
      scaleMaxLabel: question.scaleMaxLabel,
      ratingMax: question.ratingMax,
    });
  }

  revalidatePath("/forms");
  revalidatePath(`/forms/${id}`);
  revalidatePath("/admin/forms");
  return { success: true };
}

export async function deleteForm(id: string) {
  const session = await auth();
  if (!session || (session.user.role !== "superadmin" && session.user.role !== "admin")) {
    throw new Error("Unauthorized");
  }

  const form = await db.query.forms.findFirst({
    where: eq(forms.id, id),
  });

  if (!form) {
    throw new Error("Form tidak ditemukan");
  }

  if (session.user.role === "admin" && form.createdById !== session.user.id) {
    throw new Error("Unauthorized");
  }

  await db.delete(forms).where(eq(forms.id, id));

  revalidatePath("/forms");
  revalidatePath("/admin/forms");
  return { success: true };
}

export async function toggleFormStatus(id: string) {
  const session = await auth();
  if (!session || (session.user.role !== "superadmin" && session.user.role !== "admin")) {
    throw new Error("Unauthorized");
  }

  const form = await db.query.forms.findFirst({
    where: eq(forms.id, id),
  });

  if (!form) {
    throw new Error("Form tidak ditemukan");
  }

  if (session.user.role === "admin" && form.createdById !== session.user.id) {
    throw new Error("Unauthorized");
  }

  await db.update(forms).set({
    isActive: !form.isActive,
    updatedAt: new Date(),
  }).where(eq(forms.id, id));

  revalidatePath("/forms");
  revalidatePath("/admin/forms");
  return { success: true };
}

// Get forms available for teknisi
export async function getMyForms() {
  const session = await auth();
  if (!session || session.user.role !== "teknisi") {
    throw new Error("Unauthorized");
  }

  if (!session.user.subRoleId) {
    return [];
  }

  return await db.query.forms.findMany({
    where: and(
      eq(forms.subRoleId, session.user.subRoleId),
      eq(forms.isActive, true)
    ),
    with: {
      questions: {
        orderBy: (questions, { asc }) => [asc(questions.order)],
      },
    },
    orderBy: [desc(forms.createdAt)],
  });
}
