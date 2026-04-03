import { Router } from "express";
import { db } from "@workspace/db";
import { gmpAssessments, gmpFindings } from "@workspace/db/schema";
import { eq, inArray } from "drizzle-orm";
import { nanoid } from "nanoid";
import OpenAI from "openai";

const router = Router();

function getOpenAIClient() {
  const apiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new OpenAI({
    apiKey,
    baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  });
}

async function getOwnedAssessment(assessmentId: number, companyId: number) {
  const [assessment] = await db.select().from(gmpAssessments).where(eq(gmpAssessments.id, assessmentId));
  if (!assessment || assessment.companyId !== companyId) {
    return null;
  }
  return assessment;
}

router.get("/gmp/assessments", async (req, res) => {
  try {
    const companyId = req.company?.id;
    if (!companyId) return res.status(401).json({ error: "Authentication required" });

    const results = await db.select().from(gmpAssessments).where(eq(gmpAssessments.companyId, companyId));
    return res.json(results);
  } catch (err) {
    console.error("listGmpAssessments error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/gmp/assessments", async (req, res) => {
  try {
    const companyId = req.company?.id;
    if (!companyId) return res.status(401).json({ error: "Authentication required" });

    const { scope, status = "in_progress", overallScore = 0, startDate } = req.body;
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
    const id = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: "Invalid id" });

    const assessment = await getOwnedAssessment(id, req.company!.id);
    if (!assessment) return res.status(404).json({ error: "Not found" });
    return res.json(assessment);
  } catch (err) {
    console.error("getGmpAssessment error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/gmp/assessments/:id/responses", async (req, res) => {
  try {
    const id = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: "Invalid id" });

    const assessment = await getOwnedAssessment(id, req.company!.id);
    if (!assessment) return res.status(404).json({ error: "Not found" });

    const responses = req.body;
    const values = Object.values(responses) as (string | { score?: number | null; na?: boolean })[];
    let scoredCount = 0;
    let scoreSum = 0;
    for (const value of values) {
      if (typeof value === "string") {
        if (value === "na") continue;
        scoredCount++;
        if (value === "compliant") scoreSum += 5;
        else if (value === "partial") scoreSum += 3;
        else if (value === "noncompliant") scoreSum += 1;
      } else if (value && typeof value === "object") {
        if (value.na) continue;
        if (value.score != null) {
          scoredCount++;
          scoreSum += value.score;
        }
      }
    }
    const overallScore = scoredCount > 0 ? Math.round((scoreSum / (scoredCount * 5)) * 100) : 0;
    const status = values.length > 0 ? "completed" : "in_progress";

    await db.update(gmpAssessments)
      .set({ responses, overallScore, status, updatedAt: new Date() })
      .where(eq(gmpAssessments.id, assessment.id));

    return res.json({ success: true });
  } catch (err) {
    console.error("saveGmpResponses error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/gmp/findings", async (req, res) => {
  try {
    const assessmentId = req.query.assessmentId ? Number.parseInt(req.query.assessmentId as string, 10) : undefined;

    if (assessmentId && !Number.isNaN(assessmentId)) {
      const assessment = await getOwnedAssessment(assessmentId, req.company!.id);
      if (!assessment) return res.status(404).json({ error: "Not found" });
      const results = await db.select().from(gmpFindings).where(eq(gmpFindings.assessmentId, assessmentId));
      return res.json(results);
    }

    const assessments = await db.select().from(gmpAssessments).where(eq(gmpAssessments.companyId, req.company!.id));
    const assessmentIds = assessments.map((assessment) => assessment.id);
    if (assessmentIds.length === 0) {
      return res.json([]);
    }
    const results = await db.select().from(gmpFindings).where(inArray(gmpFindings.assessmentId, assessmentIds));
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

    const assessment = await getOwnedAssessment(Number(assessmentId), req.company!.id);
    if (!assessment) return res.status(404).json({ error: "Assessment not found" });

    const [finding] = await db.insert(gmpFindings).values({ assessmentId, itemId, type, severity, description, status }).returning();
    return res.status(201).json(finding);
  } catch (err) {
    console.error("createGmpFinding error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

const SCORE_LABELS: Record<number, string> = {
  1: "Not Present", 2: "Initial", 3: "Developing", 4: "Managed", 5: "Optimised",
};

const GMP_SYSTEM_PROMPT = `You are a senior GMP (Good Manufacturing Practice) compliance consultant with 20 years of experience conducting pharmaceutical and manufacturing audits under ISO 22716, EU GMP Annex 1, and ICH Q10 guidelines. You specialise in writing CAPA (Corrective and Preventive Action) findings that are clear, actionable, and audit-ready.

Your CAPA descriptions must be:
- Grounded in GMP regulatory language
- Structured with a Non-Conformance, Root Cause, Corrective Action, Preventive Action, and Timeline
- Specific to the item, score level, and severity provided
- Written in plain professional English (no markdown, no bullet symbols)
- Concise: 2-3 sentences per section`;

router.post("/gmp/generate-capa", async (req, res): Promise<void> => {
  try {
    const client = getOpenAIClient();
    if (!client) {
      res.status(503).json({ error: "AI assistance is not configured" });
      return;
    }

    const { itemId, itemLabel, itemDescription, score, severity, type } = req.body;
    if (!itemId || !itemLabel || score == null || !severity) {
      res.status(400).json({ error: "itemId, itemLabel, score, severity are required" });
      return;
    }

    const scoreLabel = SCORE_LABELS[score as number] ?? "Unknown";
    const typeLabel = (type as string ?? "noncompliance").replace(/_/g, " ");

    const userPrompt = `Generate a structured CAPA finding for the following GMP audit observation:

GMP Item: ${itemId} - ${itemLabel}
${itemDescription ? `Item Description: ${itemDescription}` : ""}
Audit Score: ${score}/5 - "${scoreLabel}"
Severity Classification: ${(severity as string).charAt(0).toUpperCase() + (severity as string).slice(1)}
Finding Type: ${typeLabel}

Write the CAPA finding with exactly these five labelled sections, each 2-3 sentences:

NON-CONFORMANCE STATEMENT:
[Describe the specific gap or deficiency observed based on the item and score level]

ROOT CAUSE ANALYSIS:
[Identify the most likely root cause(s) using structured thinking - process, people, system, or training gaps]

CORRECTIVE ACTION (Immediate):
[Describe what must be done immediately to address and contain the non-conformance]

PREVENTIVE ACTION (Systemic):
[Describe the systemic changes, controls, or monitoring needed to prevent recurrence]

TARGET COMPLETION:
[State a SMART timeline - ${severity === "critical" ? "30 days" : severity === "major" ? "60 days" : "90 days"} from audit date, with key milestones]`;

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const stream = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: GMP_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 1024,
      temperature: 0.3,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    console.error("generateCapa error:", err);
    try {
      res.write(`data: ${JSON.stringify({ error: "AI generation failed. Please write the description manually." })}\n\n`);
      res.end();
    } catch {}
  }
});

export default router;

