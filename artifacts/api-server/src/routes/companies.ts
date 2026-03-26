import { Router } from "express";
import { db } from "@workspace/db";
import { companies } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

const router = Router();

router.post("/companies", async (req, res) => {
  try {
    const { name, industry, email, modules, password } = req.body;
    if (!name || !industry || !modules) {
      return res.status(400).json({ error: "name, industry, and modules are required" });
    }
    if (!password || password.length < 8) {
      return res.status(400).json({ error: "password must be at least 8 characters" });
    }

    const existingEmail = email
      ? await db.select().from(companies).where(eq(companies.email, email))
      : [];
    if (existingEmail.length > 0) {
      return res.status(409).json({ error: "An account with this email already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const sessionToken = randomBytes(32).toString("hex");

    const [company] = await db
      .insert(companies)
      .values({ name, industry, email, modules, passwordHash, sessionToken })
      .returning();

    const { passwordHash: _ph, sessionToken: _st, ...safeCompany } = company;
    return res.status(201).json({ company: safeCompany, sessionToken });
  } catch (err) {
    console.error("createCompany error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/companies/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });
    const [company] = await db.select().from(companies).where(eq(companies.id, id));
    if (!company) return res.status(404).json({ error: "Not found" });
    const { passwordHash: _ph, sessionToken: _st, ...safeCompany } = company;
    return res.json(safeCompany);
  } catch (err) {
    console.error("getCompany error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
