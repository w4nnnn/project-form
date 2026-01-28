"use server";

import { db } from "@/lib/db";
import { responses, answers, forms, questions } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { eq, and, desc, count } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { revalidatePath } from "next/cache";
import { z } from "zod";

type FormWithQuestions = (typeof forms.$inferSelect) & {
  questions: (typeof questions.$inferSelect)[];
};

export type ResponseWithRelations = (typeof responses.$inferSelect) & {
  user: {
    id: string;
    name: string | null;
    email: string | null;
  } | null;
  form: FormWithQuestions;
  answers: (typeof answers.$inferSelect)[];
};

const answerSchema = z.object({
  questionId: z.string(),
  value: z.string().optional().nullable(),
  fileUrl: z.string().optional().nullable(),
});

const submitResponseSchema = z.object({
  formId: z.string(),
  answers: z.array(answerSchema),
});

export async function submitResponse(data: z.infer<typeof submitResponseSchema>) {
  const session = await auth();
  if (!session) {
    throw new Error("Unauthorized");
  }

  const validated = submitResponseSchema.parse(data);

  // Verify form exists and is accessible
  const form = await db.query.forms.findFirst({
    where: and(
      eq(forms.id, validated.formId),
      eq(forms.isActive, true)
    ),
    with: {
      questions: true,
    },
  });

  if (!form) {
    throw new Error("Form tidak ditemukan atau tidak aktif");
  }

  // For teknisi, check if form is for their sub-role
  if (session.user.role === "teknisi") {
    if (form.subRoleId !== session.user.subRoleId) {
      throw new Error("Form tidak tersedia untuk Anda");
    }
  }

  // Validate required questions
  const requiredQuestions = form.questions.filter((q) => q.required);
  for (const question of requiredQuestions) {
    const answer = validated.answers.find((a) => a.questionId === question.id);
    if (!answer || (!answer.value && !answer.fileUrl)) {
      throw new Error(`Pertanyaan "${question.label}" wajib diisi`);
    }
  }

  // Create response
  const responseId = uuidv4();
  await db.insert(responses).values({
    id: responseId,
    formId: validated.formId,
    userId: session.user.id,
  });

  // Create answers
  for (const answer of validated.answers) {
    if (answer.value || answer.fileUrl) {
      await db.insert(answers).values({
        id: uuidv4(),
        responseId,
        questionId: answer.questionId,
        value: answer.value || null,
        fileUrl: answer.fileUrl || null,
      });
    }
  }

  revalidatePath("/my-forms");
  revalidatePath("/my-responses");
  revalidatePath(`/forms/${validated.formId}/responses`);
  return { success: true, responseId };
}

export async function getFormResponses(formId: string): Promise<{ form: FormWithQuestions; responses: ResponseWithRelations[] }> {
  const session = await auth();
  if (!session || (session.user.role !== "superadmin" && session.user.role !== "admin")) {
    throw new Error("Unauthorized");
  }

  const form = await db.query.forms.findFirst({
    where: eq(forms.id, formId),
    with: {
      questions: {
        orderBy: (questions, { asc }) => [asc(questions.order)],
      },
    },
  });

  if (!form) {
    throw new Error("Form tidak ditemukan");
  }

  if (session.user.role === "admin" && form.createdById !== session.user.id) {
    throw new Error("Unauthorized");
  }

  const formResponses = await db.query.responses.findMany({
    where: eq(responses.formId, formId),
    with: {
      user: {
        columns: {
          id: true,
          name: true,
          email: true,
        },
      },
      answers: true,
    },
    orderBy: [desc(responses.submittedAt)],
  });

  return {
    form: form as FormWithQuestions,
    responses: formResponses as ResponseWithRelations[],
  };
}

export async function getMyResponses() {
  const session = await auth();
  if (!session) {
    throw new Error("Unauthorized");
  }

  return await db.query.responses.findMany({
    where: eq(responses.userId, session.user.id),
    with: {
      form: {
        columns: {
          id: true,
          title: true,
        },
      },
      answers: true,
    },
    orderBy: [desc(responses.submittedAt)],
  });
}

export async function getResponseById(responseId: string): Promise<ResponseWithRelations | null> {
  const session = await auth();
  if (!session) {
    throw new Error("Unauthorized");
  }

  const response = await db.query.responses.findFirst({
    where: eq(responses.id, responseId),
    with: {
      user: {
        columns: {
          id: true,
          name: true,
          email: true,
        },
      },
      form: {
        with: {
          questions: {
            orderBy: (questions, { asc }) => [asc(questions.order)],
          },
        },
      },
      answers: true,
    },
  });

  if (!response) {
    throw new Error("Response tidak ditemukan");
  }

  // Check access
  if (session.user.role === "teknisi" && response.userId !== session.user.id) {
    throw new Error("Unauthorized");
  }

  if (session.user.role === "admin" && response.form.createdById !== session.user.id) {
    throw new Error("Unauthorized");
  }

  return response as ResponseWithRelations;
}

export async function getFormStatistics(formId: string) {
  const session = await auth();
  if (!session || (session.user.role !== "superadmin" && session.user.role !== "admin")) {
    throw new Error("Unauthorized");
  }

  const form = await db.query.forms.findFirst({
    where: eq(forms.id, formId),
    with: {
      questions: {
        orderBy: (questions, { asc }) => [asc(questions.order)],
      },
    },
  });

  if (!form) {
    throw new Error("Form tidak ditemukan");
  }

  if (session.user.role === "admin" && form.createdById !== session.user.id) {
    throw new Error("Unauthorized");
  }

  // Get all responses
  const formResponses = await db.query.responses.findMany({
    where: eq(responses.formId, formId),
    with: {
      answers: true,
    },
  });

  const totalResponses = formResponses.length;

  // Calculate statistics for each question
  const questionStats = form.questions.map((question) => {
    const questionAnswers = formResponses.flatMap((r) =>
      r.answers.filter((a) => a.questionId === question.id)
    );

    if (
      question.type === "multiple_choice" ||
      question.type === "dropdown" ||
      question.type === "checkboxes"
    ) {
      const optionCounts: Record<string, number> = {};
      const options = question.options || [];
      
      options.forEach((opt) => {
        optionCounts[opt] = 0;
      });

      questionAnswers.forEach((answer) => {
        if (answer.value) {
          if (question.type === "checkboxes") {
            try {
              const values = JSON.parse(answer.value) as string[];
              values.forEach((v) => {
                if (optionCounts[v] !== undefined) {
                  optionCounts[v]++;
                }
              });
            } catch {
              // Invalid JSON
            }
          } else {
            if (optionCounts[answer.value] !== undefined) {
              optionCounts[answer.value]++;
            }
          }
        }
      });

      return {
        ...question,
        stats: {
          type: "options" as const,
          data: Object.entries(optionCounts).map(([name, value]) => ({
            name,
            value,
          })),
        },
      };
    }

    if (question.type === "rating" || question.type === "linear_scale") {
      const values = questionAnswers
        .map((a) => (a.value ? parseInt(a.value, 10) : null))
        .filter((v): v is number => v !== null && !isNaN(v));

      const average = values.length > 0
        ? values.reduce((a, b) => a + b, 0) / values.length
        : 0;

      const distribution: Record<number, number> = {};
      const max = question.type === "rating" 
        ? (question.ratingMax || 5) 
        : (question.scaleMax || 10);
      const min = question.type === "linear_scale" ? (question.scaleMin || 1) : 1;

      for (let i = min; i <= max; i++) {
        distribution[i] = 0;
      }

      values.forEach((v) => {
        if (distribution[v] !== undefined) {
          distribution[v]++;
        }
      });

      return {
        ...question,
        stats: {
          type: "numeric" as const,
          average: Math.round(average * 100) / 100,
          distribution: Object.entries(distribution).map(([name, value]) => ({
            name,
            value,
          })),
        },
      };
    }

    // For text-based questions, just return answer count
    return {
      ...question,
      stats: {
        type: "text" as const,
        count: questionAnswers.length,
      },
    };
  });

  return {
    form,
    totalResponses,
    questionStats,
  };
}
