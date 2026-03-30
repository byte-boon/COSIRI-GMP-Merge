import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  Activity, ShieldCheck, ArrowRight, Star, AlertTriangle,
  FileText, CheckCircle2, TrendingUp, TrendingDown,
  BarChart2, Plus, Target, ClipboardCheck, ArrowLeftRight,
  Layers, Zap,
} from "lucide-react";
import { useCompany } from "@/contexts/CompanyContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { useListGmpAssessments, useListGmpFindings } from "@workspace/api-client-react";
import { BAND_DESCRIPTIONS, MATURITY_LABELS } from "@/lib/cosiri-data";

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

function StatPill({ label, value, accent }: { label: string; value: React.ReactNode; accent?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className={`text-sm font-bold ${accent ?? "text-foreground"}`}>{value}</span>
    </div>
  );
}

export default function Hub() {
  const { company } = useCompany();
  if (!company) return null;

  // Hub always shows both modules as the unified overview page
  const card = "bg-card border border-border rounded-2xl shadow-sm";

  /* ── COSIRI data ── */
  const { data: cosiriAssessments = [], isLoading: cosiriLoading } = useQuery<CosiriAssessment[]>({
    queryKey: ["cosiri-assessments-hub", company.id],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/cosiri/assessments?companyId=${company.id}`, { credentials: "include" });
      if (!res.ok) throw new Error("fail");
      return res.json();
    },
    enabled: !!company.id,
  });

  const cosiriCompleted = cosiriAssessments
    .filter(a => a.status === "completed")
    .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
  const latestCosiri = cosiriCompleted[0];
  const prevCosiri   = cosiriCompleted[1];
  const cosiriScore  = latestCosiri ? toDisplayScore(latestCosiri.overallScore) : null;
  const cosiriPrev   = prevCosiri   ? toDisplayScore(prevCosiri.overallScore)   : null;
  const cosiriTrend  = cosiriScore != null && cosiriPrev != null ? parseFloat((cosiriScore - cosiriPrev).toFixed(1)) : null;
  const cosiriBand   = cosiriScore != null ? getS3Band(cosiriScore) : null;
  const cosiriStars  = cosiriScore != null ? Math.round(cosiriScore) : 0;

  /* ── GMP data ── */
  const { data: gmpAssessments = [], isLoading: gmpLoading } = useListGmpAssessments();
  const { data: gmpFindings    = [], isLoading: findingsLoading } = useListGmpFindings();

  const totalAudits     = gmpAssessments.length;
  const completedAudits = gmpAssessments.filter(a => a.status === "completed").length;
  const avgCompliance   = totalAudits > 0
    ? Math.round(gmpAssessments.reduce((acc, a) => acc + (a.overallScore ?? 0), 0) / totalAudits)
    : 0;
  const openFindings     = gmpFindings.filter(f => f.status === "open").length;
  const criticalFindings = gmpFindings.filter(f => f.severity === "critical").length;
  const closedFindings   = gmpFindings.filter(f => f.status === "closed").length;
  const totalFindings    = gmpFindings.length;
  const latestGmpAudit   = [...gmpAssessments].sort((a, b) =>
    ((b as any).createdAt ?? "").localeCompare((a as any).createdAt ?? "")
  )[0];

  const hasCosiriData = cosiriAssessments.length > 0;
  const hasGmpData    = totalAudits > 0;

  return (
    <AppLayout>

      {/* ── Welcome header ── */}
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-foreground">Platform Hub</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {company.name} · {company.industry} · COSIRI + GMP
        </p>
      </div>

      {/* ── Combined KPI banner ── */}
      {(hasCosiriData || hasGmpData) && (
        <div className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className={`${card} p-4 flex flex-col gap-2`}>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
                <Activity className="w-3.5 h-3.5 text-primary" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">COSIRI Score</span>
            </div>
            <p className="text-2xl font-display font-bold text-foreground leading-none">
              {cosiriScore ?? "—"}<span className="text-sm text-muted-foreground font-normal">/5</span>
            </p>
            {cosiriScore != null && <StarRow count={cosiriStars} size="w-3 h-3" />}
          </div>

          <div className={`${card} p-4 flex flex-col gap-2`}>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
                <Layers className="w-3.5 h-3.5 text-primary" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Maturity Band</span>
            </div>
            <p className="text-2xl font-display font-bold text-foreground leading-none">
              {cosiriBand != null ? `Band ${cosiriBand}` : "—"}
            </p>
            {cosiriBand != null && (
              <p className="text-[11px] text-primary font-semibold">{BAND_DESCRIPTIONS[cosiriBand]?.title}</p>
            )}
          </div>

          <div className={`${card} p-4 flex flex-col gap-2`}>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-blue-500/10 flex items-center justify-center">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">GMP Compliance</span>
            </div>
            <p className="text-2xl font-display font-bold text-foreground leading-none">
              {hasGmpData ? <>{avgCompliance}<span className="text-sm text-muted-foreground font-normal">%</span></> : "—"}
            </p>
            {hasGmpData && (
              <p className={`text-[11px] font-semibold ${avgCompliance >= 80 ? "text-green-600" : avgCompliance >= 60 ? "text-amber-500" : "text-red-500"}`}>
                {avgCompliance >= 80 ? "Strong" : avgCompliance >= 60 ? "Moderate" : "Needs attention"}
              </p>
            )}
          </div>

          <div className={`${card} p-4 flex flex-col gap-2`}>
            <div className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-md flex items-center justify-center ${openFindings > 0 ? "bg-red-500/10" : "bg-green-500/10"}`}>
                <AlertTriangle className={`w-3.5 h-3.5 ${openFindings > 0 ? "text-red-500" : "text-green-600"}`} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Open Findings</span>
            </div>
            <p className={`text-2xl font-display font-bold leading-none ${openFindings > 0 ? "text-red-500" : "text-green-600"}`}>
              {openFindings}
            </p>
            <p className="text-[11px] text-muted-foreground">{totalFindings} total findings</p>
          </div>
        </div>
      )}

      {/* ── Module cards — always show both ── */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">

        {/* ════ COSIRI ════ */}
        <div className={`${card} flex flex-col overflow-hidden`}>
          <div className="px-6 py-5 bg-gradient-to-r from-primary/8 via-primary/4 to-transparent border-b border-border">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                  <Activity className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-bold text-base text-foreground">COSIRI Index</h2>
                  <p className="text-[11px] text-muted-foreground">24-dimension sustainability maturity · Band 0–5</p>
                </div>
              </div>
              <Link
                href="/cosiri"
                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 transition-colors"
              >
                Dashboard <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <div className="p-6 flex flex-col gap-5 flex-1">
            {cosiriLoading ? (
              <div className="flex items-center justify-center h-28">
                <Activity className="w-5 h-5 animate-spin text-primary/30" />
              </div>
            ) : !hasCosiriData ? (
              <div className="flex flex-col items-center justify-center py-8 text-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-primary/8 flex items-center justify-center">
                  <BarChart2 className="w-6 h-6 text-primary/40" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">No assessments yet</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Start your first COSIRI assessment to benchmark sustainability maturity.</p>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Latest Score</p>
                    {cosiriScore != null ? (
                      <>
                        <div className="text-4xl font-display font-bold text-foreground">
                          {cosiriScore}<span className="text-xl text-muted-foreground">/5</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1.5">
                          <StarRow count={cosiriStars} />
                          {cosiriTrend != null && (
                            <span className={`text-xs font-semibold flex items-center gap-0.5 ${cosiriTrend >= 0 ? "text-green-600" : "text-red-500"}`}>
                              {cosiriTrend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                              {cosiriTrend >= 0 ? "+" : ""}{cosiriTrend} vs prev
                            </span>
                          )}
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">No completed assessments</p>
                    )}
                  </div>
                  {cosiriBand != null && (
                    <div className="text-right shrink-0 bg-primary/6 rounded-xl px-4 py-3">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">Band</p>
                      <p className="text-2xl font-bold text-foreground">{cosiriBand}</p>
                      <p className="text-[11px] font-semibold text-primary">{BAND_DESCRIPTIONS[cosiriBand]?.title}</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-4 bg-muted/30 rounded-xl px-4 py-3 border border-border">
                  <StatPill label="Total" value={`${cosiriAssessments.length} run`} />
                  <div className="w-px bg-border" />
                  <StatPill label="Completed" value={cosiriCompleted.length} />
                  {cosiriBand != null && (
                    <>
                      <div className="w-px bg-border" />
                      <StatPill label="Maturity" value={MATURITY_LABELS[cosiriBand] ?? "—"} accent="text-primary" />
                    </>
                  )}
                </div>
              </>
            )}

            <div className="flex flex-col gap-2 mt-auto">
              <div className="flex gap-2">
                <Link
                  href="/cosiri/assessment"
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20"
                >
                  <ClipboardCheck className="w-4 h-4" />
                  {!hasCosiriData ? "Start Assessment" : "New Assessment"}
                </Link>
                {latestCosiri && (
                  <Link
                    href={`/cosiri/report/${latestCosiri.id}`}
                    className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-border text-sm font-semibold text-foreground hover:bg-muted/40 transition-colors"
                  >
                    <FileText className="w-4 h-4 text-primary" />
                    Report
                  </Link>
                )}
                {latestCosiri && (
                  <Link
                    href={`/cosiri/results/${latestCosiri.id}`}
                    className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-border text-sm font-semibold text-foreground hover:bg-muted/40 transition-colors"
                  >
                    <Target className="w-4 h-4 text-primary" />
                    Results
                  </Link>
                )}
              </div>
              <Link
                href="/gmp"
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 transition-all"
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
                Switch to GMP Audit
              </Link>
            </div>
          </div>
        </div>

        {/* ════ GMP ════ */}
        <div className={`${card} flex flex-col overflow-hidden`}>
          <div className="px-6 py-5 bg-gradient-to-r from-blue-500/8 via-blue-500/4 to-transparent border-b border-border">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="font-bold text-base text-foreground">GMP Compliance</h2>
                  <p className="text-[11px] text-muted-foreground">Audit tracker · Findings & CAPA management</p>
                </div>
              </div>
              <Link
                href="/gmp"
                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-600 bg-blue-500/10 hover:bg-blue-500/20 transition-colors"
              >
                Dashboard <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <div className="p-6 flex flex-col gap-5 flex-1">
            {(gmpLoading || findingsLoading) ? (
              <div className="flex items-center justify-center h-28">
                <Activity className="w-5 h-5 animate-spin text-blue-400/30" />
              </div>
            ) : !hasGmpData ? (
              <div className="flex flex-col items-center justify-center py-8 text-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/8 flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6 text-blue-500/40" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">No audits yet</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Start your first GMP audit to begin tracking compliance findings.</p>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Avg Compliance</p>
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
                  <div className={`text-right shrink-0 rounded-xl px-4 py-3 ${openFindings > 0 ? "bg-red-50 border border-red-100" : "bg-green-50 border border-green-100"}`}>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">Open Findings</p>
                    <p className={`text-2xl font-bold ${openFindings > 0 ? "text-red-500" : "text-green-600"}`}>{openFindings}</p>
                    {openFindings === 0
                      ? <p className="text-[11px] text-green-600 font-semibold flex items-center gap-1 justify-end"><CheckCircle2 className="w-3 h-3" />All clear</p>
                      : <p className="text-[11px] text-red-500 font-semibold flex items-center gap-1 justify-end"><AlertTriangle className="w-3 h-3" />Action needed</p>
                    }
                  </div>
                </div>

                <div className="flex gap-4 bg-muted/30 rounded-xl px-4 py-3 border border-border">
                  <StatPill label="Audits" value={`${totalAudits} total`} />
                  <div className="w-px bg-border" />
                  <StatPill label="Completed" value={completedAudits} />
                  <div className="w-px bg-border" />
                  <StatPill
                    label="Critical"
                    value={criticalFindings > 0 ? `${criticalFindings} critical` : "None"}
                    accent={criticalFindings > 0 ? "text-red-500" : "text-green-600"}
                  />
                  <div className="w-px bg-border" />
                  <StatPill
                    label="CAPA"
                    value={totalFindings > 0 ? `${closedFindings}/${totalFindings} resolved` : "—"}
                  />
                </div>
              </>
            )}

            <div className="flex flex-col gap-2 mt-auto">
              <div className="flex gap-2">
                <Link
                  href="/gmp/assessments/new"
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm shadow-blue-500/20"
                >
                  <Plus className="w-4 h-4" />
                  {!hasGmpData ? "Start Audit" : "New Audit"}
                </Link>
                {latestGmpAudit && (
                  <Link
                    href={`/gmp/assessments/${latestGmpAudit.id}`}
                    className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-border text-sm font-semibold text-foreground hover:bg-muted/40 transition-colors"
                  >
                    <Zap className="w-4 h-4 text-blue-600" />
                    Continue
                  </Link>
                )}
                {hasGmpData && (
                  <Link
                    href="/gmp/findings"
                    className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-border text-sm font-semibold text-foreground hover:bg-muted/40 transition-colors"
                  >
                    <AlertTriangle className="w-4 h-4 text-blue-600" />
                    Findings
                  </Link>
                )}
              </div>
              <Link
                href="/cosiri"
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:text-primary hover:border-primary/30 hover:bg-primary/5 transition-all"
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
                Switch to COSIRI Assessment
              </Link>
            </div>
          </div>
        </div>

      </div>

      {/* ── Quick-jump row ── */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className={`${card} p-4 flex items-center justify-between gap-4`}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Activity className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">COSIRI Assessment</p>
              <p className="text-[11px] text-muted-foreground">
                {!hasCosiriData
                  ? "No assessments run"
                  : `${cosiriCompleted.length} completed · Latest: ${cosiriScore ?? "—"}/5`
                }
              </p>
            </div>
          </div>
          <Link
            href="/cosiri/assessment"
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <ClipboardCheck className="w-3.5 h-3.5" /> Go
          </Link>
        </div>

        <div className={`${card} p-4 flex items-center justify-between gap-4`}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">GMP Audit</p>
              <p className="text-[11px] text-muted-foreground">
                {!hasGmpData
                  ? "No audits run"
                  : `${completedAudits} completed · ${openFindings} open finding${openFindings !== 1 ? "s" : ""}`
                }
              </p>
            </div>
          </div>
          <Link
            href="/gmp/assessments"
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5" /> Go
          </Link>
        </div>
      </div>

    </AppLayout>
  );
}
