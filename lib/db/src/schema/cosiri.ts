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

export const cosiriEvidence = pgTable("cosiri_evidence", {
  id: serial("id").primaryKey(),
  assessmentId: integer("assessment_id").notNull(),
  dimensionId: text("dimension_id").notNull(),
  fileName: text("file_name").notNull(),
  fileType: text("file_type"),
  fileSize: integer("file_size"),
  objectPath: text("object_path").notNull(),
  aiSummary: text("ai_summary"),
  summaryStatus: text("summary_status").notNull().default("idle"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const cosiriSiteProfiles = pgTable("cosiri_site_profiles", {
  id: serial("id").primaryKey(),
  assessmentId: integer("assessment_id").notNull().unique(),
  siteName: text("site_name"),
  location: text("location"),
  subSector: text("sub_sector"),
  employeeCount: text("employee_count"),
  productionArea: text("production_area"),
  productsManufactured: text("products_manufactured"),
  assessorName: text("assessor_name"),
  assessorCredentials: text("assessor_credentials"),
  cosiriVersion: text("cosiri_version").default("COSIRI-24"),
  assessmentDate: text("assessment_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type CosiriAssessment = typeof cosiriAssessments.$inferSelect;
export type CosiriAnswer = typeof cosiriAnswers.$inferSelect;
export type CosiriSiteProfile = typeof cosiriSiteProfiles.$inferSelect;

export const insertCosiriSiteProfileSchema = createInsertSchema(cosiriSiteProfiles).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCosiriSiteProfile = z.infer<typeof insertCosiriSiteProfileSchema>;
