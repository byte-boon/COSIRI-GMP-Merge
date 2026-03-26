import { useRoute } from "wouter";
import { Link } from "wouter";
import { Activity, Download, ChevronLeft, Bot, Map, Star, Award, TrendingUp, Target, BarChart3 } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { CosiriRadar } from "@/components/CosiriRadar";
import { CosiriRadarBenchmark } from "@/components/CosiriRadarBenchmark";
import { COSIRI_DATA, BAND_DESCRIPTIONS, MATURITY_LABELS, INDUSTRY_BENCHMARKS, getBenchmarkKey, DIMENSION_WEIGHTS } from "@/lib/cosiri-data";
import { useGetCosiriAssessment } from "@workspace/api-client-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const BAND_BADGE_COLORS: Record<string, string> = {
  high: "bg-green-100 text-green-700",
  mid: "bg-blue-100 text-blue-700",
  low: "bg-red-100 text-red-700",
};

function getBadgeClass(score: number) {
  if (score >= 4) return BAND_BADGE_COLORS.high;
  if (score >= 2) return BAND_BADGE_COLORS.mid;
  return BAND_BADGE_COLORS.low;
}

const TIER_COLORS: Record<string, string> = {
  "Tier 1": "bg-red-50 text-red-700 border-red-200",
  "Tier 2": "bg-orange-50 text-orange-700 border-orange-200",
  "Tier 3": "bg-blue-50 text-blue-700 border-blue-200",
  "Tier 4": "bg-green-50 text-green-700 border-green-200",
};

const EMBLEM_LABELS: Record<number, { label: string; color: string; desc: string }> = {
  0: { label: "Not Yet Awarded", color: "text-slate-400", desc: "Complete the assessment to qualify for your first emblem." },
  1: { label: "1-Star Emblem", color: "text-amber-400", desc: "Initial sustainability awareness is demonstrated." },
  2: { label: "2-Star Emblem", color: "text-amber-400", desc: "Structured sustainability plans are forming." },
  3: { label: "3-Star Emblem", color: "text-amber-500", desc: "Sustainability is integrated into core operations." },
  4: { label: "4-Star Emblem", color: "text-amber-500", desc: "Advanced optimisation with data-driven sustainability." },
  5: { label: "5-Star Emblem", color: "text-amber-600", desc: "Industry-leading sustainability performance." },
};

export default function CosiriResults() {
  const [, params] = useRoute("/cosiri/results/:id");
  const id = params?.id ? parseInt(params.id) : 0;

  const { data: assessment, isLoading } = useGetCosiriAssessment(id, { query: { enabled: !!id } });

  if (isLoading) return <AppLayout><div className="flex justify-center py-20"><Activity className="w-8 h-8 animate-spin text-primary" /></div></AppLayout>;
  if (!assessment) return <AppLayout><div>Assessment not found</div></AppLayout>;

  const score = assessment.overallScore;
  const industry = assessment.industry ?? "";
  const benchKey = getBenchmarkKey(industry);
  const benchmark = INDUSTRY_BENCHMARKS[benchKey] ?? INDUSTRY_BENCHMARKS.default;

  const radarData = COSIRI_DATA.map(dim => {
    const answer = assessment.answers?.find((a: { dimensionId: string; score: number }) => a.dimensionId === dim.id);
    return {
      subject: dim.name,
      score: answer ? answer.score : 0,
      fullMark: 5,
    };
  });

  const benchmarkRadarData = COSIRI_DATA.map((dim, idx) => {
    const answer = assessment.answers?.find((a: { dimensionId: string; score: number }) => a.dimensionId === dim.id);
    return {
      subject: dim.name,
      company: answer ? answer.score : 0,
      industryAvg: parseFloat((benchmark.avg[idx] ?? 2.0).toFixed(1)),
      bestInClass: parseFloat((benchmark.bic[idx] ?? 4.0).toFixed(1)),
    };
  });

  // Emblem suggestion: what score the company needs for the next star
  const nextStar = Math.min(5, score + 1);
  const currentTotal = COSIRI_DATA.reduce((sum, dim) => {
    const a = assessment.answers?.find((ans: { dimensionId: string; score: number }) => ans.dimensionId === dim.id);
    return sum + (a ? a.score : 0);
  }, 0);
  const targetTotal = nextStar * COSIRI_DATA.length;
  const neededImprovement = Math.max(0, targetTotal - currentTotal);
  const validUntil = new Date();
  validUntil.setFullYear(validUntil.getFullYear() + 2);

  // TIER matrix — compute priority per dimension
  const tierData = COSIRI_DATA.map((dim, idx) => {
    const answer = assessment.answers?.find((a: { dimensionId: string; score: number }) => a.dimensionId === dim.id);
    const companyScore = answer ? answer.score : 0;
    const industryAvg = benchmark.avg[idx] ?? 2.0;
    const bic = benchmark.bic[idx] ?? 4.0;
    const gap = industryAvg - companyScore;
    const bicGap = bic - companyScore;
    const impact = DIMENSION_WEIGHTS[idx] ?? 2;
    const priorityScore = gap * impact;

    let tier: "Tier 1" | "Tier 2" | "Tier 3" | "Tier 4";
    if (gap > 0.5 && impact >= 4) tier = "Tier 1";
    else if (gap > 0.5 || (gap > 0 && impact >= 4)) tier = "Tier 2";
    else if (gap > 0) tier = "Tier 3";
    else tier = "Tier 4";

    const vsIndustry = gap < -0.3 ? "above" : gap > 0.3 ? "below" : "at";

    return { dim, companyScore, industryAvg, bic, gap, bicGap, impact, priorityScore, tier, vsIndustry };
  }).sort((a, b) => b.priorityScore - a.priorityScore);

  // Percentile estimate: count dimensions above/at/below industry avg
  const aboveAvg = tierData.filter(d => d.vsIndustry === "above").length;
  const belowAvg = tierData.filter(d => d.vsIndustry === "below").length;
  const atAvg = tierData.filter(d => d.vsIndustry === "at").length;
  const percentileEst = Math.round(((aboveAvg + atAvg * 0.5) / 24) * 100);

  return (
    <AppLayout>
      <div className="mb-6">
        <Link href="/cosiri" className="text-sm text-muted-foreground hover:text-primary flex items-center mb-4 transition-colors">
          <ChevronLeft className="w-4 h-4 mr-1" /> Back to Dashboard
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold">Assessment Results</h1>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map(i => (
                  <Star key={i} className={`w-5 h-5 ${i <= score ? "fill-amber-400 text-amber-400" : "text-muted-foreground/25"}`} />
                ))}
              </div>
              <span className="text-sm font-semibold text-muted-foreground">Band {score} — {MATURITY_LABELS[score] ?? ""}</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                {BAND_DESCRIPTIONS[Math.round(score)]?.title ?? ""}
              </span>
            </div>
          </div>
          <div className="flex gap-3 flex-wrap">
            <Link href={`/cosiri/roadmap/${id}`} className="px-4 py-2 bg-card border border-border shadow-sm rounded-lg font-medium text-foreground hover:bg-muted transition-colors flex items-center gap-2">
              <Map className="w-4 h-4 text-emerald-500" /> Improvement Roadmap
            </Link>
            <Link href={`/cosiri/report/${id}`} className="px-4 py-2 bg-card border border-border shadow-sm rounded-lg font-medium text-foreground hover:bg-muted transition-colors flex items-center gap-2">
              <Bot className="w-4 h-4 text-purple-500" /> AI Insights
            </Link>
            <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium shadow-md shadow-primary/20 flex items-center gap-2 hover:bg-primary/90 transition-colors">
              <Download className="w-4 h-4" /> Export PDF
            </button>
          </div>
        </div>
      </div>

      {/* ── COSIRI Star Emblem ── */}
      <div className="mb-6 bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-muted/20 flex items-center gap-3">
          <Award className="w-5 h-5 text-amber-500" />
          <h2 className="font-bold text-base">COSIRI Star Emblem</h2>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Current emblem */}
          <div className="flex flex-col items-center text-center bg-gradient-to-b from-amber-50 to-white border border-amber-100 rounded-2xl p-6">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">Currently Qualifies For</p>
            <div className="flex gap-1 mb-3">
              {[1, 2, 3, 4, 5].map(i => (
                <Star key={i} className={`w-8 h-8 ${i <= score ? "fill-amber-400 text-amber-400" : "text-slate-200 fill-slate-100"}`} />
              ))}
            </div>
            <p className={`text-lg font-bold ${EMBLEM_LABELS[score]?.color}`}>{EMBLEM_LABELS[score]?.label}</p>
            <p className="text-xs text-muted-foreground mt-1.5">{EMBLEM_LABELS[score]?.desc}</p>
            <div className="mt-4 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 font-medium">
              Valid until: {validUntil.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
            </div>
          </div>

          {/* Next star target */}
          {score < 5 && (
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
              <p className="text-xs text-muted-foreground mt-1 mb-4">{MATURITY_LABELS[nextStar]} level across all dimensions</p>
              <div className="space-y-2">
                <p className="text-xs font-semibold text-foreground">What's needed:</p>
                <p className="text-xs text-muted-foreground">
                  Raise your combined score by <strong>{neededImprovement} band point{neededImprovement !== 1 ? "s" : ""}</strong> across your 24 dimensions to reach an average of Band {nextStar}.
                </p>
                <div className="mt-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Suggested focus areas:</p>
                  <div className="flex flex-wrap gap-1">
                    {tierData.slice(0, 4).map(d => (
                      <span key={d.dim.id} className="px-2 py-0.5 rounded text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20">
                        {d.dim.id}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Percentile summary */}
          <div className="flex flex-col bg-muted/30 border border-border rounded-2xl p-6">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5" /> Industry Positioning
            </p>
            <p className="text-4xl font-bold text-foreground mb-1">{percentileEst}<span className="text-lg text-muted-foreground">th</span></p>
            <p className="text-xs text-muted-foreground mb-4">Estimated percentile within {industry || "your industry"}</p>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-green-600 font-medium">Above industry avg</span>
                <span className="font-bold text-foreground">{aboveAvg} dimensions</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-blue-600 font-medium">At industry avg</span>
                <span className="font-bold text-foreground">{atAvg} dimensions</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-red-500 font-medium">Below industry avg</span>
                <span className="font-bold text-foreground">{belowAvg} dimensions</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Band legend */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[0, 1, 2, 3, 4, 5].map(s => (
          <Tooltip key={s} delayDuration={150}>
            <TooltipTrigger asChild>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold cursor-help border ${
                s >= 4 ? "bg-green-50 text-green-700 border-green-200" :
                s >= 2 ? "bg-blue-50 text-blue-700 border-blue-200" :
                "bg-slate-100 text-slate-600 border-slate-200"
              }`}>
                Band {s} · {BAND_DESCRIPTIONS[s].title}
              </span>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs bg-popover text-popover-foreground border border-border rounded-xl shadow-xl p-0 overflow-hidden">
              <div className="px-4 pt-3 pb-2 border-b border-border bg-muted/40">
                <p className="font-bold text-sm text-foreground">Band {s} — {BAND_DESCRIPTIONS[s].title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{BAND_DESCRIPTIONS[s].summary}</p>
              </div>
              <div className="px-4 py-3 space-y-2">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">Criteria</p>
                  <p className="text-xs text-foreground leading-snug">{BAND_DESCRIPTIONS[s].criteria}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">Evidence</p>
                  <p className="text-xs text-foreground leading-snug">{BAND_DESCRIPTIONS[s].evidence}</p>
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>

      {/* Maturity Profile + Dimension Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold text-lg mb-6">Maturity Profile</h3>
          <CosiriRadar data={radarData} />
        </div>

        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-border bg-muted/20">
            <h3 className="font-bold text-lg">Dimension Breakdown</h3>
            <p className="text-xs text-muted-foreground mt-1">Hover a score to see band requirements</p>
          </div>
          <div className="p-0 overflow-y-auto max-h-[400px]">
            <table className="w-full text-left text-sm">
              <tbody className="divide-y divide-border">
                {radarData.map(item => (
                  <tr key={item.subject} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 font-medium max-w-[140px] truncate text-xs" title={item.subject}>{item.subject}</td>
                    <td className="py-2 px-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        item.score >= 4 ? "bg-green-50 text-green-700 border border-green-200" :
                        item.score >= 2 ? "bg-blue-50 text-blue-700 border border-blue-200" :
                        "bg-slate-100 text-slate-500 border border-slate-200"
                      }`}>
                        {MATURITY_LABELS[item.score] ?? "—"}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Tooltip delayDuration={150}>
                        <TooltipTrigger asChild>
                          <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full font-bold text-sm cursor-help ${getBadgeClass(item.score)}`}>
                            {item.score}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="left" className="max-w-xs bg-popover text-popover-foreground border border-border rounded-xl shadow-xl p-0 overflow-hidden">
                          <div className="px-4 pt-3 pb-2 border-b border-border bg-muted/40">
                            <p className="font-bold text-sm text-foreground">Band {item.score} — {BAND_DESCRIPTIONS[item.score].title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{item.subject}</p>
                          </div>
                          <div className="px-4 py-3 space-y-2">
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">Level Summary</p>
                              <p className="text-xs text-foreground leading-snug">{BAND_DESCRIPTIONS[item.score].summary}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">Criteria</p>
                              <p className="text-xs text-foreground leading-snug">{BAND_DESCRIPTIONS[item.score].criteria}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">Evidence Required</p>
                              <p className="text-xs text-foreground leading-snug">{BAND_DESCRIPTIONS[item.score].evidence}</p>
                            </div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Industry Benchmarking ── */}
      <div className="mb-8 bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-muted/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Target className="w-5 h-5 text-primary" />
            <div>
              <h2 className="font-bold text-base">Industry Benchmarking</h2>
              <p className="text-xs text-muted-foreground">Comparing against {industry || "your industry"} peers</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-primary inline-block" /> Your Score</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-400 inline-block" /> Industry Avg</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-green-500 inline-block" /> Best-in-Class</span>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-border">
          {/* Benchmark radar */}
          <div className="p-6">
            <CosiriRadarBenchmark data={benchmarkRadarData} />
          </div>

          {/* Percentile table */}
          <div className="overflow-y-auto max-h-[480px]">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-muted/60 backdrop-blur-sm">
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Dimension</th>
                  <th className="px-3 py-3 text-center text-xs font-bold uppercase tracking-wider text-muted-foreground">You</th>
                  <th className="px-3 py-3 text-center text-xs font-bold uppercase tracking-wider text-muted-foreground">Ind. Avg</th>
                  <th className="px-3 py-3 text-center text-xs font-bold uppercase tracking-wider text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {tierData.map(({ dim, companyScore, industryAvg, vsIndustry }) => (
                  <tr key={dim.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-2.5 text-xs font-medium text-foreground">
                      <span className="text-muted-foreground font-bold mr-1.5">{dim.id}</span>
                      {dim.name}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${getBadgeClass(companyScore)}`}>
                        {companyScore}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-center text-xs font-medium text-muted-foreground">{industryAvg.toFixed(1)}</td>
                    <td className="px-3 py-2.5 text-center">
                      {vsIndustry === "above" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-50 text-green-700 border border-green-200">
                          ▲ Above
                        </span>
                      )}
                      {vsIndustry === "at" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                          ◆ At Avg
                        </span>
                      )}
                      {vsIndustry === "below" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-50 text-red-700 border border-red-200">
                          ▼ Below
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── TIER Prioritisation Matrix ── */}
      <div className="mb-8 bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-muted/20 flex items-center gap-3">
          <Target className="w-5 h-5 text-purple-500" />
          <div>
            <h2 className="font-bold text-base">TIER Prioritisation Matrix</h2>
            <p className="text-xs text-muted-foreground">Theme · Impact · Effort · Relevance — prioritised by gap from industry avg × sustainability impact</p>
          </div>
        </div>
        <div className="p-6">
          {/* Tier summary chips */}
          <div className="flex flex-wrap gap-2 mb-5">
            {(["Tier 1", "Tier 2", "Tier 3", "Tier 4"] as const).map(t => {
              const count = tierData.filter(d => d.tier === t).length;
              const labels: Record<string, string> = {
                "Tier 1": "Urgent", "Tier 2": "Important", "Tier 3": "Plan", "Tier 4": "Maintain",
              };
              return (
                <span key={t} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${TIER_COLORS[t]}`}>
                  {t} – {labels[t]} <span className="font-bold">({count})</span>
                </span>
              );
            })}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="pb-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Priority</th>
                  <th className="pb-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground pl-4">Dimension</th>
                  <th className="pb-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground pl-3">Block</th>
                  <th className="pb-3 text-center text-xs font-bold uppercase tracking-wider text-muted-foreground">Your Band</th>
                  <th className="pb-3 text-center text-xs font-bold uppercase tracking-wider text-muted-foreground">Ind. Avg</th>
                  <th className="pb-3 text-center text-xs font-bold uppercase tracking-wider text-muted-foreground">Impact</th>
                  <th className="pb-3 text-center text-xs font-bold uppercase tracking-wider text-muted-foreground">Tier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {tierData.map(({ dim, companyScore, industryAvg, impact, tier }, idx) => (
                  <tr key={dim.id} className="hover:bg-muted/20 transition-colors">
                    <td className="py-3 pr-3 font-bold text-muted-foreground text-sm w-8">#{idx + 1}</td>
                    <td className="py-3 pl-4">
                      <div>
                        <span className="text-[10px] font-bold text-muted-foreground mr-1.5">{dim.id}</span>
                        <span className="font-medium text-foreground text-xs">{dim.name}</span>
                      </div>
                    </td>
                    <td className="py-3 pl-3 text-xs text-muted-foreground max-w-[130px] truncate">{dim.block}</td>
                    <td className="py-3 text-center">
                      <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${getBadgeClass(companyScore)}`}>
                        {companyScore}
                      </span>
                    </td>
                    <td className="py-3 text-center text-xs text-muted-foreground font-medium">{industryAvg.toFixed(1)}</td>
                    <td className="py-3 text-center">
                      <div className="flex justify-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <div key={i} className={`w-2 h-3 rounded-sm ${i < impact ? "bg-purple-400" : "bg-muted"}`} />
                        ))}
                      </div>
                    </td>
                    <td className="py-3 text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border ${TIER_COLORS[tier]}`}>
                        {tier}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
