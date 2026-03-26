import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const cosiriAssessments = pgTable("cosiri_assessments", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id"),
  companyName: text("company_name").notNull(),
  industry: text("industry").notNull(),
  status: text("status").notNull().default("draft"),
  overallScore: integer("overall_score").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const cosiriAnswers = pgTable("cosiri_answers", {
  id: serial("id").primaryKey(),
  assessmentId: integer("assessment_id").notNull(),
  dimensionId: text("dimension_id").notNull(),
  score: integer("score").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const cosiriAiInsights = pgTable("cosiri_ai_insights", {
  id: serial("id").primaryKey(),
  assessmentId: integer("assessment_id").notNull(),
  type: text("type").notNull(),
  content: text("content").notNull(),
  status: text("status").notNull().default("pending"),
  version: integer("version").notNull().default(1),
  model: text("model"),
  tokensUsed: integer("tokens_used").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const cosiriUsageCounters = pgTable("cosiri_usage_counters", {
  id: serial("id").primaryKey(),
  date: text("date").notNull(),
  metric: text("metric").notNull(),
  count: integer("count").notNull().default(0),
  tokensUsed: integer("tokens_used").notNull().default(0),
});

export const insertCosiriAssessmentSchema = createInsertSchema(cosiriAssessments).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCosiriAssessment = z.infer<typeof insertCosiriAssessmentSchema>;
export type CosiriAssessment = typeof cosiriAssessments.$inferSelect;

export const insertCosiriAnswerSchema = createInsertSchema(cosiriAnswers).omit({ id: true, createdAt: true });
export type InsertCosiriAnswer = z.infer<typeof insertCosiriAnswerSchema>;
export type CosiriAnswer = typeof cosiriAnswers.$inferSelect;

export const insertCosiriAiInsightSchema = createInsertSchema(cosiriAiInsights).omit({ id: true, createdAt: true });
export type InsertCosiriAiInsight = z.infer<typeof insertCosiriAiInsightSchema>;
export type CosiriAiInsight = typeof cosiriAiInsights.$inferSelect;
