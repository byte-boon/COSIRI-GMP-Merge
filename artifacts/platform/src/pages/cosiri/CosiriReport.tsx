import React, { useState } from "react";
import { useRoute, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import {
  ChevronLeft, Sparkles, RefreshCw, FileText, CheckCircle2,
  Paperclip, Building2, MapPin, Users, Package, Star, User,
  Calendar, Award, Target, TrendingUp, BarChart3, Leaf, Shield,
  Cpu, LayoutGrid, Download,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useGenerateCosiriInsight, useGetLatestCosiriInsights, useGetCosiriAssessment } from "@workspace/api-client-react";
import {
  COSIRI_DATA, MATURITY_LABELS, BAND_DESCRIPTIONS,
  INDUSTRY_BENCHMARKS, getBenchmarkKey, DIMENSION_WEIGHTS,
} from "@/lib/cosiri-data";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

type InsightType = "executive_summary" | "gap_analysis" | "roadmap" | "benchmarking" | "tier_matrix" | "transformation_roadmap";

interface EvidenceItem {
  id: number; dimensionId: string; fileName: string;
  aiSummary: string | null; summaryStatus: string;
}

interface SiteProfile {
  siteName?: string | null; location?: string | null; subSector?: string | null;
  employeeCount?: string | null; productionArea?: string | null;
  productsManufactured?: string | null; assessorName?: string | null;
  assessorCredentials?: string | null; cosiriVersion?: string | null;
  assessmentDate?: string | null;
}

/* ── Small helpers ── */
function SectionHeader({ num, icon, title, subtitle }: { num: number; icon: React.ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="px-6 py-4 border-b border-border bg-muted/20 flex items-center gap-3">
      <span className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center border border-primary/20 shrink-0">{num}</span>
      <span className="text-muted-foreground/60">{icon}</span>
      <div>
        <h2 className="font-bold text-base text-foreground">{title}</h2>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
  );
}

function ProfileField({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5 flex items-center gap-1">
        <span className="text-muted-foreground/60">{icon}</span>{label}
      </p>
      <p className="text-sm font-medium text-foreground">{value || <span className="text-muted-foreground/40 italic">Not provided</span>}</p>
    </div>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const cls = score >= 4 ? "bg-green-100 text-green-700" : score >= 2 ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600";
  return <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${cls}`}>{score}</span>;
}

function AiSection({
  type, label, insights, onGenerate, generating,
}: {
  type: InsightType; label: string;
  insights: Record<string, { content: string; version: number; createdAt: string }> | undefined;
  onGenerate: (t: InsightType) => void; generating: InsightType | null;
}) {
  const content = insights?.[type]?.content;
  const meta = insights?.[type];
  const isGenerating = generating === type;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-muted-foreground italic">AI-generated · {label}</p>
        <button
          onClick={() => onGenerate(type)}
          disabled={!!generating}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-600 text-white hover:bg-purple-700 transition-colors disabled:opacity-50"
        >
          {isGenerating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          {content ? "Regenerate" : "Generate"}
        </button>
      </div>

      {isGenerating ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground space-y-3">
          <RefreshCw className="w-7 h-7 animate-spin text-purple-500" />
          <p className="text-sm font-medium text-purple-600">Generating {label}…</p>
          <p className="text-xs opacity-60">This may take a few seconds</p>
        </div>
      ) : content ? (
        <div>
          {meta && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4 pb-3 border-b border-border">
              <CheckCircle2 className="w-3 h-3 text-green-500" />
              Auto-saved · Version {meta.version} · {new Date(meta.createdAt).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
            </div>
          )}
          <div className="prose max-w-none dark:prose-invert prose-headings:font-display prose-h1:text-2xl prose-a:text-primary">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 bg-muted/10 rounded-xl border border-dashed border-border text-muted-foreground space-y-3">
          <FileText className="w-10 h-10 text-muted-foreground/30" />
          <p className="text-sm font-medium">Not yet generated</p>
          <p className="text-xs opacity-60">Click Generate — saves automatically once done</p>
        </div>
      )}
    </div>
  );
}

/* ── Block icon map ── */
const BLOCK_ICONS: Record<string, React.ReactNode> = {
  "Strategy & Risk Management": <Shield className="w-4 h-4" />,
  "Sustainable Business Processes": <Leaf className="w-4 h-4" />,
  "Technology": <Cpu className="w-4 h-4" />,
  "Organisation & Governance": <LayoutGrid className="w-4 h-4" />,
};

const BLOCK_COLORS: Record<string, string> = {
  "Strategy & Risk Management": "text-blue-600 bg-blue-50 border-blue-200",
  "Sustainable Business Processes": "text-green-600 bg-green-50 border-green-200",
  "Technology": "text-purple-600 bg-purple-50 border-purple-200",
  "Organisation & Governance": "text-orange-600 bg-orange-50 border-orange-200",
};

const EMBLEM_LABELS: Record<number, { label: string; desc: string }> = {
  0: { label: "Not Yet Awarded", desc: "Complete the assessment to qualify." },
  1: { label: "1-Star COSIRI Emblem", desc: "Initial sustainability awareness is demonstrated." },
  2: { label: "2-Star COSIRI Emblem", desc: "Structured sustainability plans are forming." },
  3: { label: "3-Star COSIRI Emblem", desc: "Sustainability integrated into core operations." },
  4: { label: "4-Star COSIRI Emblem", desc: "Advanced optimisation with data-driven sustainability." },
  5: { label: "5-Star COSIRI Emblem", desc: "Industry-leading sustainability performance." },
};

const TIER_COLORS: Record<string, string> = {
  "Tier 1": "bg-red-50 text-red-700 border-red-200",
  "Tier 2": "bg-orange-50 text-orange-700 border-orange-200",
  "Tier 3": "bg-blue-50 text-blue-700 border-blue-200",
  "Tier 4": "bg-green-50 text-green-700 border-green-200",
};

/* ═══════════════════════════════════════════════════════════════ */
export default function CosiriReport() {
  const [, params] = useRoute("/cosiri/report/:id");
  const id = params?.id ? parseInt(params.id) : 0;
  const [generating, setGenerating] = useState<InsightType | null>(null);

  const { data: insights, refetch } = useGetLatestCosiriInsights(id, { query: { enabled: !!id } });
  const { mutateAsync: generateInsight } = useGenerateCosiriInsight();
  const { data: assessment } = useGetCosiriAssessment(id, { query: { enabled: !!id } });

  const { data: siteProfile } = useQuery<SiteProfile>({
    queryKey: ["site-profile", id],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/cosiri/assessments/${id}/profile`);
      if (!res.ok) return {} as SiteProfile;
      return res.json();
    },
    enabled: !!id,
  });

  const { data: allEvidence = [] } = useQuery<EvidenceItem[]>({
    queryKey: ["all-evidence", id],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/cosiri/assessments/${id}/evidence`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!id,
  });

  const handleGenerate = async (type: InsightType) => {
    setGenerating(type);
    try {
      await generateInsight({ id, data: { type } });
      await refetch();
    } catch (e) {
      console.error(e);
    } finally {
      setGenerating(null);
    }
  };

  /* ── Derived data ── */
  type Answer = { dimensionId: string; score: number };
  const answers: Answer[] = assessment?.answers ?? [];
  const overallScore = assessment?.overallScore ?? 0;
  const industry = assessment?.industry ?? "";

  const scoreMap: Record<string, number> = {};
  answers.forEach((a: Answer) => { scoreMap[a.dimensionId] = a.score; });

  // Block-level averages
  const blocks = ["Strategy & Risk Management", "Sustainable Business Processes", "Technology", "Organisation & Governance"] as const;
  const blockData = blocks.map(block => {
    const dims = COSIRI_DATA.filter(d => d.block === block);
    const scored = dims.map(d => scoreMap[d.id] ?? 0);
    const avg = scored.length ? scored.reduce((a, b) => a + b, 0) / scored.length : 0;
    return { block, avg: parseFloat(avg.toFixed(1)), dims, scored };
  });

  // D9 – GHG specific
  const ghgScore = scoreMap["D9"] ?? 0;
  const ghgBand = BAND_DESCRIPTIONS[ghgScore];

  // Benchmark
  const benchKey = getBenchmarkKey(industry);
  const benchmark = INDUSTRY_BENCHMARKS[benchKey] ?? INDUSTRY_BENCHMARKS.default;

  // TIER data
  const tierData = COSIRI_DATA.map((dim, idx) => {
    const cs = scoreMap[dim.id] ?? 0;
    const ia = benchmark.avg[idx] ?? 2.0;
    const gap = ia - cs;
    const impact = DIMENSION_WEIGHTS[idx] ?? 2;
    const priority = gap * impact;
    let tier: "Tier 1" | "Tier 2" | "Tier 3" | "Tier 4";
    if (gap > 0.5 && impact >= 4) tier = "Tier 1";
    else if (gap > 0.5 || (gap > 0 && impact >= 4)) tier = "Tier 2";
    else if (gap > 0) tier = "Tier 3";
    else tier = "Tier 4";
    const vsIndustry = gap < -0.3 ? "above" : gap > 0.3 ? "below" : "at";
    return { dim, cs, ia, gap, impact, priority, tier, vsIndustry };
  }).sort((a, b) => b.priority - a.priority);

  // Emblem / star
  const nextStar = Math.min(5, overallScore + 1);
  const currentTotal = COSIRI_DATA.reduce((s, d) => s + (scoreMap[d.id] ?? 0), 0);
  const neededImprovement = Math.max(0, nextStar * COSIRI_DATA.length - currentTotal);
  const validUntil = new Date();
  validUntil.setFullYear(validUntil.getFullYear() + 2);

  const aboveAvg = tierData.filter(d => d.vsIndustry === "above").length;
  const atAvg = tierData.filter(d => d.vsIndustry === "at").length;
  const belowAvg = tierData.filter(d => d.vsIndustry === "below").length;
  const percentileEst = Math.round(((aboveAvg + atAvg * 0.5) / 24) * 100);

  const evidenceByDimension = allEvidence.reduce<Record<string, EvidenceItem[]>>((acc, e) => {
    acc[e.dimensionId] = acc[e.dimensionId] || []; acc[e.dimensionId].push(e); return acc;
  }, {});
  const analyzedEvidence = allEvidence.filter(e => e.summaryStatus === "completed" && e.aiSummary);

  /* ── GHG scope descriptor ── */
  const ghgDescriptors: Record<number, string> = {
    0: "No GHG data collected. Scope 1, 2, or 3 emissions are not tracked.",
    1: "Basic awareness of GHG impact. Informal emission estimates with no targets.",
    2: "Scope 1 & 2 data partially tracked. Initial reduction targets being set.",
    3: "Scope 1, 2, and selected Scope 3 categories tracked with verified data and targets.",
    4: "Science-based targets in place. Verified Scope 1-3 data with active reduction programs.",
    5: "Net-zero pathway aligned. Full Scope 1-3 transparency with third-party verification.",
  };

  const card = "bg-card border border-border rounded-2xl shadow-sm overflow-hidden mb-6";

  return (
    <AppLayout>
      {/* ── Page header ── */}
      <div className="mb-6">
        <Link href={`/cosiri/results/${id}`} className="text-sm text-muted-foreground hover:text-primary flex items-center mb-4 transition-colors w-fit">
          <ChevronLeft className="w-4 h-4 mr-1" /> Back to Results
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold">COSIRI Assessment Report</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {assessment?.companyName && <><span className="font-medium text-foreground">{assessment.companyName}</span> · </>}
              {siteProfile?.assessmentDate || new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
          <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium shadow-md shadow-primary/20 flex items-center gap-2 hover:bg-primary/90 transition-colors text-sm">
            <Download className="w-4 h-4" /> Export PDF
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════
          SECTION 1 — Company Profile
      ═══════════════════════════════════════ */}
      <div className={card}>
        <SectionHeader num={1} icon={<Building2 className="w-4 h-4" />} title="Company Profile" subtitle="Who was assessed" />
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-4">
            <ProfileField icon={<Building2 className="w-4 h-4" />} label="Company" value={assessment?.companyName} />
            <ProfileField icon={<Building2 className="w-4 h-4" />} label="Site Name" value={siteProfile?.siteName} />
            <ProfileField icon={<MapPin className="w-4 h-4" />} label="Location" value={siteProfile?.location} />
            <ProfileField icon={<Package className="w-4 h-4" />} label="Industry" value={assessment?.industry} />
            <ProfileField icon={<Package className="w-4 h-4" />} label="Sub-Sector" value={siteProfile?.subSector} />
            <ProfileField icon={<Users className="w-4 h-4" />} label="Employees (site)" value={siteProfile?.employeeCount} />
            <ProfileField icon={<Building2 className="w-4 h-4" />} label="Production Area" value={siteProfile?.productionArea ? `${siteProfile.productionArea} m²` : undefined} />
            <ProfileField icon={<Package className="w-4 h-4" />} label="Products Manufactured" value={siteProfile?.productsManufactured} />
            <ProfileField icon={<Calendar className="w-4 h-4" />} label="Assessment Date" value={siteProfile?.assessmentDate} />
            <ProfileField icon={<Building2 className="w-4 h-4" />} label="COSIRI Version" value={siteProfile?.cosiriVersion ?? "COSIRI-24"} />
            <ProfileField icon={<User className="w-4 h-4" />} label="Certified Assessor (CCA)" value={siteProfile?.assessorName} />
            <ProfileField icon={<User className="w-4 h-4" />} label="Assessor Credentials" value={siteProfile?.assessorCredentials} />
          </div>
          {!siteProfile?.siteName && (
            <p className="mt-4 text-xs text-muted-foreground italic">Complete the Company & Site Profile in the assessment to populate these fields.</p>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════
          SECTION 2 — Executive Summary
      ═══════════════════════════════════════ */}
      <div className={card}>
        <SectionHeader num={2} icon={<FileText className="w-4 h-4" />} title="Executive Summary" subtitle="Quick snapshot for leadership" />
        <AiSection type="executive_summary" label="Executive Summary" insights={insights as any} onGenerate={handleGenerate} generating={generating} />
      </div>

      {/* ═══════════════════════════════════════
          SECTION 3 — Overall Score & Star Rating
      ═══════════════════════════════════════ */}
      <div className={card}>
        <SectionHeader num={3} icon={<Star className="w-4 h-4" />} title="Overall Score & Star Rating" subtitle="Top-line result" />
        <div className="p-6">
          {/* BUG 1-5 FIX: overallScore is stored as Math.round(avg × 10), e.g. 31 for a 3.1 avg.
              All Section 3 variables are scoped here — no other section is modified. */}
          {(() => {
            // BUG 1 — correct average: divide raw stored value by 10 → true 0–5 float
            const s3Score = parseFloat((overallScore / 10).toFixed(1));

            // BUG 3 — stars from corrected average (Math.round → 0–5 integer)
            const s3Stars = Math.round(s3Score);

            // BUG 2 — getMaturityBand: map corrected 0–5 float → band integer 0–5
            const s3Band: number =
              s3Score <= 0   ? 0 :
              s3Score <= 1.0 ? 1 :
              s3Score <= 2.0 ? 2 :
              s3Score <= 3.0 ? 3 :
              s3Score <= 4.0 ? 4 : 5;
            const s3BandDesc = BAND_DESCRIPTIONS[s3Band];

            // BUG 4 — Key Criteria: top 3 (strengths) and bottom 3 (gaps) from dimension answers
            const s3AllScored = COSIRI_DATA
              .map(d => ({ dim: d, score: scoreMap[d.id] ?? 0 }))
              .filter(d => d.score > 0)
              .sort((a, b) => b.score - a.score);
            const s3Top3 = s3AllScored.slice(0, 3);
            const s3Bot3 = [...s3AllScored].reverse().slice(0, 3);

            // BUG 5 — band labels for distribution tooltip/legend
            const bandLabel: Record<number, string> = {
              5: "Leader", 4: "Advanced", 3: "Intermediate",
              2: "Developing", 1: "Beginner", 0: "None",
            };

            return (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Card 1 — Star Rating (BUG 1 + BUG 3) */}
                <div className="flex flex-col items-center justify-center text-center bg-gradient-to-b from-amber-50 to-white border border-amber-100 rounded-2xl p-6">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">COSIRI Star Rating</p>
                  <div className="flex gap-1 mb-3">
                    {[1, 2, 3, 4, 5].map(i => (
                      <Star key={i} className={`w-9 h-9 ${i <= s3Stars ? "fill-amber-400 text-amber-400" : "text-slate-200 fill-slate-100"}`} />
                    ))}
                  </div>
                  <p className="text-3xl font-bold text-foreground">
                    {s3Score}<span className="text-lg text-muted-foreground">/5</span>
                  </p>
                  <p className="text-sm font-semibold text-amber-600 mt-1">
                    {MATURITY_LABELS[s3Band] ?? "—"}
                  </p>
                </div>

                {/* Card 2 — Maturity Band + Key Criteria (BUG 2 + BUG 4) */}
                <div className="bg-muted/30 border border-border rounded-2xl p-6 flex flex-col">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Maturity Band</p>
                  <p className="text-2xl font-bold text-foreground mb-0.5">
                    Band {s3Band} — {s3BandDesc?.title}
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-3">{s3BandDesc?.summary}</p>
                  <div className="mt-auto pt-3 border-t border-border">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Key Criteria</p>
                    {s3AllScored.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic">No dimension scores available yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {s3Top3.length > 0 && (
                          <div>
                            <p className="text-[10px] font-semibold text-green-600 uppercase tracking-wider mb-1.5">Strengths</p>
                            <div className="space-y-1">
                              {s3Top3.map(({ dim, score }) => (
                                <p key={dim.id} className="text-xs text-foreground flex items-start gap-1.5 leading-snug">
                                  <span className="shrink-0">✅</span>
                                  <span>
                                    <span className="font-medium">{dim.name}</span>
                                    {" — "}{MATURITY_LABELS[score] ?? "—"} ({score}/5)
                                  </span>
                                </p>
                              ))}
                            </div>
                          </div>
                        )}
                        {s3Bot3.length > 0 && (
                          <div>
                            <p className="text-[10px] font-semibold text-amber-600 uppercase tracking-wider mb-1.5">Areas for Improvement</p>
                            <div className="space-y-1">
                              {s3Bot3.map(({ dim, score }) => (
                                <p key={dim.id} className="text-xs text-foreground flex items-start gap-1.5 leading-snug">
                                  <span className="shrink-0">⚠️</span>
                                  <span>
                                    <span className="font-medium">{dim.name}</span>
                                    {" — "}{MATURITY_LABELS[score] ?? "—"} ({score}/5)
                                  </span>
                                </p>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card 3 — Score Distribution (BUG 5: band labels from corrected mapping) */}
                <div className="bg-muted/30 border border-border rounded-2xl p-6">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">
                    Score Distribution (24 dimensions)
                  </p>
                  <div className="space-y-2.5">
                    {[5, 4, 3, 2, 1, 0].map(band => {
                      // BUG 5: use exact integer band stored per dimension (0–5, stored correctly)
                      const count = COSIRI_DATA.filter(d => (scoreMap[d.id] ?? 0) === band).length;
                      const pct = (count / 24) * 100;
                      const clr = band >= 4 ? "bg-green-400" : band >= 2 ? "bg-blue-400" : "bg-slate-300";
                      return (
                        <div
                          key={band}
                          className="flex items-center gap-2 text-xs"
                          title={`Band ${band} — ${bandLabel[band]}: ${count} dimension${count !== 1 ? "s" : ""}`}
                        >
                          <span className="w-7 text-muted-foreground font-bold shrink-0">B{band}</span>
                          <div className="flex-1 bg-muted rounded-full h-2">
                            <div className={`${clr} h-2 rounded-full transition-all`} style={{ width: `${pct}%` }} />
                          </div>
                          <span className="w-5 text-right font-bold text-foreground">{count}</span>
                          <span className="w-20 text-muted-foreground/60 text-[10px] hidden sm:block truncate">
                            {bandLabel[band]}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-3 pt-3 border-t border-border">
                    Hover each bar for full label · Bands mapped via getMaturityBand()
                  </p>
                </div>

              </div>
            );
          })()}
        </div>
      </div>

      {/* ═══════════════════════════════════════
          SECTION 4 — 4 Building Blocks
      ═══════════════════════════════════════ */}
      <div className={card}>
        <SectionHeader num={4} icon={<LayoutGrid className="w-4 h-4" />} title="4 Building Blocks" subtitle="Core ESG performance by framework pillar" />
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {blockData.map(({ block, avg, dims, scored }) => {
            const colorCls = BLOCK_COLORS[block] ?? "text-primary bg-primary/10 border-primary/20";
            const pct = (avg / 5) * 100;
            const lowestDims = dims
              .map((d, i) => ({ d, s: scored[i] }))
              .sort((a, b) => a.s - b.s)
              .slice(0, 3);
            return (
              <div key={block} className={`rounded-2xl border p-5 ${colorCls}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="opacity-70">{BLOCK_ICONS[block]}</span>
                    <span className="font-bold text-sm">{block}</span>
                  </div>
                  <span className="text-2xl font-bold">{avg}</span>
                </div>
                {/* Progress bar */}
                <div className="w-full bg-black/10 rounded-full h-2 mb-3">
                  <div className="h-2 rounded-full bg-current opacity-60 transition-all" style={{ width: `${pct}%` }} />
                </div>
                <div className="flex items-center justify-between text-xs opacity-70 mb-3">
                  <span>{dims.length} dimensions · Band {Math.round(avg)}</span>
                  <span>{MATURITY_LABELS[Math.round(avg)] ?? "—"}</span>
                </div>
                {/* Lowest 3 dims */}
                <div className="space-y-1">
                  {lowestDims.map(({ d, s }) => (
                    <div key={d.id} className="flex items-center justify-between text-xs bg-black/5 rounded-lg px-3 py-1.5">
                      <span className="font-medium">{d.id} · {d.name}</span>
                      <span className="font-bold">Band {s}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ═══════════════════════════════════════
          SECTION 5 — GHG Emissions Profile
      ═══════════════════════════════════════ */}
      <div className={card}>
        <SectionHeader num={5} icon={<Leaf className="w-4 h-4" />} title="GHG Emissions Profile" subtitle="Environmental footprint — Dimension D9: GHG Emissions (Scope 1, 2 & 3)" />
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Score dial */}
            <div className="flex flex-col items-center justify-center text-center bg-gradient-to-b from-green-50 to-white border border-green-100 rounded-2xl p-6">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">D9 — GHG Score</p>
              <div className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold mb-3 ${
                ghgScore >= 4 ? "bg-green-100 text-green-700" : ghgScore >= 2 ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"
              }`}>
                {ghgScore}
              </div>
              <p className="text-base font-bold text-foreground">Band {ghgScore}</p>
              <p className="text-sm text-primary font-semibold mt-0.5">{ghgBand?.title}</p>
              <div className="mt-3 w-full bg-muted rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${ghgScore >= 4 ? "bg-green-400" : ghgScore >= 2 ? "bg-blue-400" : "bg-slate-300"}`}
                  style={{ width: `${(ghgScore / 5) * 100}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">{ghgScore}/5 · {MATURITY_LABELS[ghgScore]}</p>
            </div>
            {/* Scope description */}
            <div className="md:col-span-2 bg-muted/30 border border-border rounded-2xl p-6 space-y-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Current Scope Coverage</p>
                <p className="text-sm text-foreground leading-relaxed">{ghgDescriptors[ghgScore]}</p>
              </div>
              <div className="border-t border-border pt-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">GHG Scope Maturity Progression</p>
                <div className="space-y-2">
                  {[0, 1, 2, 3, 4, 5].map(band => (
                    <div key={band} className={`flex items-start gap-3 text-xs rounded-lg px-3 py-2 ${band === ghgScore ? "bg-primary/10 border border-primary/20" : ""}`}>
                      <span className={`font-bold shrink-0 ${band === ghgScore ? "text-primary" : "text-muted-foreground"}`}>B{band}</span>
                      <span className={band === ghgScore ? "text-foreground font-medium" : "text-muted-foreground"}>{ghgDescriptors[band]}</span>
                      {band === ghgScore && <span className="shrink-0 text-[10px] font-bold text-primary">← Current</span>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════
          SECTION 6 — 24-Dimension Scorecard
      ═══════════════════════════════════════ */}
      <div className={card}>
        <SectionHeader num={6} icon={<BarChart3 className="w-4 h-4" />} title="24-Dimension Scorecard" subtitle="Detailed findings across all COSIRI dimensions" />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Dim</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Dimension</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Building Block</th>
                <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-muted-foreground">Band</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Maturity Level</th>
                <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-muted-foreground">Ind. Avg</th>
                <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-muted-foreground">vs Peers</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {COSIRI_DATA.map((dim, idx) => {
                const s = scoreMap[dim.id] ?? 0;
                const ia = benchmark.avg[idx] ?? 2.0;
                const gap = ia - s;
                const vsInd = gap < -0.3 ? "above" : gap > 0.3 ? "below" : "at";
                return (
                  <tr key={dim.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-bold text-muted-foreground text-xs">{dim.id}</td>
                    <td className="px-4 py-3 font-medium text-foreground text-xs max-w-[180px]">{dim.name}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{dim.block}</td>
                    <td className="px-4 py-3 text-center"><ScoreBadge score={s} /></td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                        s >= 4 ? "bg-green-50 text-green-700 border-green-200" :
                        s >= 2 ? "bg-blue-50 text-blue-700 border-blue-200" :
                        "bg-slate-100 text-slate-500 border-slate-200"
                      }`}>
                        {MATURITY_LABELS[s] ?? "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-xs text-muted-foreground font-medium">{ia.toFixed(1)}</td>
                    <td className="px-4 py-3 text-center">
                      {vsInd === "above" && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-50 text-green-700 border border-green-200">▲ Above</span>}
                      {vsInd === "at" && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">◆ At Avg</span>}
                      {vsInd === "below" && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-50 text-red-700 border border-red-200">▼ Below</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ═══════════════════════════════════════
          SECTION 7 — Peer Benchmarking
      ═══════════════════════════════════════ */}
      <div className={card}>
        <SectionHeader num={7} icon={<Target className="w-4 h-4" />} title="Peer Benchmarking" subtitle={`Competitive positioning within ${industry || "your industry"}`} />
        {/* Inline summary stats */}
        <div className="px-6 pt-5 grid grid-cols-3 gap-4 mb-0">
          <div className="bg-muted/30 border border-border rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-foreground">{percentileEst}<span className="text-base text-muted-foreground">th</span></p>
            <p className="text-xs text-muted-foreground mt-1">Estimated percentile</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-green-700">{aboveAvg}</p>
            <p className="text-xs text-green-600 mt-1">Dimensions above avg</p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-red-700">{belowAvg}</p>
            <p className="text-xs text-red-600 mt-1">Dimensions below avg</p>
          </div>
        </div>
        <AiSection type="benchmarking" label="Peer Benchmarking Analysis" insights={insights as any} onGenerate={handleGenerate} generating={generating} />
      </div>

      {/* ═══════════════════════════════════════
          SECTION 8 — Prioritisation Matrix
      ═══════════════════════════════════════ */}
      <div className={card}>
        <SectionHeader num={8} icon={<Target className="w-4 h-4" />} title="Prioritisation Matrix" subtitle="Where to focus first — TIER framework (Theme · Impact · Effort · Relevance)" />
        {/* Compact tier summary */}
        <div className="px-6 pt-5">
          <div className="flex flex-wrap gap-2 mb-4">
            {(["Tier 1", "Tier 2", "Tier 3", "Tier 4"] as const).map(t => {
              const labels: Record<string, string> = { "Tier 1": "Urgent", "Tier 2": "Important", "Tier 3": "Plan", "Tier 4": "Maintain" };
              const count = tierData.filter(d => d.tier === t).length;
              return (
                <span key={t} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${TIER_COLORS[t]}`}>
                  {t} – {labels[t]} <strong>({count})</strong>
                </span>
              );
            })}
          </div>
          {/* Top-8 priority table */}
          <div className="overflow-x-auto mb-0 rounded-xl border border-border">
            <table className="w-full text-xs">
              <thead className="bg-muted/50">
                <tr className="border-b border-border">
                  <th className="px-3 py-2.5 text-left font-bold uppercase tracking-wider text-muted-foreground">#</th>
                  <th className="px-3 py-2.5 text-left font-bold uppercase tracking-wider text-muted-foreground">Dimension</th>
                  <th className="px-3 py-2.5 text-center font-bold uppercase tracking-wider text-muted-foreground">Band</th>
                  <th className="px-3 py-2.5 text-center font-bold uppercase tracking-wider text-muted-foreground">Ind. Avg</th>
                  <th className="px-3 py-2.5 text-center font-bold uppercase tracking-wider text-muted-foreground">Impact</th>
                  <th className="px-3 py-2.5 text-center font-bold uppercase tracking-wider text-muted-foreground">Tier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {tierData.slice(0, 12).map(({ dim, cs, ia, impact, tier }, i) => (
                  <tr key={dim.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-3 py-2.5 font-bold text-muted-foreground">#{i + 1}</td>
                    <td className="px-3 py-2.5">
                      <span className="font-bold text-muted-foreground mr-1">{dim.id}</span>
                      <span className="font-medium text-foreground">{dim.name}</span>
                    </td>
                    <td className="px-3 py-2.5 text-center"><ScoreBadge score={cs} /></td>
                    <td className="px-3 py-2.5 text-center text-muted-foreground">{ia.toFixed(1)}</td>
                    <td className="px-3 py-2.5 text-center">
                      <div className="flex justify-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, j) => (
                          <div key={j} className={`w-2 h-3 rounded-sm ${j < impact ? "bg-purple-400" : "bg-muted"}`} />
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${TIER_COLORS[tier]}`}>{tier}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <AiSection type="tier_matrix" label="TIER Prioritisation Analysis" insights={insights as any} onGenerate={handleGenerate} generating={generating} />
      </div>

      {/* ═══════════════════════════════════════
          SECTION 9 — Transformation Roadmap
      ═══════════════════════════════════════ */}
      <div className={card}>
        <SectionHeader num={9} icon={<TrendingUp className="w-4 h-4" />} title="Transformation Roadmap" subtitle="What to do next — phased improvement plan" />
        <AiSection type="transformation_roadmap" label="Transformation Roadmap" insights={insights as any} onGenerate={handleGenerate} generating={generating} />
      </div>

      {/* ═══════════════════════════════════════
          SECTION 10 — Star Emblem Details
      ═══════════════════════════════════════ */}
      <div className={card}>
        <SectionHeader num={10} icon={<Award className="w-4 h-4" />} title="Star Emblem Details" subtitle="Certification outcome and next milestone" />
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Current emblem */}
          <div className="flex flex-col items-center text-center bg-gradient-to-b from-amber-50 to-white border border-amber-100 rounded-2xl p-6">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">Currently Qualifies For</p>
            <div className="flex gap-1 mb-3">
              {[1, 2, 3, 4, 5].map(i => (
                <Star key={i} className={`w-8 h-8 ${i <= overallScore ? "fill-amber-400 text-amber-400" : "text-slate-200 fill-slate-100"}`} />
              ))}
            </div>
            <p className="text-lg font-bold text-amber-600">{EMBLEM_LABELS[overallScore]?.label}</p>
            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{EMBLEM_LABELS[overallScore]?.desc}</p>
            <div className="mt-4 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 font-medium">
              Valid until: {validUntil.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
            </div>
          </div>

          {/* Next milestone */}
          {overallScore < 5 ? (
            <div className="flex flex-col bg-muted/30 border border-border rounded-2xl p-6">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" /> Next Milestone
              </p>
              <div className="flex gap-1 mb-3">
                {[1, 2, 3, 4, 5].map(i => (
                  <Star key={i} className={`w-6 h-6 ${i <= nextStar ? "fill-amber-300 text-amber-300" : "text-slate-200 fill-slate-100"}`} />
                ))}
              </div>
              <p className="text-base font-bold text-foreground">{EMBLEM_LABELS[nextStar]?.label}</p>
              <p className="text-xs text-muted-foreground mt-1 mb-4">{MATURITY_LABELS[nextStar]} level required</p>
              <p className="text-xs text-muted-foreground">
                Raise combined score by <strong>{neededImprovement} band point{neededImprovement !== 1 ? "s" : ""}</strong> across 24 dimensions to reach average Band {nextStar}.
              </p>
              <div className="mt-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Priority dimensions:</p>
                <div className="flex flex-wrap gap-1">
                  {tierData.slice(0, 4).map(d => (
                    <span key={d.dim.id} className="px-2 py-0.5 rounded text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20">{d.dim.id}</span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
              <Award className="w-12 h-12 text-green-600 mb-3" />
              <p className="text-lg font-bold text-green-700">Maximum Emblem Achieved!</p>
              <p className="text-xs text-green-600 mt-2">You hold the 5-Star COSIRI Emblem — an industry-leading sustainability position.</p>
            </div>
          )}

          {/* Industry positioning */}
          <div className="flex flex-col bg-muted/30 border border-border rounded-2xl p-6">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5" /> Industry Positioning
            </p>
            <p className="text-4xl font-bold text-foreground mb-1">{percentileEst}<span className="text-lg text-muted-foreground">th</span></p>
            <p className="text-xs text-muted-foreground mb-4">Estimated percentile within {industry || "your industry"}</p>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center py-1.5 border-b border-border">
                <span className="text-green-600 font-medium">▲ Above industry avg</span>
                <span className="font-bold text-foreground">{aboveAvg} dimensions</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-border">
                <span className="text-blue-600 font-medium">◆ At industry avg</span>
                <span className="font-bold text-foreground">{atAvg} dimensions</span>
              </div>
              <div className="flex justify-between items-center py-1.5">
                <span className="text-red-500 font-medium">▼ Below industry avg</span>
                <span className="font-bold text-foreground">{belowAvg} dimensions</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Evidence Summary (bonus section) ── */}
      {allEvidence.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Paperclip className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-xl font-bold">Appendix: Evidence Summary</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground text-xs font-semibold">
              {allEvidence.length} file{allEvidence.length !== 1 ? "s" : ""} · {analyzedEvidence.length} AI analysed
            </span>
          </div>
          <div className="space-y-4">
            {COSIRI_DATA.filter(dim => evidenceByDimension[dim.id]?.length > 0).map(dim => {
              const files = evidenceByDimension[dim.id];
              const analysed = files.filter(f => f.summaryStatus === "completed" && f.aiSummary);
              return (
                <div key={dim.id} className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-border bg-muted/20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary">{dim.id}</span>
                      <h3 className="font-semibold text-foreground">{dim.name}</h3>
                    </div>
                    <span className="text-xs text-muted-foreground">{files.length} file{files.length !== 1 ? "s" : ""}{analysed.length > 0 ? ` · ${analysed.length} analysed` : ""}</span>
                  </div>
                  <div className="divide-y divide-border">
                    {files.map(file => (
                      <div key={file.id} className="px-6 py-4">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-medium text-foreground">{file.fileName}</span>
                          {file.summaryStatus === "completed" && (
                            <span className="flex items-center gap-1 text-xs text-green-600 font-medium"><CheckCircle2 className="w-3 h-3" /> AI Analysed</span>
                          )}
                        </div>
                        {file.aiSummary ? (
                          <div className="bg-purple-50 border border-purple-100 rounded-lg p-4">
                            <div className="flex items-center gap-1.5 mb-2">
                              <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600">AI Evidence Summary</span>
                            </div>
                            <p className="text-sm text-foreground leading-relaxed">{file.aiSummary}</p>
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground italic">
                            {file.summaryStatus === "processing" ? "AI analysis in progress…" : "Not yet analysed — open assessment to run AI analysis"}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </AppLayout>
  );
}
