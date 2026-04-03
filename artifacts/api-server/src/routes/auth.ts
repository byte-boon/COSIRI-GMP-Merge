import { Router } from "express";
import { db } from "@workspace/db";
import { companies } from "@workspace/db/schema";
import { eq, or } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { clearCompanySession, optionalCompanyAuth, setCompanySession, toSafeCompany } from "../middlewares/auth.js";

const router = Router();

router.post("/auth/login", async (req, res) => {
  try {
    const identifier = String(req.body.identifier ?? req.body.email ?? "").trim();
    const password = String(req.body.password ?? "");

    if (!identifier || !password) {
      return res.status(400).json({ error: "Email or username and password are required" });
    }

    const normalized = identifier.toLowerCase();
    const [company] = await db
      .select()
      .from(companies)
      .where(or(eq(companies.email, normalized), eq(companies.username, identifier), eq(companies.username, normalized)));

    if (!company || !company.passwordHash) {
      return res.status(401).json({ error: "Invalid email, username, or password" });
    }

    const valid = await bcrypt.compare(password, company.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid email, username, or password" });
    }

    const sessionToken = randomBytes(32).toString("hex");
    const [updated] = await db
      .update(companies)
      .set({ sessionToken, updatedAt: new Date() })
      .where(eq(companies.id, company.id))
      .returning();

    setCompanySession(res, sessionToken);
    return res.json({ company: toSafeCompany(updated) });
  } catch (err) {
    console.error("login error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/auth/me", optionalCompanyAuth, async (req, res) => {
  if (!req.company) {
    return res.status(401).json({ error: "Authentication required" });
  }
  return res.json({ company: toSafeCompany(req.company) });
});

router.post("/auth/logout", optionalCompanyAuth, async (req, res) => {
  try {
    if (req.company) {
      await db.update(companies).set({ sessionToken: null, updatedAt: new Date() }).where(eq(companies.id, req.company.id));
    }
    clearCompanySession(res);
    return res.status(204).send();
  } catch (err) {
    console.error("logout error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
