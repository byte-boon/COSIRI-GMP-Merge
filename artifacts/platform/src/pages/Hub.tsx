import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  Activity, ShieldCheck, ArrowRight, Star, AlertTriangle,
  FileText, CheckCircle2, TrendingUp, TrendingDown, Award,
  BarChart2, Plus, Target, Layers, Minus,
} from "lucide-react";
import { useCompany } from "@/contexts/CompanyContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { useListGmpAssessments, useListGmpFindings } from "@workspace/api-client-react";
import { BAND_DESCRIPTIONS, getBenchmarkKey, MATURITY_LABELS } from "@/lib/cosiri-data";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface CosiriAssessment {
  id: number;
  companyName: string;
  industry: string;
  status: string;
  overallScore: number;
  createdAt?: string;
}

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

function StarRow({ count, size = "w-3.5 h-3.5" }: { count: number; size?: string }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} className={`${size} ${i <= count ? "fill-amber-400 text-amber-400" : "fill-slate-100 text-slate-200"}`} />
      ))}
    </div>
  );
}

function StatRow({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">{value}</span>
    </div>
  );
}

export default function Hub() {
  const { company } = useCompany();
  if (!company) return null;

  const showCosiri = company.modules === "cosiri" || company.modules === "both";
  const showGmp    = company.modules === "gmp"    || company.modules === "both";

  /* ── COSIRI data ── */
  const { data: cosiriAssessments = [], isLoading: cosiriLoading } = useQuery<CosiriAssessment[]>({
    queryKey: ["cosiri-assessments-hub", company.id],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/cosiri/assessments?companyId=${company.id}`, { credentials: "include" });
      if (!res.ok) throw new Error("fail");
      return res.json();
    },
    enabled: showCosiri,
  });

  const cosiriCompleted = cosiriAssessments
    .filter(a => a.status === "completed")
    .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));

  const latestCosiri = cosiriCompleted[0];
  const prevCosiri   = cosiriCompleted[1];
  const cosiriScore  = latestCosiri ? toDisplayScore(latestCosiri.overallScore) : null;
  const cosiriPrev   = prevCosiri   ? toDisplayScore(prevCosiri.overallScore)   : null;
  const cosiriTrend  = cosiriScore != null && cosiriPrev != null
    ? parseFloat((cosiriScore - cosiriPrev).toFixed(1)) : null;
  const cosiriBand   = cosiriScore != null ? getS3Band(cosiriScore) : null;
  const cosiriStars  = cosiriScore != null ? Math.round(cosiriScore) : 0;

  /* ── GMP data ── */
  const { data: gmpAssessments = [], isLoading: gmpLoading } = useListGmpAssessments();
  const { data: gmpFindings    = [], isLoading: findingsLoading } = useListGmpFindings();

  const companyGmpAssessments = gmpAssessments.filter(a =>
    !company.id || (a as any).companyId === company.id || true
  );

  const totalAudits   = companyGmpAssessments.length;
  const completedAudits = companyGmpAssessments.filter(a => a.status === "completed").length;
  const avgCompliance = totalAudits > 0
    ? Math.round(companyGmpAssessments.reduce((acc, a) => acc + (a.overallScore ?? 0), 0) / totalAudits)
    : 0;

  const openFindings     = gmpFindings.filter(f => f.status === "open").length;
  const criticalFindings = gmpFindings.filter(f => f.severity === "critical").length;
  const closedFindings   = gmpFindings.filter(f => f.status === "closed").length;
  const totalFindings    = gmpFindings.length;

  const card = "bg-card border border-border rounded-2xl shadow-sm";

  return (
    <AppLayout>
      {/* ── Welcome header ── */}
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-foreground">
          Welcome back, {company.name}
        </h1>
        <p className="text-muted-foreground mt-1.5">
          Platform overview · {company.industry} · {[showCosiri && "COSIRI", showGmp && "GMP"].filter(Boolean).join(" + ")} module{(showCosiri && showGmp) ? "s" : ""}
        </p>
      </div>

      {/* ── Module panels ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ════ COSIRI MODULE ════ */}
        {showCosiri && (
          <div className={`${card} flex flex-col`}>
            {/* Module header */}
            <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-gradient-to-r from-primary/5 to-transparent rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-bold text-base text-foreground">COSIRI Index</h2>
                  <p className="text-[11px] text-muted-foreground">24-dimension sustainability maturity</p>
                </div>
              </div>
              <Link
                href="/cosiri"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 transition-colors"
              >
                Open <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* KPIs */}
            <div className="p-6 flex flex-col gap-5 flex-1">
              {cosiriLoading ? (
                <div className="flex items-center justify-center h-32">
                  <Activity className="w-6 h-6 animate-spin text-primary/40" />
                </div>
              ) : cosiriAssessments.length === 0 ? (
                /* Empty state */
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <BarChart2 className="w-10 h-10 text-primary/20 mb-3" />
                  <p className="text-sm font-medium text-foreground mb-1">No COSIRI assessments yet</p>
                  <p className="text-xs text-muted-foreground mb-4">Run your first assessment to see your sustainability maturity score.</p>
                  <Link
                    href="/cosiri/assessment"
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Start Assessment
                  </Link>
                </div>
              ) : (
                <>
                  {/* Top score hero */}
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Latest Score</p>
                      {cosiriScore != null ? (
                        <>
                          <div className="text-4xl font-display font-bold text-foreground">
                            {cosiriScore}<span className="text-xl text-muted-foreground">/5</span>
                          </div>
                          <div className="flex items-center gap-2 mt-1.5">
                            <StarRow count={cosiriStars} />
                            {cosiriTrend != null && (
                              <span className={`text-xs font-semibold flex items-center gap-0.5 ${cosiriTrend >= 0 ? "text-green-600" : "text-red-500"}`}>
                                {cosiriTrend >= 0
                                  ? <TrendingUp className="w-3 h-3" />
                                  : <TrendingDown className="w-3 h-3" />}
                                {cosiriTrend >= 0 ? "+" : ""}{cosiriTrend}
                              </span>
                            )}
                          </div>
                        </>
                      ) : (
                        <p className="text-sm text-muted-foreground">No completed assessments</p>
                      )}
                    </div>
                    {cosiriBand != null && (
                      <div className="text-right shrink-0">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Maturity Band</p>
                        <p className="text-lg font-bold text-foreground">Band {cosiriBand}</p>
                        <p className="text-xs font-semibold text-primary">{BAND_DESCRIPTIONS[cosiriBand]?.title}</p>
                      </div>
                    )}
                  </div>

                  {/* Stats list */}
                  <div className="bg-muted/30 rounded-xl p-4 border border-border">
                    <StatRow
                      label="Assessments run"
                      value={<><span className="font-bold">{cosiriAssessments.length}</span> total · {cosiriCompleted.length} completed</>}
                    />
                    <StatRow
                      label="Maturity label"
                      value={cosiriBand != null ? (MATURITY_LABELS[cosiriBand] ?? "—") : "—"}
                    />
                    <StatRow
                      label="Band description"
                      value={cosiriBand != null ? (BAND_DESCRIPTIONS[cosiriBand]?.summary?.slice(0, 50) + "…") : "—"}
                    />
                    <StatRow
                      label="Industry"
                      value={latestCosiri?.industry ?? company.industry}
                    />
                  </div>

                  {/* Quick links */}
                  <div className="flex gap-2">
                    <Link
                      href="/cosiri"
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-border hover:bg-muted/40 transition-colors"
                    >
                      <BarChart2 className="w-3.5 h-3.5 text-primary" /> Dashboard
                    </Link>
                    {latestCosiri && (
                      <>
                        <Link
                          href={`/cosiri/results/${latestCosiri.id}`}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-border hover:bg-muted/40 transition-colors"
                        >
                          <Target className="w-3.5 h-3.5 text-primary" /> Results
                        </Link>
                        <Link
                          href={`/cosiri/report/${latestCosiri.id}`}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-border hover:bg-muted/40 transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5 text-primary" /> Report
                        </Link>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ════ GMP MODULE ════ */}
        {showGmp && (
          <div className={`${card} flex flex-col`}>
            {/* Module header */}
            <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-gradient-to-r from-blue-500/5 to-transparent rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="font-bold text-base text-foreground">GMP Compliance</h2>
                  <p className="text-[11px] text-muted-foreground">Audit tracker · Findings · CAPA</p>
                </div>
              </div>
              <Link
                href="/gmp"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-600 bg-blue-500/10 hover:bg-blue-500/20 transition-colors"
              >
                Open <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* KPIs */}
            <div className="p-6 flex flex-col gap-5 flex-1">
              {(gmpLoading || findingsLoading) ? (
                <div className="flex items-center justify-center h-32">
                  <Activity className="w-6 h-6 animate-spin text-blue-400/40" />
                </div>
              ) : totalAudits === 0 ? (
                /* Empty state */
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <ShieldCheck className="w-10 h-10 text-blue-500/20 mb-3" />
                  <p className="text-sm font-medium text-foreground mb-1">No GMP audits yet</p>
                  <p className="text-xs text-muted-foreground mb-4">Start your first GMP audit to begin tracking compliance findings.</p>
                  <Link
                    href="/gmp/assessments/new"
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Start Audit
                  </Link>
                </div>
              ) : (
                <>
                  {/* Top compliance hero */}
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Avg Compliance</p>
                      <div className="text-4xl font-display font-bold text-foreground">
                        {avgCompliance}<span className="text-xl text-muted-foreground">%</span>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="w-24 bg-muted rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${avgCompliance >= 80 ? "bg-green-500" : avgCompliance >= 60 ? "bg-amber-400" : "bg-red-500"}`}
                            style={{ width: `${avgCompliance}%` }}
                          />
                        </div>
                        <span className={`text-xs font-semibold ${avgCompliance >= 80 ? "text-green-600" : avgCompliance >= 60 ? "text-amber-500" : "text-red-500"}`}>
                          {avgCompliance >= 80 ? "Good" : avgCompliance >= 60 ? "Fair" : "Needs Work"}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Open Findings</p>
                      <p className={`text-3xl font-display font-bold ${openFindings > 0 ? "text-red-500" : "text-green-600"}`}>
                        {openFindings}
                      </p>
                      {openFindings === 0
                        ? <p className="text-xs text-green-600 font-semibold flex items-center gap-1 justify-end mt-0.5"><CheckCircle2 className="w-3 h-3" /> All clear</p>
                        : <p className="text-xs text-red-500 font-semibold flex items-center gap-1 justify-end mt-0.5"><AlertTriangle className="w-3 h-3" /> Action required</p>
                      }
                    </div>
                  </div>

                  {/* Stats list */}
                  <div className="bg-muted/30 rounded-xl p-4 border border-border">
                    <StatRow
                      label="Total audits"
                      value={<><span className="font-bold">{totalAudits}</span> · {completedAudits} completed</>}
                    />
                    <StatRow
                      label="Total findings"
                      value={<>{totalFindings} total · <span className="text-red-500 font-bold">{openFindings} open</span></>}
                    />
                    <StatRow
                      label="Critical findings"
                      value={
                        criticalFindings > 0
                          ? <span className="text-red-600 font-bold flex items-center gap-1"><AlertTriangle className="w-3 h-3" />{criticalFindings} critical</span>
                          : <span className="text-green-600 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />None</span>
                      }
                    />
                    <StatRow
                      label="CAPA resolved"
                      value={
                        totalFindings > 0
                          ? `${closedFindings} / ${totalFindings} (${Math.round((closedFindings / totalFindings) * 100)}%)`
                          : "—"
                      }
                    />
                  </div>

                  {/* Quick links */}
                  <div className="flex gap-2">
                    <Link
                      href="/gmp"
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-border hover:bg-muted/40 transition-colors"
                    >
                      <BarChart2 className="w-3.5 h-3.5 text-blue-600" /> Dashboard
                    </Link>
                    <Link
                      href="/gmp/assessments"
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-border hover:bg-muted/40 transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5 text-blue-600" /> Audits
                    </Link>
                    <Link
                      href="/gmp/findings"
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-border hover:bg-muted/40 transition-colors"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-blue-600" /> Findings
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Bottom platform KPI row (if both modules active) ── */}
      {showCosiri && showGmp && cosiriAssessments.length > 0 && totalAudits > 0 && (
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className={`${card} p-4 flex flex-col gap-1`}>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">COSIRI Score</p>
            <p className="text-2xl font-bold text-foreground">{cosiriScore ?? "—"}<span className="text-sm text-muted-foreground">/5</span></p>
            <StarRow count={cosiriStars} size="w-3 h-3" />
          </div>
          <div className={`${card} p-4 flex flex-col gap-1`}>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Maturity Band</p>
            <p className="text-2xl font-bold text-foreground">{cosiriBand != null ? `Band ${cosiriBand}` : "—"}</p>
            <p className="text-xs text-primary font-medium">{cosiriBand != null ? BAND_DESCRIPTIONS[cosiriBand]?.title : ""}</p>
          </div>
          <div className={`${card} p-4 flex flex-col gap-1`}>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">GMP Compliance</p>
            <p className="text-2xl font-bold text-foreground">{avgCompliance}<span className="text-sm text-muted-foreground">%</span></p>
            <p className={`text-xs font-medium ${avgCompliance >= 80 ? "text-green-600" : avgCompliance >= 60 ? "text-amber-500" : "text-red-500"}`}>
              {avgCompliance >= 80 ? "Strong" : avgCompliance >= 60 ? "Moderate" : "Needs attention"}
            </p>
          </div>
          <div className={`${card} p-4 flex flex-col gap-1`}>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Open Findings</p>
            <p className={`text-2xl font-bold ${openFindings > 0 ? "text-red-500" : "text-green-600"}`}>{openFindings}</p>
            <p className="text-xs text-muted-foreground">{totalFindings} total findings</p>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
