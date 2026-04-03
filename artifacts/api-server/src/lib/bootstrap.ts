import bcrypt from "bcryptjs";
import { or, eq } from "drizzle-orm";
import { randomBytes } from "crypto";
import { db } from "@workspace/db";
import { companies } from "@workspace/db/schema";

const DEFAULT_ADMIN_INDUSTRY = "Platform Administration";

export async function bootstrapApp() {
  await ensureDefaultAdmin();
}

async function ensureDefaultAdmin() {
  const username = process.env.DEFAULT_ADMIN_USERNAME?.trim();
  const email = process.env.DEFAULT_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.DEFAULT_ADMIN_PASSWORD?.trim();
  const displayName = process.env.DEFAULT_ADMIN_DISPLAY_NAME?.trim() || "COSIRI Administrator";

  if (!password || (!username && !email)) {
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const sessionToken = randomBytes(32).toString("hex");
  const whereClause = username && email
    ? or(eq(companies.username, username), eq(companies.email, email))
    : username
      ? eq(companies.username, username)
      : eq(companies.email, email!);

  const [existing] = await db.select().from(companies).where(whereClause!);

  if (existing) {
    await db
      .update(companies)
      .set({
        name: displayName,
        displayName,
        username: username ?? existing.username,
        email: email ?? existing.email,
        industry: existing.industry || DEFAULT_ADMIN_INDUSTRY,
        modules: "both",
        billingPlan: "enterprise",
        billingStatus: "active",
        trialEndsAt: null,
        passwordHash,
        sessionToken: existing.sessionToken || sessionToken,
        updatedAt: new Date(),
      })
      .where(eq(companies.id, existing.id));
    return;
  }

  await db.insert(companies).values({
    name: displayName,
    displayName,
    username: username ?? email ?? "admin",
    email,
    industry: DEFAULT_ADMIN_INDUSTRY,
    modules: "both",
    billingPlan: "enterprise",
    billingStatus: "active",
    trialEndsAt: null,
    passwordHash,
    sessionToken,
  });
}
