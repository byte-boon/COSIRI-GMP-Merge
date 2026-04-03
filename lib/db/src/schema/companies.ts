import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  displayName: text("display_name"),
  username: text("username").unique(),
  industry: text("industry").notNull(),
  email: text("email").unique(),
  modules: text("modules").notNull().default("not_selected"),
  billingPlan: text("billing_plan").notNull().default("starter"),
  billingStatus: text("billing_status").notNull().default("trialing"),
  trialEndsAt: timestamp("trial_ends_at"),
  paypalSubscriptionId: text("paypal_subscription_id"),
  paypalCustomerId: text("paypal_customer_id"),
  passwordHash: text("password_hash"),
  sessionToken: text("session_token"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertCompanySchema = createInsertSchema(companies).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type Company = typeof companies.$inferSelect;
