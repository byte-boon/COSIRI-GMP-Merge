import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";

export const cosiriImprovementPlans = pgTable("cosiri_improvement_plans", {
  id: serial("id").primaryKey(),
  assessmentId: integer("assessment_id").notNull(),
  companyName: text("company_name").notNull(),
  industry: text("industry").notNull(),
  overallScore: integer("overall_score").notNull().default(0),
  targetBand: integer("target_band").notNull().default(3),
  planJson: text("plan_json"),
  status: text("status").notNull().default("pending"),
  model: text("model"),
  tokensUsed: integer("tokens_used").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type CosiriImprovementPlan = typeof cosiriImprovementPlans.$inferSelect;
