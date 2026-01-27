import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

// ==================== ENUMS ====================
export const UserRole = {
  SUPERADMIN: "superadmin",
  ADMIN: "admin",
  TEKNISI: "teknisi",
} as const;

export type UserRoleType = (typeof UserRole)[keyof typeof UserRole];

export const QuestionType = {
  SHORT_TEXT: "short_text",
  PARAGRAPH: "paragraph",
  MULTIPLE_CHOICE: "multiple_choice",
  CHECKBOXES: "checkboxes",
  DROPDOWN: "dropdown",
  DATE: "date",
  TIME: "time",
  FILE_UPLOAD: "file_upload",
  LINEAR_SCALE: "linear_scale",
  RATING: "rating",
} as const;

export type QuestionTypeType = (typeof QuestionType)[keyof typeof QuestionType];

// ==================== AUTH TABLES (for Drizzle Adapter) ====================
export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "timestamp" }),
  image: text("image"),
  password: text("password"), // hashed password for credentials login
  role: text("role").$type<UserRoleType>().default("teknisi").notNull(),
  subRoleId: text("sub_role_id").references(() => subRoles.id, { onDelete: "set null" }),
  isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).defaultNow().notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).defaultNow().notNull(),
});

export const accounts = sqliteTable("accounts", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  provider: text("provider").notNull(),
  providerAccountId: text("provider_account_id").notNull(),
  refresh_token: text("refresh_token"),
  access_token: text("access_token"),
  expires_at: integer("expires_at"),
  token_type: text("token_type"),
  scope: text("scope"),
  id_token: text("id_token"),
  session_state: text("session_state"),
});

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  sessionToken: text("session_token").notNull().unique(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: integer("expires", { mode: "timestamp" }).notNull(),
});

export const verificationTokens = sqliteTable("verification_tokens", {
  identifier: text("identifier").notNull(),
  token: text("token").notNull().unique(),
  expires: integer("expires", { mode: "timestamp" }).notNull(),
});

// ==================== APPLICATION TABLES ====================

// Sub Roles for Teknisi (e.g., Teknisi Mesin, Teknisi Listrik)
export const subRoles = sqliteTable("sub_roles", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  createdAt: integer("created_at", { mode: "timestamp" }).defaultNow().notNull(),
});

// Forms
export const forms = sqliteTable("forms", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  subRoleId: text("sub_role_id").references(() => subRoles.id, { onDelete: "set null" }),
  createdById: text("created_by_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).defaultNow().notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).defaultNow().notNull(),
});

// Questions
export const questions = sqliteTable("questions", {
  id: text("id").primaryKey(),
  formId: text("form_id")
    .notNull()
    .references(() => forms.id, { onDelete: "cascade" }),
  type: text("type").$type<QuestionTypeType>().notNull(),
  label: text("label").notNull(),
  description: text("description"),
  options: text("options", { mode: "json" }).$type<string[]>(), // for multiple choice, checkboxes, dropdown
  required: integer("required", { mode: "boolean" }).default(false).notNull(),
  order: integer("order").notNull(),
  // For linear scale
  scaleMin: integer("scale_min"),
  scaleMax: integer("scale_max"),
  scaleMinLabel: text("scale_min_label"),
  scaleMaxLabel: text("scale_max_label"),
  // For rating
  ratingMax: integer("rating_max"),
  createdAt: integer("created_at", { mode: "timestamp" }).defaultNow().notNull(),
});

// Responses (form submissions)
export const responses = sqliteTable("responses", {
  id: text("id").primaryKey(),
  formId: text("form_id")
    .notNull()
    .references(() => forms.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  submittedAt: integer("submitted_at", { mode: "timestamp" }).defaultNow().notNull(),
});

// Answers
export const answers = sqliteTable("answers", {
  id: text("id").primaryKey(),
  responseId: text("response_id")
    .notNull()
    .references(() => responses.id, { onDelete: "cascade" }),
  questionId: text("question_id")
    .notNull()
    .references(() => questions.id, { onDelete: "cascade" }),
  value: text("value"), // text value for most types, JSON string for checkboxes
  fileUrl: text("file_url"), // for file upload type
});

// ==================== RELATIONS ====================
export const usersRelations = relations(users, ({ one, many }) => ({
  subRole: one(subRoles, {
    fields: [users.subRoleId],
    references: [subRoles.id],
  }),
  forms: many(forms),
  responses: many(responses),
}));

export const subRolesRelations = relations(subRoles, ({ many }) => ({
  users: many(users),
  forms: many(forms),
}));

export const formsRelations = relations(forms, ({ one, many }) => ({
  subRole: one(subRoles, {
    fields: [forms.subRoleId],
    references: [subRoles.id],
  }),
  createdBy: one(users, {
    fields: [forms.createdById],
    references: [users.id],
  }),
  questions: many(questions),
  responses: many(responses),
}));

export const questionsRelations = relations(questions, ({ one, many }) => ({
  form: one(forms, {
    fields: [questions.formId],
    references: [forms.id],
  }),
  answers: many(answers),
}));

export const responsesRelations = relations(responses, ({ one, many }) => ({
  form: one(forms, {
    fields: [responses.formId],
    references: [forms.id],
  }),
  user: one(users, {
    fields: [responses.userId],
    references: [users.id],
  }),
  answers: many(answers),
}));

export const answersRelations = relations(answers, ({ one }) => ({
  response: one(responses, {
    fields: [answers.responseId],
    references: [responses.id],
  }),
  question: one(questions, {
    fields: [answers.questionId],
    references: [questions.id],
  }),
}));

// ==================== TYPES ====================
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type SubRole = typeof subRoles.$inferSelect;
export type NewSubRole = typeof subRoles.$inferInsert;
export type Form = typeof forms.$inferSelect;
export type NewForm = typeof forms.$inferInsert;
export type Question = typeof questions.$inferSelect;
export type NewQuestion = typeof questions.$inferInsert;
export type Response = typeof responses.$inferSelect;
export type NewResponse = typeof responses.$inferInsert;
export type Answer = typeof answers.$inferSelect;
export type NewAnswer = typeof answers.$inferInsert;
