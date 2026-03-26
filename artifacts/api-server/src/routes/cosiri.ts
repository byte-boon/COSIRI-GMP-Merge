import { Router } from "express";
import { db } from "@workspace/db";
import { cosiriAssessments, cosiriAnswers, cosiriAiInsights, cosiriUsageCounters, cosiriEvidence } from "@workspace/db/schema";
import { eq, and, desc } from "drizzle-orm";
import OpenAI from "openai";
import { ObjectStorageService } from "../lib/objectStorage.js";

const router = Router();

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

// ---- Dimension metadata (minimal, for AI prompts) ----
const DIMENSION_META: Record<string, { name: string; block: string }> = {
  D1: { name: "Strategy & Target Setting", block: "Strategy & Risk Management" },
  D2: { name: "ESG Integration", block: "Strategy & Risk Management" },
  D3: { name: "Green Business Modelling", block: "Strategy & Risk Management" },
  D4: { name: "Capital Allocation", block: "Strategy & Risk Management" },
  D5: { name: "Physical Climate Risk", block: "Strategy & Risk Management" },
  D6: { name: "Transition Climate Risk", block: "Strategy & Risk Management" },
  D7: { name: "Compliance Risk", block: "Strategy & Risk Management" },
  D8: { name: "Reputation Risk", block: "Strategy & Risk Management" },
  D9: { name: "Greenhouse Gas Emissions", block: "Sustainable Business Processes" },
  D10: { name: "Resources (Water & Energy)", block: "Sustainable Business Processes" },
  D11: { name: "Material Waste", block: "Sustainable Business Processes" },
  D12: { name: "Pollution", block: "Sustainable Business Processes" },
  D13: { name: "Supplier Assessment", block: "Sustainable Business Processes" },
  D14: { name: "Sustainable Procurement", block: "Sustainable Business Processes" },
  D15: { name: "Transportation & Distribution", block: "Sustainable Business Processes" },
  D16: { name: "Supply-Chain Planning", block: "Sustainable Business Processes" },
  D17: { name: "Product Design", block: "Sustainable Business Processes" },
  D18: { name: "Circular Process Management", block: "Sustainable Business Processes" },
  D19: { name: "Technology Adoption", block: "Technology" },
  D20: { name: "Transparency & Optimisation", block: "Technology" },
  D21: { name: "Workforce Development", block: "Organisation & Governance" },
  D22: { name: "Leadership Involvement", block: "Organisation & Governance" },
  D23: { name: "External Communication", block: "Organisation & Governance" },
  D24: { name: "Governance", block: "Organisation & Governance" },
};

// ---- COSIRI Assessments ----

router.get("/cosiri/assessments", async (req, res) => {
  try {
    const companyId = req.query.companyId ? parseInt(req.query.companyId as string) : undefined;
    let rows;
    if (companyId && !isNaN(companyId)) {
      rows = await db.select().from(cosiriAssessments).where(eq(cosiriAssessments.companyId, companyId));
    } else {
      rows = await db.select().from(cosiriAssessments);
    }
    return res.json(rows);
  } catch (err) {
    console.error("listCosiriAssessments error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/cosiri/assessments", async (req, res) => {
  try {
    const { companyId, companyName, industry, status = "draft", overallScore = 0 } = req.body;
    if (!companyName || !industry) {
      return res.status(400).json({ error: "companyName and industry are required" });
    }
    const [assessment] = await db.insert(cosiriAssessments).values({ companyId, companyName, industry, status, overallScore }).returning();
    return res.status(201).json(assessment);
  } catch (err) {
    console.error("createCosiriAssessment error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/cosiri/assessments/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

    const [assessment] = await db.select().from(cosiriAssessments).where(eq(cosiriAssessments.id, id));
    if (!assessment) return res.status(404).json({ error: "Not found" });

    const answers = await db.select().from(cosiriAnswers).where(eq(cosiriAnswers.assessmentId, id));
    return res.json({ ...assessment, answers });
  } catch (err) {
    console.error("getCosiriAssessment error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/cosiri/assessments/:id/answers", async (req, res) => {
  try {
    const assessmentId = parseInt(req.params.id);
    if (isNaN(assessmentId)) return res.status(400).json({ error: "Invalid id" });

    const newAnswers = req.body as Array<{ dimensionId: string; score: number; notes?: string }>;
    if (!Array.isArray(newAnswers)) return res.status(400).json({ error: "Body must be an array" });

    await db.delete(cosiriAnswers).where(eq(cosiriAnswers.assessmentId, assessmentId));
    if (newAnswers.length > 0) {
      await db.insert(cosiriAnswers).values(
        newAnswers.map(a => ({ assessmentId, dimensionId: a.dimensionId, score: a.score, notes: a.notes }))
      );
    }

    const avg = newAnswers.length > 0 ? Math.round((newAnswers.reduce((s, a) => s + a.score, 0) / newAnswers.length) * 10) : 0;
    await db.update(cosiriAssessments)
      .set({ overallScore: avg, status: "completed", updatedAt: new Date() })
      .where(eq(cosiriAssessments.id, assessmentId));

    return res.json({ success: true });
  } catch (err) {
    console.error("saveCosiriAnswers error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ---- AI Insight Generation ----

const PROMPTS: Record<string, string> = {
  executive_summary: `You are a senior sustainability consultant producing a board-level executive summary for a COSIRI assessment.

COSIRI Maturity Scale: Band 0 (No ambition) → Band 1 (Awareness) → Band 2 (Developing) → Band 3 (Integrated baseline) → Band 4 (Advanced) → Band 5 (Industry-leading)

Company: {{companyName}} | Industry: {{industry}} | Overall COSIRI Index: {{overallScore}}/5.0

DIMENSION SCORES:
{{dimensionSummary}}

TOP 5 WEAKEST AREAS:
{{weakestAreas}}

TOP 5 STRONGEST AREAS:
{{strongestAreas}}

Write a professional executive summary (400-600 words) for board presentation covering: maturity positioning, strategic risks from low-scoring areas, key strengths to leverage, and 3-4 priority transformation themes. Use markdown with clear headers. Only analyze the provided data.`,

  gap_analysis: `You are a sustainability transformation advisor conducting a detailed gap analysis based on COSIRI assessment results.

Target maturity: Band 3 minimum for all dimensions.

Company: {{companyName}} | Industry: {{industry}} | Overall COSIRI Index: {{overallScore}}/5.0

DIMENSION SCORES:
{{dimensionSummary}}

For dimensions below Band 3, provide: Root Cause Insights, Risk Implications, Cross-functional Dependencies. Then provide: Quick Wins (0-6 months), Medium-term Initiatives (6-18 months), Long-term Structural Upgrades (18+ months). Use markdown. Only analyze provided data.`,

  roadmap: `You are a strategic sustainability advisor creating a transformation roadmap based on COSIRI assessment results.

Company: {{companyName}} | Industry: {{industry}} | Overall COSIRI Index: {{overallScore}}/5.0

DIMENSION SCORES:
{{dimensionSummary}}

Create a 3-5 year maturity progression: Year 1 (Foundation), Year 2 (Integration), Year 3 (Optimization), Years 4-5 (Leadership). For each phase include target maturity levels, sequenced initiatives, governance recommendations, KPI suggestions. Use markdown. Prioritize largest gaps.`,
};

router.post("/cosiri/assessments/:id/ai/generate", async (req, res) => {
  try {
    const assessmentId = parseInt(req.params.id);
    if (isNaN(assessmentId)) return res.status(400).json({ error: "Invalid id" });

    const { type } = req.body as { type: string };
    if (!["executive_summary", "gap_analysis", "roadmap"].includes(type)) {
      return res.status(400).json({ error: "Invalid type. Must be executive_summary, gap_analysis, or roadmap" });
    }

    const [assessment] = await db.select().from(cosiriAssessments).where(eq(cosiriAssessments.id, assessmentId));
    if (!assessment) return res.status(404).json({ error: "Assessment not found" });

    const answers = await db.select().from(cosiriAnswers).where(eq(cosiriAnswers.assessmentId, assessmentId));
    if (answers.length === 0) return res.status(400).json({ error: "No answers found for this assessment" });

    // Build dimension summary
    const blockGroups: Record<string, Array<{ id: string; name: string; score: number }>> = {};
    for (const a of answers) {
      const meta = DIMENSION_META[a.dimensionId];
      if (!meta) continue;
      if (!blockGroups[meta.block]) blockGroups[meta.block] = [];
      blockGroups[meta.block].push({ id: a.dimensionId, name: meta.name, score: a.score });
    }

    let dimensionSummary = "";
    for (const [block, dims] of Object.entries(blockGroups)) {
      const avg = dims.reduce((s, d) => s + d.score, 0) / dims.length;
      dimensionSummary += `\n## ${block} (Average: ${avg.toFixed(1)}/5)\n`;
      for (const d of dims) dimensionSummary += `- ${d.id} ${d.name}: Band ${d.score}/5\n`;
    }

    const sorted = [...answers].sort((a, b) => a.score - b.score);
    const weakest = sorted.slice(0, 5).map(a => `- ${a.dimensionId} ${DIMENSION_META[a.dimensionId]?.name}: Band ${a.score}/5`).join("\n");
    const strongest = sorted.slice(-5).reverse().map(a => `- ${a.dimensionId} ${DIMENSION_META[a.dimensionId]?.name}: Band ${a.score}/5`).join("\n");

    const overallScore = (assessment.overallScore / 10).toFixed(1);

    let prompt = PROMPTS[type]
      .replace("{{companyName}}", assessment.companyName)
      .replace("{{industry}}", assessment.industry)
      .replace("{{overallScore}}", overallScore)
      .replace("{{dimensionSummary}}", dimensionSummary)
      .replace("{{weakestAreas}}", weakest)
      .replace("{{strongestAreas}}", strongest);

    // Create pending insight record
    const [latestInsight] = await db.select().from(cosiriAiInsights)
      .where(and(eq(cosiriAiInsights.assessmentId, assessmentId), eq(cosiriAiInsights.type, type)))
      .orderBy(desc(cosiriAiInsights.version)).limit(1);
    const version = latestInsight ? latestInsight.version + 1 : 1;

    const [insight] = await db.insert(cosiriAiInsights).values({
      assessmentId, type, content: "", status: "generating", version, model: "gpt-4o", tokensUsed: 0,
    }).returning();

    // Generate with OpenAI
    const model = "gpt-4o";
    const response = await openai.chat.completions.create({
      model,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 4096,
      temperature: 0.4,
    });

    const content = response.choices[0]?.message?.content || "";
    const tokensUsed = response.usage?.total_tokens || 0;

    const [updated] = await db.update(cosiriAiInsights)
      .set({ content, status: "completed", tokensUsed })
      .where(eq(cosiriAiInsights.id, insight.id))
      .returning();

    // Track usage
    const today = new Date().toISOString().split("T")[0];
    const [existing] = await db.select().from(cosiriUsageCounters)
      .where(and(eq(cosiriUsageCounters.date, today), eq(cosiriUsageCounters.metric, `cosiri_${type}`)));
    if (existing) {
      await db.update(cosiriUsageCounters).set({ count: existing.count + 1, tokensUsed: existing.tokensUsed + tokensUsed }).where(eq(cosiriUsageCounters.id, existing.id));
    } else {
      await db.insert(cosiriUsageCounters).values({ date: today, metric: `cosiri_${type}`, count: 1, tokensUsed });
    }

    return res.json(updated);
  } catch (err) {
    console.error("generateCosiriInsight error:", err);
    return res.status(500).json({ error: "Internal server error", details: String(err) });
  }
});

router.get("/cosiri/assessments/:id/ai/insights/latest", async (req, res) => {
  try {
    const assessmentId = parseInt(req.params.id);
    if (isNaN(assessmentId)) return res.status(400).json({ error: "Invalid id" });

    const types = ["executive_summary", "gap_analysis", "roadmap"];
    const result: Record<string, unknown> = {};

    for (const type of types) {
      const [insight] = await db.select().from(cosiriAiInsights)
        .where(and(eq(cosiriAiInsights.assessmentId, assessmentId), eq(cosiriAiInsights.type, type)))
        .orderBy(desc(cosiriAiInsights.version)).limit(1);
      if (insight) result[type] = insight;
    }

    return res.json(result);
  } catch (err) {
    console.error("getLatestCosiriInsights error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/cosiri/ai/insights/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

    const { content, status } = req.body;
    if (!content) return res.status(400).json({ error: "content is required" });

    const updates: Record<string, unknown> = { content };
    if (status) updates.status = status;

    const [updated] = await db.update(cosiriAiInsights).set(updates).where(eq(cosiriAiInsights.id, id)).returning();
    if (!updated) return res.status(404).json({ error: "Not found" });

    return res.json(updated);
  } catch (err) {
    console.error("updateCosiriInsight error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// PUT update assessment (status, score, etc.)
router.put("/cosiri/assessments/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status, overallScore } = req.body;
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (status !== undefined) updates.status = status;
    if (overallScore !== undefined) updates.overallScore = overallScore;
    const [updated] = await db.update(cosiriAssessments).set(updates).where(eq(cosiriAssessments.id, id)).returning();
    if (!updated) return res.status(404).json({ error: "Assessment not found" });
    return res.json(updated);
  } catch (err) {
    console.error("updateAssessment error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ---- COSIRI Evidence ----

const storageService = new ObjectStorageService();

// GET evidence for an assessment (optionally filtered by dimensionId)
router.get("/cosiri/assessments/:id/evidence", async (req, res) => {
  try {
    const assessmentId = parseInt(req.params.id);
    const { dimensionId } = req.query;
    let rows;
    if (dimensionId) {
      rows = await db.select().from(cosiriEvidence)
        .where(and(eq(cosiriEvidence.assessmentId, assessmentId), eq(cosiriEvidence.dimensionId, dimensionId as string)))
        .orderBy(desc(cosiriEvidence.createdAt));
    } else {
      rows = await db.select().from(cosiriEvidence)
        .where(eq(cosiriEvidence.assessmentId, assessmentId))
        .orderBy(desc(cosiriEvidence.createdAt));
    }
    return res.json(rows);
  } catch (err) {
    console.error("listEvidence error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// POST save evidence record after upload
router.post("/cosiri/assessments/:id/evidence", async (req, res) => {
  try {
    const assessmentId = parseInt(req.params.id);
    const { dimensionId, fileName, fileType, fileSize, objectPath } = req.body;
    if (!dimensionId || !fileName || !objectPath) {
      return res.status(400).json({ error: "dimensionId, fileName, and objectPath are required" });
    }
    const [row] = await db.insert(cosiriEvidence).values({
      assessmentId,
      dimensionId,
      fileName,
      fileType: fileType || null,
      fileSize: fileSize || null,
      objectPath,
      summaryStatus: "idle",
    }).returning();
    return res.status(201).json(row);
  } catch (err) {
    console.error("createEvidence error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE evidence record
router.delete("/cosiri/evidence/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(cosiriEvidence).where(eq(cosiriEvidence.id, id));
    return res.json({ ok: true });
  } catch (err) {
    console.error("deleteEvidence error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// POST analyze a single evidence file with AI
router.post("/cosiri/evidence/:id/analyze", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [evidence] = await db.select().from(cosiriEvidence).where(eq(cosiriEvidence.id, id));
    if (!evidence) return res.status(404).json({ error: "Evidence not found" });

    await db.update(cosiriEvidence).set({ summaryStatus: "processing" }).where(eq(cosiriEvidence.id, id));

    const dimMeta = DIMENSION_META[evidence.dimensionId] || { name: evidence.dimensionId, block: "Unknown" };

    let fileContent = "";
    try {
      const file = await storageService.getObjectEntityFile(evidence.objectPath);
      const [fileData] = await file.download();
      fileContent = fileData.toString("utf-8").slice(0, 12000);
    } catch (downloadErr) {
      console.error("File download error:", downloadErr);
      fileContent = `[File: ${evidence.fileName} — content could not be extracted]`;
    }

    const prompt = `You are a COSIRI (Consumer Sustainability Industry Readiness Index) expert auditor.

The following document has been submitted as evidence for the dimension:
Dimension: ${dimMeta.name}
Building Block: ${dimMeta.block}

Filename: ${evidence.fileName}

Document content:
---
${fileContent}
---

Please provide a concise, structured evidence summary (3-5 sentences) covering:
1. What this document demonstrates about the organisation's maturity in "${dimMeta.name}"
2. What COSIRI band level it supports and why
3. Any gaps or recommendations for improving the evidence quality

Keep the summary factual, specific, and directly tied to the COSIRI dimension criteria.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 400,
    });

    const summary = completion.choices[0]?.message?.content || "Unable to generate summary.";
    const [updated] = await db.update(cosiriEvidence)
      .set({ aiSummary: summary, summaryStatus: "completed" })
      .where(eq(cosiriEvidence.id, id))
      .returning();

    return res.json(updated);
  } catch (err) {
    console.error("analyzeEvidence error:", err);
    await db.update(cosiriEvidence).set({ summaryStatus: "failed" }).where(eq(cosiriEvidence.id, parseInt(req.params.id)));
    return res.status(500).json({ error: "Analysis failed" });
  }
});

export default router;
