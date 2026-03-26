import { Router } from "express";
import { db } from "@workspace/db";
import { gmpAssessments, gmpFindings } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

const router = Router();

// ---- GMP Assessments ----

router.get("/gmp/assessments", async (req, res) => {
  try {
    const companyId = req.query.companyId ? parseInt(req.query.companyId as string) : undefined;
    let query = db.select().from(gmpAssessments);
    if (companyId && !isNaN(companyId)) {
      const results = await db.select().from(gmpAssessments).where(eq(gmpAssessments.companyId, companyId));
      return res.json(results);
    }
    const results = await query;
    return res.json(results);
  } catch (err) {
    console.error("listGmpAssessments error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/gmp/assessments", async (req, res) => {
  try {
    const { companyId, scope, status = "in_progress", overallScore = 0, startDate } = req.body;
    if (!scope) return res.status(400).json({ error: "scope is required" });

    const auditId = `GMP-${new Date().getFullYear()}-${nanoid(6).toUpperCase()}`;
    const [assessment] = await db.insert(gmpAssessments).values({
      companyId,
      auditId,
      scope,
      status,
      overallScore,
      startDate: startDate || new Date().toISOString().split("T")[0],
      responses: {},
    }).returning();
    return res.status(201).json(assessment);
  } catch (err) {
    console.error("createGmpAssessment error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/gmp/assessments/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });
    const [assessment] = await db.select().from(gmpAssessments).where(eq(gmpAssessments.id, id));
    if (!assessment) return res.status(404).json({ error: "Not found" });
    return res.json(assessment);
  } catch (err) {
    console.error("getGmpAssessment error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/gmp/assessments/:id/responses", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

    const responses = req.body;
    // Support both legacy string format and new { score, na, notes, attachments } format
    const values = Object.values(responses) as (string | { score?: number | null; na?: boolean })[];
    let scoredCount = 0;
    let scoreSum = 0;
    for (const v of values) {
      if (typeof v === "string") {
        if (v === "na") continue;
        scoredCount++;
        if (v === "compliant") scoreSum += 5;
        else if (v === "partial") scoreSum += 3;
        else if (v === "noncompliant") scoreSum += 1;
      } else if (v && typeof v === "object") {
        if (v.na) continue;
        if (v.score != null) { scoredCount++; scoreSum += v.score; }
      }
    }
    const overallScore = scoredCount > 0 ? Math.round((scoreSum / (scoredCount * 5)) * 100) : 0;
    const allDone = values.length > 0;
    const status = allDone ? "completed" : "in_progress";

    const [updated] = await db.update(gmpAssessments)
      .set({ responses, overallScore, status, updatedAt: new Date() })
      .where(eq(gmpAssessments.id, id))
      .returning();

    if (!updated) return res.status(404).json({ error: "Not found" });
    return res.json({ success: true });
  } catch (err) {
    console.error("saveGmpResponses error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ---- GMP Findings ----

router.get("/gmp/findings", async (req, res) => {
  try {
    const assessmentId = req.query.assessmentId ? parseInt(req.query.assessmentId as string) : undefined;
    if (assessmentId && !isNaN(assessmentId)) {
      const results = await db.select().from(gmpFindings).where(eq(gmpFindings.assessmentId, assessmentId));
      return res.json(results);
    }
    const results = await db.select().from(gmpFindings);
    return res.json(results);
  } catch (err) {
    console.error("listGmpFindings error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/gmp/findings", async (req, res) => {
  try {
    const { assessmentId, itemId, type = "noncompliance", severity, description, status = "open" } = req.body;
    if (!assessmentId || !itemId || !severity || !description) {
      return res.status(400).json({ error: "assessmentId, itemId, severity, and description are required" });
    }
    const [finding] = await db.insert(gmpFindings).values({ assessmentId, itemId, type, severity, description, status }).returning();
    return res.status(201).json(finding);
  } catch (err) {
    console.error("createGmpFinding error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
