import { Router } from "express";
import { db } from "@workspace/db";
import { companies } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router = Router();

router.post("/companies", async (req, res) => {
  try {
    const { name, industry, email, modules } = req.body;
    if (!name || !industry || !modules) {
      return res.status(400).json({ error: "name, industry, and modules are required" });
    }
    const [company] = await db.insert(companies).values({ name, industry, email, modules }).returning();
    return res.status(201).json(company);
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
    return res.json(company);
  } catch (err) {
    console.error("getCompany error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
