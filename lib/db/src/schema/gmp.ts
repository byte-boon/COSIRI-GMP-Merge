import { pgTable, text, serial, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const gmpAssessments = pgTable("gmp_assessments", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id"),
  auditId: text("audit_id").notNull(),
  scope: text("scope").notNull(),
  status: text("status").notNull().default("in_progress"),
  overallScore: integer("overall_score").notNull().default(0),
  startDate: text("start_date"),
  responses: jsonb("responses").notNull().default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const gmpFindings = pgTable("gmp_findings", {
  id: serial("id").primaryKey(),
  assessmentId: integer("assessment_id").notNull(),
  itemId: text("item_id").notNull(),
  type: text("type").notNull().default("noncompliance"),
  severity: text("severity").notNull(),
  description: text("description").notNull(),
  status: text("status").notNull().default("open"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertGmpAssessmentSchema = createInsertSchema(gmpAssessments).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertGmpAssessment = z.infer<typeof insertGmpAssessmentSchema>;
export type GmpAssessment = typeof gmpAssessments.$inferSelect;

export const insertGmpFindingSchema = createInsertSchema(gmpFindings).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertGmpFinding = z.infer<typeof insertGmpFindingSchema>;
export type GmpFinding = typeof gmpFindings.$inferSelect;
