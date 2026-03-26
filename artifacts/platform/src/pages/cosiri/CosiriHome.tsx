import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  Plus, BarChart2, Activity, TrendingUp, TrendingDown, Star,
  Target, Award, ChevronRight, Calendar, Minus, AlertTriangle,
  CheckCircle2, Layers, ShieldCheck, Cpu, Users, Leaf,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Cell,
} from "recharts";
import { AppLayout } from "@/components/layout/AppLayout";
import { useCompany } from "@/contexts/CompanyContext";
import {
  COSIRI_DATA, MATURITY_LABELS, BAND_DESCRIPTIONS,
  getBenchmarkKey, INDUSTRY_BENCHMARKS, DIMENSION_WEIGHTS,
} from "@/lib/cosiri-data";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface Assessment {
  id: number;
  companyName: string;
  industry: string;
  status: string;
  overallScore: number;
  createdAt?: string;
}

interface Answer {
  id: number;
  assessmentId: number;
  dimensionId: string;
  score: number;
  notes?: string;
}

interface AssessmentWithAnswers extends Assessment {
  answers?: Answer[];
}

const BLOCKS = [
  "Strategy & Risk Management",
  "Sustainable Business Processes",
  "Technology",
  "Organisation & Governance",
] as const;

const BLOCK_SHORT: Record<string, string> = {
  "Strategy & Risk Management": "Strategy",
  "Sustainable Business Processes": "Operations",
  "Technology": "Technology",
  "Organisation & Governance": "Governance",
};

const BLOCK_COLOR: Record<string, string> = {
  "Strategy & Risk Management": "#6366f1",
  "Sustainable Business Processes": "#22c55e",
  "Technology": "#8b5cf6",
  "Organisation & Governance": "#f59e0b",
};

const BLOCK_ICON: Record<string, React.ReactNode> = {
  "Strategy & Risk Management":   <ShieldCheck className="w-4 h-4" />,
  "Sustainable Business Processes": <Leaf className="w-4 h-4" />,
  "Technology":                    <Cpu className="w-4 h-4" />,
  "Organisation & Governance":     <Users className="w-4 h-4" />,
};

const BAND_BAR_COLOR: Record<number, string> = {
  5: "#16a34a", 4: "#22c55e", 3: "#3b82f6", 2: "#60a5fa", 1: "#f59e0b", 0: "#94a3b8",
};

const BAND_LABEL: Record<number, string> = {
  5: "Leader", 4: "Advanced", 3: "Intermediate", 2: "Developing", 1: "Beginner", 0: "None",
};

function toDisplayScore(raw: number) {
  return parseFloat((raw / 10).toFixed(1));
}

function getS3Band(score: number): number {
  if (score <= 0)   return 0;
  if (score <= 1.0) return 1;
  if (score <= 2.0) return 2;
  if (score <= 3.0) return 3;
  if (score <= 4.0) return 4;
  return 5;
}

function formatDate(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function StarRow({ count, size = "w-4 h-4" }: { count: number; size?: string }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} className={`${size} ${i <= count ? "fill-amber-400 text-amber-400" : "fill-slate-100 text-slate-200"}`} />
      ))}
    </div>
  );
}

export default function CosiriHome() {
  const { company } = useCompany();

  const { data: assessments = [], isLoading } = useQuery<Assessment[]>({
    queryKey: ["cosiri-assessments", company?.id],
    queryFn: async () => {
      const url = company?.id
        ? `${BASE}/api/cosiri/assessments?companyId=${company.id}`
        : `${BASE}/api/cosiri/assessments`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch assessments");
      return res.json();
    },
  });

  const completed = assessments
    .filter(a => a.status === "completed")
    .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));

  const latest = completed[0];
  const previous = completed[1];
  const latestId = latest?.id ?? 0;

  const { data: latestDetail } = useQuery<AssessmentWithAnswers>({
    queryKey: ["cosiri-assessment-detail", latestId],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/cosiri/assessments/${latestId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch assessment");
      return res.json();
    },
    enabled: !!latestId,
  });

  const answers = latestDetail?.answers ?? [];
  const scoreMap: Record<string, number> = {};
  answers.forEach(a => { scoreMap[a.dimensionId] = a.score; });

  const latestScore = latest ? toDisplayScore(latest.overallScore) : null;
  const previousScore = previous ? toDisplayScore(previous.overallScore) : null;
  const trend = latestScore != null && previousScore != null
    ? parseFloat((latestScore - previousScore).toFixed(1))
    : null;
  const band = latestScore != null ? getS3Band(latestScore) : null;
  const stars = latestScore != null ? Math.round(latestScore) : 0;

  const blockScores = BLOCKS.map(block => {
    const dims = COSIRI_DATA.filter(d => d.block === block);
    const scored = dims.map(d => scoreMap[d.id] ?? 0).filter(s => s > 0);
    const avg = scored.length > 0
      ? parseFloat((scored.reduce((a, b) => a + b, 0) / scored.length).toFixed(2))
      : 0;
    return { block, short: BLOCK_SHORT[block], avg, color: BLOCK_COLOR[block], total: dims.length, answered: scored.length };
  });

  const bestBlock = [...blockScores].sort((a, b) => b.avg - a.avg)[0];
  const weakBlock = [...blockScores].sort((a, b) => a.avg - b.avg)[0];

  const industryKey = latest ? getBenchmarkKey(latest.industry) : "default";
  const benchmark = INDUSTRY_BENCHMARKS[industryKey];

  const blockRadarData = blockScores.map(b => ({
    subject: b.short,
    Score: b.avg,
    "Industry Avg": (() => {
      const dims = COSIRI_DATA.filter(d => d.block === b.block);
      const vals = dims.map((d, i) => {
        const idx = COSIRI_DATA.indexOf(d);
        return benchmark?.avg[idx] ?? 0;
      });
      return parseFloat((vals.reduce((a, v) => a + v, 0) / vals.length).toFixed(2));
    })(),
    fullMark: 5,
  }));

  const bandDistribution = [5, 4, 3, 2, 1, 0].map(b => ({
    band: `Band ${b}`,
    label: BAND_LABEL[b],
    count: COSIRI_DATA.filter(d => (scoreMap[d.id] ?? 0) === b).length,
    fill: BAND_BAR_COLOR[b],
  }));

  const scoreTrend = completed
    .slice()
    .reverse()
    .map((a, i) => ({
      label: a.createdAt ? formatDate(a.createdAt) : `Assessment ${i + 1}`,
      Score: toDisplayScore(a.overallScore),
    }));

  const topOpportunities = COSIRI_DATA
    .map((d, i) => {
      const score = scoreMap[d.id] ?? 0;
      const industryAvg = benchmark?.avg[i] ?? 0;
      const gap = Math.max(0, industryAvg - score);
      const weight = DIMENSION_WEIGHTS[i] ?? 1;
      return {
        dim: d,
        score,
        industryAvg,
        gap: parseFloat(gap.toFixed(1)),
        weight,
        priority: parseFloat((gap * weight).toFixed(2)),
      };
    })
    .filter(d => d.score > 0 || d.gap > 0)
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 5);

  const completionPct = answers.length > 0
    ? Math.round((Object.keys(scoreMap).length / 24) * 100)
    : 0;

  const card = "bg-card border border-border rounded-2xl shadow-sm";

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex justify-center py-20">
          <Activity className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      {/* ─── Header ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">COSIRI Dashboard</h1>
          <p className="text-muted-foreground mt-1">Sustainability maturity overview · {latest?.industry ?? "All industries"}</p>
        </div>
        <Link
          href="/cosiri/assessment"
          className="px-5 py-2.5 rounded-lg font-semibold bg-primary text-primary-foreground shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center gap-2 w-fit"
        >
          <Plus className="w-4 h-4" /> New Assessment
        </Link>
      </div>

      {assessments.length === 0 ? (
        /* ─── Empty State ─── */
        <div className={`${card} p-16 flex flex-col items-center text-center`}>
          <BarChart2 className="w-14 h-14 text-primary/30 mb-5" />
          <h2 className="text-xl font-bold text-foreground mb-2">No assessments yet</h2>
          <p className="text-muted-foreground text-sm mb-6 max-w-sm">
            Run your first COSIRI assessment to see KPIs, maturity scores, and AI-generated insights here.
          </p>
          <Link href="/cosiri/assessment" className="px-5 py-2.5 rounded-lg font-semibold bg-primary text-primary-foreground">
            Start First Assessment
          </Link>
        </div>
      ) : (
        <>
          {/* ════ ROW 1 — Top KPI Cards ════ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">

            {/* KPI 1: Latest Score */}
            <div className={`${card} p-5`}>
              <div className="flex items-center gap-2 mb-3">
                <Activity className="w-4 h-4 text-primary" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Latest Score</span>
              </div>
              {latestScore != null ? (
                <>
                  <div className="text-4xl font-display font-bold text-foreground mb-1">
                    {latestScore}<span className="text-xl text-muted-foreground">/5</span>
                  </div>
                  <StarRow count={stars} />
                  {trend != null && (
                    <p className={`text-sm mt-2 flex items-center gap-1 font-medium ${trend >= 0 ? "text-green-600" : "text-red-500"}`}>
                      {trend >= 0
                        ? <TrendingUp className="w-4 h-4" />
                        : <TrendingDown className="w-4 h-4" />}
                      {trend >= 0 ? "+" : ""}{trend} vs previous
                    </p>
                  )}
                </>
              ) : (
                <p className="text-muted-foreground text-sm mt-2">No completed assessments</p>
              )}
            </div>

            {/* KPI 2: Maturity Band */}
            <div className={`${card} p-5`}>
              <div className="flex items-center gap-2 mb-3">
                <Award className="w-4 h-4 text-amber-500" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Maturity Band</span>
              </div>
              {band != null ? (
                <>
                  <div className="text-2xl font-display font-bold text-foreground mb-1">Band {band}</div>
                  <p className="text-base font-semibold text-amber-600 mb-1">{BAND_DESCRIPTIONS[band]?.title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{BAND_DESCRIPTIONS[band]?.summary}</p>
                </>
              ) : (
                <p className="text-muted-foreground text-sm mt-2">Complete an assessment to see your band</p>
              )}
            </div>

            {/* KPI 3: Assessments Run */}
            <div className={`${card} p-5`}>
              <div className="flex items-center gap-2 mb-3">
                <BarChart2 className="w-4 h-4 text-blue-500" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Assessments Run</span>
              </div>
              <div className="text-4xl font-display font-bold text-foreground mb-1">{assessments.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {completed.length} completed · {assessments.length - completed.length} in progress
              </p>
              {latest?.createdAt && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-2">
                  <Calendar className="w-3 h-3" /> Last: {formatDate(latest.createdAt)}
                </p>
              )}
            </div>

            {/* KPI 4: Assessment Completion */}
            <div className={`${card} p-5`}>
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-4 h-4 text-purple-500" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Dimension Coverage</span>
              </div>
              {latestDetail ? (
                <>
                  <div className="text-4xl font-display font-bold text-foreground mb-2">
                    {Object.keys(scoreMap).length}<span className="text-xl text-muted-foreground">/24</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 mb-2">
                    <div
                      className="bg-purple-500 h-2 rounded-full transition-all"
                      style={{ width: `${completionPct}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">{completionPct}% of dimensions scored</p>
                </>
              ) : (
                <p className="text-muted-foreground text-sm mt-2">No dimension data yet</p>
              )}
            </div>
          </div>

          {/* ════ ROW 2 — Block Scores + Band Distribution ════ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">

            {/* Building Block Radar */}
            <div className={card}>
              <div className="px-5 pt-5 pb-3 border-b border-border">
                <h2 className="font-bold text-sm text-foreground">4 Building Blocks vs Industry Average</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Score per framework pillar (0–5 scale)</p>
              </div>
              <div className="p-5">
                {answers.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={220}>
                      <RadarChart data={blockRadarData} margin={{ top: 8, right: 24, bottom: 8, left: 24 }}>
                        <PolarGrid stroke="hsl(var(--border))" />
                        <PolarAngleAxis
                          dataKey="subject"
                          tick={{ fontSize: 11, fontWeight: 600, fill: "hsl(var(--foreground))" }}
                        />
                        <PolarRadiusAxis domain={[0, 5]} tick={false} axisLine={false} />
                        <Radar name="Your Score" dataKey="Score" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25} />
                        <Radar name="Industry Avg" dataKey="Industry Avg" stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.1} strokeDasharray="4 4" />
                        <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                        <Tooltip formatter={(val: number) => val.toFixed(2)} />
                      </RadarChart>
                    </ResponsiveContainer>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {blockScores.map(b => (
                        <div key={b.block} className="flex items-center gap-2 p-2 rounded-lg bg-muted/40">
                          <span style={{ color: b.color }}>{BLOCK_ICON[b.block]}</span>
                          <div className="min-w-0">
                            <p className="text-[11px] font-semibold text-foreground truncate">{b.short}</p>
                            <p className="text-xs font-bold" style={{ color: b.color }}>{b.avg > 0 ? b.avg.toFixed(1) : "—"}/5</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-sm">
                    <Layers className="w-8 h-8 mb-2 opacity-30" />
                    Complete an assessment to see block scores
                  </div>
                )}
              </div>
            </div>

            {/* Score Distribution */}
            <div className={card}>
              <div className="px-5 pt-5 pb-3 border-b border-border">
                <h2 className="font-bold text-sm text-foreground">Score Distribution — 24 Dimensions</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Number of dimensions per maturity band</p>
              </div>
              <div className="p-5">
                {answers.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart
                        data={bandDistribution}
                        layout="vertical"
                        margin={{ top: 0, right: 24, bottom: 0, left: 0 }}
                        barSize={16}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                        <XAxis type="number" domain={[0, 24]} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                        <YAxis
                          type="category"
                          dataKey="band"
                          width={52}
                          tick={{ fontSize: 11, fontWeight: 600 }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip
                          formatter={(val: number, _name: string, entry: any) =>
                            [`${val} dimension${val !== 1 ? "s" : ""}`, entry.payload.label]
                          }
                          contentStyle={{ fontSize: 12 }}
                        />
                        <Bar dataKey="count" radius={4}>
                          {bandDistribution.map((entry, i) => (
                            <Cell key={i} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {bandDistribution.filter(b => b.count > 0).map(b => (
                        <span
                          key={b.band}
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-white"
                          style={{ backgroundColor: b.fill }}
                        >
                          {b.band}: {b.count} ({b.label})
                        </span>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-sm">
                    <BarChart2 className="w-8 h-8 mb-2 opacity-30" />
                    No dimension scores to display yet
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ════ ROW 3 — Score Trend + Top Opportunities ════ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">

            {/* Score Trend */}
            <div className={card}>
              <div className="px-5 pt-5 pb-3 border-b border-border">
                <h2 className="font-bold text-sm text-foreground">Score Trend Over Time</h2>
                <p className="text-xs text-muted-foreground mt-0.5">COSIRI overall maturity score per assessment</p>
              </div>
              <div className="p-5">
                {scoreTrend.length >= 2 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={scoreTrend} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="label" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                      <YAxis domain={[0, 5]} tickCount={6} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                      <Tooltip formatter={(val: number) => [val.toFixed(1), "Score"]} />
                      <Line
                        type="monotone"
                        dataKey="Score"
                        stroke="#6366f1"
                        strokeWidth={2.5}
                        dot={{ fill: "#6366f1", r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : scoreTrend.length === 1 ? (
                  <div className="flex flex-col items-center justify-center h-40 text-center px-4">
                    <TrendingUp className="w-8 h-8 text-primary/30 mb-2" />
                    <p className="text-sm font-medium text-foreground mb-1">Only one assessment so far</p>
                    <p className="text-xs text-muted-foreground">Run a second assessment to see your progress trend.</p>
                    <div className="mt-4 flex items-center gap-3">
                      <span className="text-2xl font-bold text-foreground">{latestScore}/5</span>
                      <StarRow count={stars} />
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-sm">
                    <TrendingUp className="w-8 h-8 mb-2 opacity-30" />
                    No completed assessments to trend
                  </div>
                )}
              </div>
            </div>

            {/* Top Priority Improvements */}
            <div className={card}>
              <div className="px-5 pt-5 pb-3 border-b border-border">
                <h2 className="font-bold text-sm text-foreground">Top Priority Improvements</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Ranked by gap × sustainability impact weight</p>
              </div>
              <div className="p-5">
                {topOpportunities.length > 0 ? (
                  <div className="space-y-3">
                    {topOpportunities.map((item, idx) => (
                      <div key={item.dim.id} className="flex items-start gap-3">
                        <span className={`shrink-0 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center text-white mt-0.5 ${idx === 0 ? "bg-red-500" : idx === 1 ? "bg-orange-400" : "bg-blue-400"}`}>
                          {idx + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-foreground truncate">{item.dim.name}</p>
                          <p className="text-[10px] text-muted-foreground">{item.dim.block}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-[10px] font-medium text-foreground">
                              Your score: <span className="font-bold">{item.score}/5</span>
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              Industry avg: <span className="font-semibold text-foreground">{item.industryAvg.toFixed(1)}</span>
                            </span>
                            {item.gap > 0 && (
                              <span className="text-[10px] text-red-500 font-semibold flex items-center gap-0.5">
                                <AlertTriangle className="w-2.5 h-2.5" /> −{item.gap}
                              </span>
                            )}
                          </div>
                          <div className="w-full bg-muted rounded-full h-1 mt-1.5">
                            <div
                              className="h-1 rounded-full bg-indigo-500 transition-all"
                              style={{ width: `${(item.score / 5) * 100}%` }}
                            />
                          </div>
                        </div>
                        <span className="shrink-0 text-[10px] font-bold text-muted-foreground bg-muted/60 rounded px-1.5 py-0.5">
                          W×{item.weight}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-sm">
                    <Target className="w-8 h-8 mb-2 opacity-30" />
                    Score dimensions to see priority improvements
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ════ ROW 4 — Block Detail Bars ════ */}
          {answers.length > 0 && (
            <div className={`${card} mb-6`}>
              <div className="px-5 pt-5 pb-3 border-b border-border">
                <h2 className="font-bold text-sm text-foreground">Building Block Breakdown</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Average maturity score per pillar with best-in-class target</p>
              </div>
              <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {blockScores.map(b => {
                  const dims = COSIRI_DATA.filter(d => d.block === b.block);
                  const bicVals = dims.map(d => {
                    const idx = COSIRI_DATA.indexOf(d);
                    return benchmark?.bic[idx] ?? 0;
                  });
                  const bic = parseFloat((bicVals.reduce((a, v) => a + v, 0) / bicVals.length).toFixed(2));
                  const pct = (b.avg / 5) * 100;
                  const bicPct = (bic / 5) * 100;
                  const scoredDims = dims.filter(d => (scoreMap[d.id] ?? 0) > 0);

                  return (
                    <div key={b.block} className="bg-muted/30 rounded-xl p-4 border border-border">
                      <div className="flex items-center gap-2 mb-3">
                        <span style={{ color: b.color }}>{BLOCK_ICON[b.block]}</span>
                        <span className="text-xs font-bold text-foreground">{b.short}</span>
                      </div>
                      <div className="text-2xl font-bold mb-1" style={{ color: b.color }}>
                        {b.avg > 0 ? b.avg.toFixed(1) : "—"}<span className="text-sm font-normal text-muted-foreground">/5</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mb-3">
                        {MATURITY_LABELS[getS3Band(b.avg)] ?? "—"} · {scoredDims.length}/{dims.length} scored
                      </p>
                      <div className="space-y-1.5">
                        <div>
                          <div className="flex justify-between text-[10px] mb-0.5">
                            <span className="font-semibold text-foreground">Your score</span>
                            <span className="font-bold" style={{ color: b.color }}>{b.avg.toFixed(1)}</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div
                              className="h-2 rounded-full transition-all"
                              style={{ width: `${pct}%`, backgroundColor: b.color }}
                            />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-[10px] mb-0.5">
                            <span className="text-muted-foreground">Best-in-class</span>
                            <span className="text-muted-foreground">{bic.toFixed(1)}</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div
                              className="h-2 rounded-full bg-slate-300 transition-all"
                              style={{ width: `${bicPct}%` }}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 space-y-1">
                        {dims
                          .sort((a, b) => (scoreMap[b.id] ?? 0) - (scoreMap[a.id] ?? 0))
                          .slice(0, 3)
                          .map(d => (
                            <div key={d.id} className="flex items-center justify-between gap-2">
                              <span className="text-[10px] text-muted-foreground truncate">{d.name}</span>
                              <span className={`text-[10px] font-bold px-1 rounded ${(scoreMap[d.id] ?? 0) >= 4 ? "text-green-600" : (scoreMap[d.id] ?? 0) >= 2 ? "text-blue-600" : "text-muted-foreground"}`}>
                                {(scoreMap[d.id] ?? 0) > 0 ? `${scoreMap[d.id]}/5` : "—"}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ════ ROW 5 — Assessment History ════ */}
          <div className={card}>
            <div className="px-5 pt-5 pb-3 border-b border-border flex items-center justify-between">
              <div>
                <h2 className="font-bold text-sm text-foreground">Assessment History</h2>
                <p className="text-xs text-muted-foreground mt-0.5">All COSIRI assessments for your organisation</p>
              </div>
              <Link href="/cosiri/reports" className="text-xs text-primary font-semibold flex items-center gap-1 hover:underline">
                All Reports <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-muted/30 border-b border-border">
                  <tr>
                    <th className="px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Date</th>
                    <th className="px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Score</th>
                    <th className="px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Band</th>
                    <th className="px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Stars</th>
                    <th className="px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {assessments.map(a => {
                    const s = toDisplayScore(a.overallScore);
                    const b = getS3Band(s);
                    const st = Math.round(s);
                    return (
                      <tr key={a.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-5 py-3.5 text-sm font-medium text-foreground">
                          {a.createdAt ? formatDate(a.createdAt) : `#${a.id}`}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-sm font-bold text-foreground">{s > 0 ? `${s}/5` : "—"}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          {s > 0 ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary">
                              Band {b} — {BAND_DESCRIPTIONS[b]?.title}
                            </span>
                          ) : <span className="text-muted-foreground text-xs">—</span>}
                        </td>
                        <td className="px-5 py-3.5">
                          <StarRow count={st} size="w-3 h-3" />
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${a.status === "completed" ? "text-green-600" : "text-amber-500"}`}>
                            {a.status === "completed"
                              ? <CheckCircle2 className="w-3.5 h-3.5" />
                              : <Activity className="w-3.5 h-3.5" />}
                            {a.status === "completed" ? "Completed" : "In Progress"}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <Link href={`/cosiri/results/${a.id}`} className="text-xs text-primary font-semibold hover:underline">
                              Results
                            </Link>
                            <Link href={`/cosiri/report/${a.id}`} className="text-xs text-primary font-semibold hover:underline">
                              Report
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </AppLayout>
  );
}
