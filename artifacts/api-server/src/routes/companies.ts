import { Router } from "express";
import { db } from "@workspace/db";
import { companies } from "@workspace/db/schema";
import { eq, or } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { requireCompanyAuth, setCompanySession, toSafeCompany } from "../middlewares/auth.js";

const router = Router();

function buildUsername(email: string) {
  const localPart = email.split("@")[0]?.trim().toLowerCase() || "company";
  return localPart.replace(/[^a-z0-9._-]/g, "-");
}

router.post("/companies", async (req, res) => {
  try {
    const { name, industry, email, password } = req.body;
    const normalizedEmail = String(email ?? "").trim().toLowerCase();

    if (!name || !industry || !normalizedEmail) {
      return res.status(400).json({ error: "name, industry, and email are required" });
    }
    if (!password || String(password).length < 8) {
      return res.status(400).json({ error: "password must be at least 8 characters" });
    }

    const username = buildUsername(normalizedEmail);
    const existing = await db
      .select()
      .from(companies)
      .where(or(eq(companies.email, normalizedEmail), eq(companies.username, username)));

    if (existing.length > 0) {
      return res.status(409).json({ error: "An account with this email already exists" });
    }

    const passwordHash = await bcrypt.hash(String(password), 12);
    const sessionToken = randomBytes(32).toString("hex");
    const trialEndsAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 14);

    const [company] = await db
      .insert(companies)
      .values({
        name: String(name).trim(),
        displayName: String(name).trim(),
        username,
        industry: String(industry).trim(),
        email: normalizedEmail,
        modules: "not_selected",
        billingPlan: "starter",
        billingStatus: "trialing",
        trialEndsAt,
        passwordHash,
        sessionToken,
      })
      .returning();

    setCompanySession(res, sessionToken);
    return res.status(201).json({ company: toSafeCompany(company) });
  } catch (err) {
    console.error("createCompany error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/companies/:id/modules", requireCompanyAuth, async (req, res) => {
  try {
    const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = Number.parseInt(rawId, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: "Invalid id" });
    if (!req.company || req.company.id !== id) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const { modules } = req.body;
    if (!["cosiri", "gmp", "both"].includes(modules)) {
      return res.status(400).json({ error: "modules must be cosiri, gmp, or both" });
    }

    const [company] = await db
      .update(companies)
      .set({ modules, updatedAt: new Date() })
      .where(eq(companies.id, id))
      .returning();

    if (!company) return res.status(404).json({ error: "Company not found" });
    return res.json({ company: toSafeCompany(company) });
  } catch (err) {
    console.error("updateModules error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/companies/:id", requireCompanyAuth, async (req, res) => {
  try {
    const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = Number.parseInt(rawId, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: "Invalid id" });
    if (!req.company || req.company.id !== id) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const [company] = await db.select().from(companies).where(eq(companies.id, id));
    if (!company) return res.status(404).json({ error: "Not found" });
    return res.json(toSafeCompany(company));
  } catch (err) {
    console.error("getCompany error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

