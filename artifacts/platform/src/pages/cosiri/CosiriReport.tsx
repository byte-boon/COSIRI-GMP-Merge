import React, { useState } from "react";
import QRCode from "react-qr-code";
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

type InsightType = "executive_summary" | "gap_analysis" | "roadmap";

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

  const { data: insights, refetch } = useGetLatestCosiriInsights(id, { query: { enabled: !!id } as any });
  const { mutateAsync: generateInsight } = useGenerateCosiriInsight();
  const { data: assessment } = useGetCosiriAssessment(id, { query: { enabled: !!id } as any });

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

  // ── Corrected display scoring (overallScore stored as avg×10) ──
  const displayScore = parseFloat((overallScore / 10).toFixed(1));
  const starCount    = Math.round(displayScore);
  const maturityBand: number =
    displayScore <= 0 ? 0 : displayScore <= 1 ? 1 : displayScore <= 2 ? 2 :
    displayScore <= 3 ? 3 : displayScore <= 4 ? 4 : 5;
  const bandDesc = BAND_DESCRIPTIONS[maturityBand];
  const bandLabel: Record<number, string> = {
    5: "Leader", 4: "Advanced", 3: "Intermediate", 2: "Developing", 1: "Beginner", 0: "None",
  };

  // Key Criteria top/bottom 3
  const allScored = COSIRI_DATA
    .map(d => ({ dim: d, score: scoreMap[d.id] ?? 0 }))
    .filter(d => d.score > 0)
    .sort((a, b) => b.score - a.score);
  const top3 = allScored.slice(0, 3);
  const bot3 = [...allScored].reverse().slice(0, 3);

  const card = "bg-card border border-border rounded-2xl shadow-sm overflow-hidden";

  return (
    <AppLayout>
      {/* Back link */}
      <div className="mb-5">
        <Link href={`/cosiri/results/${id}`} className="text-sm text-muted-foreground hover:text-primary flex items-center transition-colors w-fit">
          <ChevronLeft className="w-4 h-4 mr-1" /> Back to Results
        </Link>
      </div>
      {/* ════════════════════════════════════════════
          HERO BANNER — Magazine Cover
      ════════════════════════════════════════════ */}
      <div className="relative rounded-3xl overflow-hidden mb-8 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950" />
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "radial-gradient(circle at 18% 55%, rgba(16,185,129,0.5) 0%, transparent 55%), radial-gradient(circle at 82% 15%, rgba(99,102,241,0.4) 0%, transparent 50%)" }} />
        <div className="relative z-10 px-8 py-10 flex items-start justify-between gap-8">
          {/* Left: identity */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-5">
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold uppercase tracking-widest">
                Corporate Sustainability Industry Readiness Index (COSIRI) — Assessment Report
              </span>
              <span className="px-2.5 py-1 rounded-full bg-white/10 text-white/50 text-xs font-mono">
                {siteProfile?.cosiriVersion ?? "COSIRI-24"}
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-1 leading-tight truncate">
              {assessment?.companyName ?? "Your Company"}
            </h1>
            {(siteProfile?.siteName || siteProfile?.location) && (
              <p className="text-emerald-300 font-medium text-lg mb-5">
                {[siteProfile.siteName, siteProfile.location].filter(Boolean).join(" · ")}
              </p>
            )}
            <div className="flex items-center gap-2 mb-4">
              {[1,2,3,4,5].map(i => (
                <Star key={i} className={`w-9 h-9 ${i <= starCount ? "fill-amber-400 text-amber-400" : "text-white/15 fill-white/5"}`} />
              ))}
              <span className="text-white/50 text-sm ml-2">{MATURITY_LABELS[maturityBand] ?? "—"}</span>
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-white/45">
              {siteProfile?.assessmentDate && <span className="flex items-center gap-1.5"><Calendar className="w-3 h-3" />{siteProfile.assessmentDate}</span>}
              {siteProfile?.assessorName && <span className="flex items-center gap-1.5"><User className="w-3 h-3" />{siteProfile.assessorName}{siteProfile.assessorCredentials ? ` · ${siteProfile.assessorCredentials}` : ""}</span>}
              {assessment?.industry && <span className="flex items-center gap-1.5"><Package className="w-3 h-3" />{assessment.industry}</span>}
            </div>
          </div>
          {/* Right: score orb + band + export */}
          <div className="flex flex-col items-center shrink-0">
            <div className="w-36 h-36 rounded-full bg-white/10 border-2 border-white/20 flex flex-col items-center justify-center backdrop-blur-sm mb-4 shadow-inner">
              <span className="text-6xl font-bold text-white leading-none">{displayScore}</span>
              <span className="text-white/40 text-base mt-1">/5</span>
            </div>
            <div className={`px-4 py-2 rounded-full text-xs font-bold mb-4 ${
              maturityBand >= 4 ? "bg-green-400/20 text-green-300 border border-green-400/30" :
              maturityBand >= 2 ? "bg-blue-400/20 text-blue-300 border border-blue-400/30" :
              "bg-slate-400/20 text-slate-300 border border-slate-400/30"
            }`}>
              Band {maturityBand} — {bandDesc?.title}
            </div>
            <button className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl font-medium flex items-center gap-2 text-xs transition-colors">
              <Download className="w-3.5 h-3.5" /> Export PDF
            </button>
            {/* QR Code */}
            <div className="mt-4 flex flex-col items-center gap-1.5">
              <div className="p-2 bg-white rounded-xl shadow-lg">
                <QRCode
                  value={typeof window !== "undefined" ? window.location.href : `report/${id}`}
                  size={80}
                  fgColor="#0f172a"
                  bgColor="#ffffff"
                  level="M"
                />
              </div>
              <p className="text-white/35 text-[10px] tracking-wide uppercase">Scan to share</p>
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════
          KPI STRIP — 5 tiles
      ════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {([
          { label: "Overall Score",       value: `${displayScore}`, sub: "out of 5.0",            color: "text-primary" },
          { label: "Maturity Band",       value: `Band ${maturityBand}`, sub: bandDesc?.title ?? "—", color: maturityBand >= 4 ? "text-green-600" : maturityBand >= 2 ? "text-blue-600" : "text-slate-600" },
          { label: "Industry Percentile", value: `${percentileEst}th`, sub: `vs ${industry || "industry"}`, color: "text-violet-600" },
          { label: "Above Industry Avg",  value: `${aboveAvg}`,     sub: "of 24 dimensions",      color: "text-green-600" },
          { label: "Below Industry Avg",  value: `${belowAvg}`,     sub: "of 24 dimensions",      color: "text-red-500"   },
        ] as const).map(({ label, value, sub, color }) => (
          <div key={label} className={`${card} p-5`}>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">{label}</p>
            <p className={`text-3xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{sub}</p>
          </div>
        ))}
      </div>

      {/* ════════════════════════════════════════════
          TWO-COLUMN BODY
      ════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

        {/* ── LEFT 2/3 ── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Company Profile */}
          <div className={card}>
            <div className="px-6 py-4 border-b border-border bg-muted/20 flex items-center gap-3">
              <Building2 className="w-4 h-4 text-muted-foreground/60" />
              <div><h2 className="font-bold text-base">Company Profile</h2><p className="text-xs text-muted-foreground">Assessment metadata</p></div>
            </div>
            <div className="p-6 grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">
              <ProfileField icon={<Building2 className="w-4 h-4" />} label="Company"          value={assessment?.companyName} />
              <ProfileField icon={<Building2 className="w-4 h-4" />} label="Site"             value={siteProfile?.siteName} />
              <ProfileField icon={<MapPin className="w-4 h-4" />}    label="Location"         value={siteProfile?.location} />
              <ProfileField icon={<Package className="w-4 h-4" />}   label="Industry"         value={assessment?.industry} />
              <ProfileField icon={<Package className="w-4 h-4" />}   label="Sub-Sector"       value={siteProfile?.subSector} />
              <ProfileField icon={<Users className="w-4 h-4" />}     label="Employees"        value={siteProfile?.employeeCount} />
              <ProfileField icon={<Building2 className="w-4 h-4" />} label="Production Area"  value={siteProfile?.productionArea ? `${siteProfile.productionArea} m²` : undefined} />
              <ProfileField icon={<Package className="w-4 h-4" />}   label="Products"         value={siteProfile?.productsManufactured} />
              <ProfileField icon={<User className="w-4 h-4" />}      label="Assessor (CCA)"   value={siteProfile?.assessorName} />
            </div>
          </div>

          {/* 4 Building Blocks */}
          <div className={card}>
            <div className="px-6 py-4 border-b border-border bg-muted/20 flex items-center gap-3">
              <LayoutGrid className="w-4 h-4 text-muted-foreground/60" />
              <div><h2 className="font-bold text-base">4 Building Blocks</h2><p className="text-xs text-muted-foreground">ESG performance by framework pillar</p></div>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {blockData.map(({ block, avg, dims, scored }) => {
                const colorCls = BLOCK_COLORS[block] ?? "text-primary bg-primary/10 border-primary/20";
                const pct = (avg / 5) * 100;
                const lowestDims = dims.map((d, i) => ({ d, s: scored[i] })).sort((a, b) => a.s - b.s).slice(0, 3);
                return (
                  <div key={block} className={`rounded-2xl border p-5 ${colorCls}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="opacity-70">{BLOCK_ICONS[block]}</span>
                        <span className="font-bold text-sm leading-tight">{block}</span>
                      </div>
                      <span className="text-2xl font-bold shrink-0">{avg}</span>
                    </div>
                    <div className="w-full bg-black/10 rounded-full h-2 mb-2">
                      <div className="h-2 rounded-full bg-current opacity-60 transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="flex items-center justify-between text-xs opacity-70 mb-3">
                      <span>{dims.length} dims · Band {Math.round(avg)}</span>
                      <span>{MATURITY_LABELS[Math.round(avg)] ?? "—"}</span>
                    </div>
                    <div className="space-y-1">
                      {lowestDims.map(({ d, s }) => (
                        <div key={d.id} className="flex items-center justify-between text-xs bg-black/5 rounded-lg px-3 py-1.5">
                          <span className="font-medium truncate mr-2">{d.id} · {d.name}</span>
                          <span className="font-bold shrink-0">B{s}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Key Strengths & Gaps */}
          <div className={card}>
            <div className="px-6 py-4 border-b border-border bg-muted/20 flex items-center gap-3">
              <TrendingUp className="w-4 h-4 text-muted-foreground/60" />
              <div><h2 className="font-bold text-base">Key Strengths & Gaps</h2><p className="text-xs text-muted-foreground">Top 3 performing and 3 priority improvement areas</p></div>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-green-600 mb-3">Top Performing Dimensions</p>
                {top3.length === 0 ? <p className="text-xs text-muted-foreground italic">No scores recorded yet.</p> : (
                  <div className="space-y-2">
                    {top3.map(({ dim, score }) => (
                      <div key={dim.id} className="flex items-center gap-3 bg-green-50 border border-green-100 rounded-xl px-4 py-3">
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${score >= 4 ? "bg-green-500 text-white" : "bg-green-200 text-green-800"}`}>{score}</span>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-foreground truncate">{dim.name}</p>
                          <p className="text-[10px] text-muted-foreground">{dim.id} · {MATURITY_LABELS[score]}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-red-500 mb-3">Priority Improvement Areas</p>
                {bot3.length === 0 ? <p className="text-xs text-muted-foreground italic">No scores recorded yet.</p> : (
                  <div className="space-y-2">
                    {bot3.map(({ dim, score }) => (
                      <div key={dim.id} className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${score <= 1 ? "bg-red-500 text-white" : "bg-red-200 text-red-800"}`}>{score}</span>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-foreground truncate">{dim.name}</p>
                          <p className="text-[10px] text-muted-foreground">{dim.id} · {MATURITY_LABELS[score]}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 24-Dimension Scorecard */}
          <div className={card}>
            <div className="px-6 py-4 border-b border-border bg-muted/20 flex items-center gap-3">
              <BarChart3 className="w-4 h-4 text-muted-foreground/60" />
              <div><h2 className="font-bold text-base">24-Dimension Scorecard</h2><p className="text-xs text-muted-foreground">All COSIRI dimensions with industry benchmarks</p></div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr className="border-b border-border">
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Dim</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Dimension</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground hidden lg:table-cell">Block</th>
                    <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-muted-foreground">Band</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Maturity</th>
                    <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-muted-foreground">Ind. Avg</th>
                    <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-muted-foreground">vs Peers</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {COSIRI_DATA.map((dim, idx) => {
                    const s  = scoreMap[dim.id] ?? 0;
                    const ia = benchmark.avg[idx] ?? 2.0;
                    const gap = ia - s;
                    const vsInd = gap < -0.3 ? "above" : gap > 0.3 ? "below" : "at";
                    return (
                      <tr key={dim.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3 font-bold text-muted-foreground text-xs">{dim.id}</td>
                        <td className="px-4 py-3 font-medium text-foreground text-xs max-w-[180px]">{dim.name}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground hidden lg:table-cell">{dim.block}</td>
                        <td className="px-4 py-3 text-center"><ScoreBadge score={s} /></td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                            s >= 4 ? "bg-green-50 text-green-700 border-green-200" :
                            s >= 2 ? "bg-blue-50 text-blue-700 border-blue-200" :
                            "bg-slate-100 text-slate-500 border-slate-200"
                          }`}>{MATURITY_LABELS[s] ?? "—"}</span>
                        </td>
                        <td className="px-4 py-3 text-center text-xs text-muted-foreground font-medium">{ia.toFixed(1)}</td>
                        <td className="px-4 py-3 text-center">
                          {vsInd === "above" && <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-50 text-green-700 border border-green-200">▲ Above</span>}
                          {vsInd === "at"    && <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">◆ At Avg</span>}
                          {vsInd === "below" && <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-50 text-red-700 border border-red-200">▼ Below</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>{/* end LEFT */}

        {/* ── RIGHT SIDEBAR 1/3 ── */}
        <div className="space-y-6">

          {/* Star Emblem */}
          <div className={card}>
            <div className="px-5 py-3 border-b border-border bg-amber-50/60">
              <h2 className="font-bold text-sm flex items-center gap-2"><Award className="w-4 h-4 text-amber-500" /> COSIRI Star Emblem</h2>
            </div>
            <div className="p-5">
              <div className="flex flex-col items-center text-center mb-5">
                <div className="flex gap-1 mb-3">
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} className={`w-8 h-8 ${i <= starCount ? "fill-amber-400 text-amber-400" : "text-slate-200 fill-slate-100"}`} />
                  ))}
                </div>
                <p className="font-bold text-sm text-amber-700">{EMBLEM_LABELS[maturityBand]?.label ?? "—"}</p>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{EMBLEM_LABELS[maturityBand]?.desc}</p>
                <div className="mt-3 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-700 font-medium">
                  Valid until: {validUntil.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </div>
              </div>
              {maturityBand < 5 && (
                <div className="border-t border-border pt-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> Next Milestone
                  </p>
                  <div className="flex gap-1 mb-2">
                    {[1,2,3,4,5].map(i => (
                      <Star key={i} className={`w-5 h-5 ${i <= nextStar ? "fill-amber-300 text-amber-300" : "text-slate-200 fill-slate-100"}`} />
                    ))}
                  </div>
                  <p className="text-xs font-semibold text-foreground">{EMBLEM_LABELS[nextStar]?.label}</p>
                  <p className="text-xs text-muted-foreground mt-1">Raise combined score by <strong>{neededImprovement} band points</strong> across 24 dimensions.</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {tierData.slice(0, 4).map(d => (
                      <span key={d.dim.id} className="px-2 py-0.5 rounded text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20">{d.dim.id}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Score Distribution */}
          <div className={card}>
            <div className="px-5 py-3 border-b border-border bg-muted/20">
              <h2 className="font-bold text-sm flex items-center gap-2"><BarChart3 className="w-4 h-4 text-muted-foreground/60" /> Score Distribution</h2>
              <p className="text-xs text-muted-foreground">Across 24 COSIRI dimensions</p>
            </div>
            <div className="p-5 space-y-2.5">
              {[5,4,3,2,1,0].map(band => {
                const count = COSIRI_DATA.filter(d => (scoreMap[d.id] ?? 0) === band).length;
                const pct   = (count / 24) * 100;
                const clr   = band >= 4 ? "bg-green-400" : band >= 2 ? "bg-blue-400" : "bg-slate-300";
                return (
                  <div key={band} className="flex items-center gap-2 text-xs">
                    <span className="w-7 text-muted-foreground font-bold shrink-0">B{band}</span>
                    <div className="flex-1 bg-muted rounded-full h-2">
                      <div className={`${clr} h-2 rounded-full transition-all`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-5 text-right font-bold text-foreground">{count}</span>
                    <span className="w-20 text-muted-foreground/60 text-[10px] truncate">{bandLabel[band]}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* GHG Profile */}
          <div className={card}>
            <div className="px-5 py-3 border-b border-border bg-green-50/60">
              <h2 className="font-bold text-sm flex items-center gap-2"><Leaf className="w-4 h-4 text-green-600" /> GHG Emissions Profile</h2>
              <p className="text-xs text-muted-foreground">D9 · Scope 1, 2 & 3</p>
            </div>
            <div className="p-5">
              <div className="flex items-center gap-4 mb-3">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold shrink-0 ${
                  ghgScore >= 4 ? "bg-green-100 text-green-700" : ghgScore >= 2 ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"
                }`}>{ghgScore}</div>
                <div>
                  <p className="font-bold text-sm">Band {ghgScore}</p>
                  <p className="text-xs text-primary font-medium">{ghgBand?.title}</p>
                  <div className="w-full bg-muted rounded-full h-1.5 mt-1.5">
                    <div className={`h-1.5 rounded-full ${ghgScore >= 4 ? "bg-green-400" : ghgScore >= 2 ? "bg-blue-400" : "bg-slate-300"}`} style={{ width: `${(ghgScore / 5) * 100}%` }} />
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{ghgDescriptors[ghgScore]}</p>
            </div>
          </div>

          {/* Industry Positioning */}
          <div className={card}>
            <div className="px-5 py-3 border-b border-border bg-muted/20">
              <h2 className="font-bold text-sm flex items-center gap-2"><Target className="w-4 h-4 text-muted-foreground/60" /> Industry Positioning</h2>
            </div>
            <div className="p-5">
              <p className="text-5xl font-bold text-foreground mb-0.5">{percentileEst}<span className="text-xl text-muted-foreground">th</span></p>
              <p className="text-xs text-muted-foreground mb-4">Estimated percentile · {industry || "your industry"}</p>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center py-1.5 border-b border-border">
                  <span className="text-green-600 font-medium">▲ Above avg</span>
                  <span className="font-bold text-foreground">{aboveAvg} dims</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-border">
                  <span className="text-blue-600 font-medium">◆ At avg</span>
                  <span className="font-bold text-foreground">{atAvg} dims</span>
                </div>
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-red-500 font-medium">▼ Below avg</span>
                  <span className="font-bold text-foreground">{belowAvg} dims</span>
                </div>
              </div>
            </div>
          </div>

        </div>{/* end RIGHT */}
      </div>{/* end two-column grid */}

      {/* ════════════════════════════════════════════
          FULL-WIDTH — AI INSIGHTS & PRIORITISATION
      ════════════════════════════════════════════ */}

      {/* Executive Summary */}
      <div className={`${card} mb-6`}>
        <SectionHeader num={1} icon={<FileText className="w-4 h-4" />} title="Executive Summary" subtitle="AI-generated leadership snapshot" />
        <AiSection type="executive_summary" label="Executive Summary" insights={insights as any} onGenerate={handleGenerate} generating={generating} />
      </div>

      {/* Gap Analysis */}
      <div className={`${card} mb-6`}>
        <SectionHeader num={2} icon={<Target className="w-4 h-4" />} title="Gap Analysis" subtitle="Key gaps and strategic priorities" />
        <AiSection type="gap_analysis" label="Gap Analysis" insights={insights as any} onGenerate={handleGenerate} generating={generating} />
      </div>

      {/* Peer Benchmarking */}
      <div className={`${card} mb-6`}>
        <div className="px-6 py-4 border-b border-border bg-muted/20 flex items-center gap-3">
          <span className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center border border-primary/20 shrink-0">3</span>
          <span className="text-muted-foreground/60"><Target className="w-4 h-4" /></span>
          <div>
            <h2 className="font-bold text-base">Peer Benchmarking</h2>
            <p className="text-xs text-muted-foreground">Competitive positioning within {industry || "your industry"}</p>
          </div>
        </div>
        <div className="px-6 pt-5 grid grid-cols-3 gap-4">
          <div className="bg-muted/30 border border-border rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-foreground">{percentileEst}<span className="text-base text-muted-foreground">th</span></p>
            <p className="text-xs text-muted-foreground mt-1">Est. percentile</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-green-700">{aboveAvg}</p>
            <p className="text-xs text-green-600 mt-1">Above industry avg</p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-red-700">{belowAvg}</p>
            <p className="text-xs text-red-600 mt-1">Below industry avg</p>
          </div>
        </div>
        <AiSection type="gap_analysis" label="Peer Benchmarking Analysis" insights={insights as any} onGenerate={handleGenerate} generating={generating} />
      </div>

      {/* Prioritisation Matrix */}
      <div className={`${card} mb-6`}>
        <SectionHeader num={4} icon={<Target className="w-4 h-4" />} title="Prioritisation Matrix" subtitle="TIER framework — Theme · Impact · Effort · Relevance" />
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
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${TIER_COLORS[tier]}`}>{tier}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <AiSection type="executive_summary" label="TIER Prioritisation Analysis" insights={insights as any} onGenerate={handleGenerate} generating={generating} />
      </div>

      {/* Transformation Roadmap */}
      <div className={`${card} mb-8`}>
        <SectionHeader num={5} icon={<TrendingUp className="w-4 h-4" />} title="Transformation Roadmap" subtitle="Phased improvement plan — what to do next" />
        <AiSection type="roadmap" label="Transformation Roadmap" insights={insights as any} onGenerate={handleGenerate} generating={generating} />
      </div>

      {/* ────── Appendix: Evidence ────── */}
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
              const files    = evidenceByDimension[dim.id];
              const analysed = files.filter(f => f.summaryStatus === "completed" && f.aiSummary);
              return (
                <div key={dim.id} className={card}>
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


