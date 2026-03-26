import { Router } from "express";
import { db } from "@workspace/db";
import { companies } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

const router = Router();

router.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required" });
    }

    const [company] = await db.select().from(companies).where(eq(companies.email, email));
    if (!company) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    if (!company.passwordHash) {
      return res.status(401).json({ error: "This account has no password set. Please contact support." });
    }

    const valid = await bcrypt.compare(password, company.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const sessionToken = randomBytes(32).toString("hex");
    const [updated] = await db
      .update(companies)
      .set({ sessionToken })
      .where(eq(companies.id, company.id))
      .returning();

    const { passwordHash: _ph, sessionToken: _st, ...safeCompany } = updated;
    return res.json({ company: safeCompany, sessionToken });
  } catch (err) {
    console.error("login error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
