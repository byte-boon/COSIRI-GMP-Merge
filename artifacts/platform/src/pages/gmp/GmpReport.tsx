import { useMemo } from "react";
import QRCode from "react-qr-code";
import { useRoute, Link } from "wouter";
import {
  ChevronLeft, Download, ShieldCheck, Building2, MapPin, Calendar,
  User, Package, BarChart3, Target, AlertTriangle, CheckCircle2,
  FileText, Paperclip, Star, TrendingUp, TrendingDown, MinusCircle,
  AlertCircle, XCircle,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useGetGmpAssessment, useListGmpFindings } from "@workspace/api-client-react";
import { useCompany } from "@/contexts/CompanyContext";
import {
  GMP_SECTIONS, calculateGmpScore, type GmpResponse, type GmpAttachment,
} from "@/lib/gmp-data";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

// ── Compliance band thresholds ───────────────────────────────────────────────
const COMPLIANCE_BANDS = [
  { min: 90, band: 5, title: "Exemplary",       color: "text-green-600",  bg: "bg-green-50",   border: "border-green-400",  dark: "text-green-300",  darkBg: "bg-green-400/20",  darkBorder: "border-green-400/30"  },
  { min: 75, band: 4, title: "Compliant",        color: "text-blue-600",   bg: "bg-blue-50",    border: "border-blue-400",   dark: "text-blue-300",   darkBg: "bg-blue-400/20",   darkBorder: "border-blue-400/30"   },
  { min: 60, band: 3, title: "Approaching",      color: "text-yellow-600", bg: "bg-yellow-50",  border: "border-yellow-400", dark: "text-yellow-300", darkBg: "bg-yellow-400/20", darkBorder: "border-yellow-400/30" },
  { min: 40, band: 2, title: "Developing",       color: "text-orange-600", bg: "bg-orange-50",  border: "border-orange-400", dark: "text-orange-300", darkBg: "bg-orange-400/20", darkBorder: "border-orange-400/30" },
  { min: 0,  band: 1, title: "Non-Compliant",    color: "text-red-600",    bg: "bg-red-50",     border: "border-red-400",    dark: "text-red-300",    darkBg: "bg-red-400/20",    darkBorder: "border-red-400/30"    },
];

function getBand(score: number) {
  return COMPLIANCE_BANDS.find(b => score >= b.min) ?? COMPLIANCE_BANDS[4];
}

// ── Score level colours ──────────────────────────────────────────────────────
const SCORE_COLORS: Record<number, string> = {
  1: "bg-red-100 text-red-700",
  2: "bg-orange-100 text-orange-700",
  3: "bg-yellow-100 text-yellow-700",
  4: "bg-blue-100 text-blue-700",
  5: "bg-green-100 text-green-700",
};
const SCORE_BARS: Record<number, string> = {
  1: "bg-red-400", 2: "bg-orange-400", 3: "bg-yellow-400", 4: "bg-blue-500", 5: "bg-green-500",
};
const SCORE_LABELS: Record<number, string> = {
  1: "Not Present", 2: "Initial", 3: "Developing", 4: "Managed", 5: "Optimised",
};

// ── Section colours ──────────────────────────────────────────────────────────
const SECTION_ACCENT: Record<string, { text: string; bg: string; border: string; dot: string; darkBg: string; darkBorder: string; darkText: string }> = {
  leadership: { text: "text-blue-600",   bg: "bg-blue-50",    border: "border-blue-200",   dot: "bg-blue-500",    darkBg: "bg-blue-400/20",    darkBorder: "border-blue-400/30",    darkText: "text-blue-300"   },
  workforce:  { text: "text-green-600",  bg: "bg-green-50",   border: "border-green-200",  dot: "bg-green-500",   darkBg: "bg-green-400/20",   darkBorder: "border-green-400/30",   darkText: "text-green-300"  },
  operations: { text: "text-orange-600", bg: "bg-orange-50",  border: "border-orange-200", dot: "bg-orange-500",  darkBg: "bg-orange-400/20",  darkBorder: "border-orange-400/30",  darkText: "text-orange-300" },
  infosec:    { text: "text-purple-600", bg: "bg-purple-50",  border: "border-purple-200", dot: "bg-purple-500",  darkBg: "bg-purple-400/20",  darkBorder: "border-purple-400/30",  darkText: "text-purple-300" },
};

// ── Shared small helpers ─────────────────────────────────────────────────────
function SectionHeader({ num, icon, title, subtitle }: { num: number; icon: React.ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="px-6 py-4 border-b border-border bg-muted/20 flex items-center gap-3">
      <span className="w-7 h-7 rounded-full bg-green-600/10 text-green-700 text-xs font-bold flex items-center justify-center border border-green-600/20 shrink-0">{num}</span>
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

// ── Parse raw JSONB responses into typed GmpResponse ─────────────────────────
function parseResponses(raw: Record<string, unknown>): Record<string, GmpResponse> {
  const out: Record<string, GmpResponse> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (typeof v === "string") {
      const scoreMap: Record<string, number | null> = { compliant: 5, partial: 3, noncompliant: 1, na: null };
      out[k] = { score: scoreMap[v] ?? null, na: v === "na", notes: "", attachments: [] };
    } else if (v && typeof v === "object") {
      const obj = v as Partial<GmpResponse>;
      out[k] = { score: obj.score ?? null, na: obj.na ?? false, notes: obj.notes ?? "", attachments: obj.attachments ?? [] };
    }
  }
  return out;
}

// ── Main report component ────────────────────────────────────────────────────
export default function GmpReport() {
  const [, params] = useRoute("/gmp/report/:id");
  const id = params?.id ? parseInt(params.id) : 0;
  const { company } = useCompany();

  const { data: assessment, isLoading } = useGetGmpAssessment(id, { query: { enabled: !!id } });
  const { data: allFindings } = useListGmpFindings();

  const findings = useMemo(() => (allFindings ?? []).filter(f => f.assessmentId === id), [allFindings, id]);
  const responses = useMemo(() => parseResponses((assessment?.responses ?? {}) as Record<string, unknown>), [assessment]);

  // ── Computed metrics ───────────────────────────────────────────────────────
  const overallScore = useMemo(() => calculateGmpScore(responses), [responses]);
  const band = getBand(overallScore);

  const sectionMetrics = useMemo(() => GMP_SECTIONS.map(section => {
    const itemResponses = section.items.map(i => responses[i.id]).filter(r => r && !r.na && r.score != null);
    const avg = itemResponses.length > 0
      ? Math.round((itemResponses.reduce((s, r) => s + (r.score ?? 0), 0) / itemResponses.length) * 10) / 10
      : 0;
    const pct = Math.round((avg / 5) * 100);
    const answered = itemResponses.length;
    return { section, avg, pct, answered, total: section.items.length };
  }), [responses]);

  const allItems = useMemo(() => GMP_SECTIONS.flatMap(s =>
    s.items.map(item => ({
      ...item,
      section: s,
      response: responses[item.id] ?? null,
    }))
  ), [responses]);

  const scoredItems = allItems.filter(i => i.response && !i.response.na && i.response.score != null);
  const strengths   = scoredItems.filter(i => (i.response?.score ?? 0) >= 4).sort((a, b) => (b.response?.score ?? 0) - (a.response?.score ?? 0));
  const gaps        = scoredItems.filter(i => (i.response?.score ?? 0) <= 2).sort((a, b) => (a.response?.score ?? 0) - (b.response?.score ?? 0));
  const totalAttachments = allItems.reduce((s, i) => s + (i.response?.attachments?.length ?? 0), 0);

  // Score distribution (count per level 1-5)
  const scoreDist = useMemo(() => [5, 4, 3, 2, 1].map(s => ({
    score: s,
    count: scoredItems.filter(i => i.response?.score === s).length,
  })), [scoredItems]);

  const openFindings = findings.filter(f => f.status === "open").length;
  const criticalFindings = findings.filter(f => f.severity === "critical").length;

  const card = "bg-card border border-border rounded-2xl shadow-sm overflow-hidden";

  if (isLoading) return <AppLayout><div className="p-20 text-center text-muted-foreground">Loading report…</div></AppLayout>;
  if (!assessment) return <AppLayout><div className="p-20 text-center text-muted-foreground">Report not found.</div></AppLayout>;

  const dateLabel = assessment.startDate
    ? new Date(assessment.startDate).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    : "—";

  return (
    <AppLayout>
      {/* Back link */}
      <div className="mb-5">
        <Link href="/gmp/reports" className="text-sm text-muted-foreground hover:text-primary flex items-center transition-colors w-fit">
          <ChevronLeft className="w-4 h-4 mr-1" /> Back to Reports
        </Link>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          HERO BANNER
      ══════════════════════════════════════════════════════════════ */}
      <div className="relative rounded-3xl overflow-hidden mb-8 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-green-950" />
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: "radial-gradient(circle at 18% 55%, rgba(34,197,94,0.5) 0%, transparent 55%), radial-gradient(circle at 82% 15%, rgba(59,130,246,0.4) 0%, transparent 50%)"
        }} />
        <div className="relative z-10 px-8 py-10 flex items-start justify-between gap-8">
          {/* Left: identity */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-5 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-green-500/20 border border-green-400/30 text-green-300 text-xs font-bold uppercase tracking-widest">
                Good Manufacturing Practice (GMP) — Audit Report
              </span>
              <span className="px-2.5 py-1 rounded-full bg-white/10 text-white/50 text-xs font-mono">
                {assessment.auditId}
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-1 leading-tight">
              {company?.name ?? "Your Organisation"}
            </h1>
            <p className="text-green-300 font-medium text-lg mb-5">{assessment.scope}</p>
            <div className="flex items-center gap-2 mb-4">
              {[1,2,3,4,5].map(i => (
                <ShieldCheck key={i} className={`w-8 h-8 ${i <= band.band ? "text-green-400 fill-green-400/30" : "text-white/15"}`} />
              ))}
              <span className="text-white/50 text-sm ml-2">{band.title}</span>
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-white/45">
              <span className="flex items-center gap-1.5"><Calendar className="w-3 h-3" />{dateLabel}</span>
              {company?.industry && <span className="flex items-center gap-1.5"><Package className="w-3 h-3" />{company.industry}</span>}
              <span className="flex items-center gap-1.5"><ShieldCheck className="w-3 h-3" />{assessment.status === "completed" ? "Completed" : "In Progress"}</span>
            </div>
          </div>

          {/* Right: score orb + band + QR */}
          <div className="flex flex-col items-center shrink-0">
            <div className="w-36 h-36 rounded-full bg-white/10 border-2 border-white/20 flex flex-col items-center justify-center backdrop-blur-sm mb-4 shadow-inner">
              <span className="text-5xl font-bold text-white leading-none">{overallScore}</span>
              <span className="text-white/40 text-base mt-1">%</span>
            </div>
            <div className={`px-4 py-2 rounded-full text-xs font-bold mb-4 ${band.darkBg} ${band.dark} border ${band.darkBorder}`}>
              Band {band.band} — {band.title}
            </div>
            <button className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl font-medium flex items-center gap-2 text-xs transition-colors">
              <Download className="w-3.5 h-3.5" /> Export PDF
            </button>
            <div className="mt-4 flex flex-col items-center gap-1.5">
              <div className="p-2 bg-white rounded-xl shadow-lg">
                <QRCode
                  value={typeof window !== "undefined" ? window.location.href : `gmp/report/${id}`}
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

      {/* ══════════════════════════════════════════════════════════════
          KPI STRIP — 5 tiles
      ══════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {[
          { label: "Compliance Score",   value: `${overallScore}%`,            sub: `Band ${band.band} — ${band.title}`,         color: band.color           },
          { label: "Areas Assessed",     value: `${sectionMetrics.filter(s => s.answered > 0).length}`,  sub: "of 4 sections",                            color: "text-blue-600"      },
          { label: "Items Answered",     value: `${scoredItems.length}`,        sub: `of ${allItems.length} total items`,         color: "text-primary"       },
          { label: "Findings Raised",    value: `${findings.length}`,           sub: `${openFindings} open · ${criticalFindings} critical`, color: findings.length > 0 ? "text-orange-600" : "text-green-600" },
          { label: "Evidence Documents", value: `${totalAttachments}`,          sub: "attached across items",                    color: "text-violet-600"    },
        ].map(({ label, value, sub, color }) => (
          <div key={label} className={`${card} p-5`}>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">{label}</p>
            <p className={`text-3xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{sub}</p>
          </div>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════
          TWO-COLUMN BODY (2/3 + 1/3)
      ══════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

        {/* ── LEFT 2/3 ── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Audit Profile */}
          <div className={card}>
            <SectionHeader num={1} icon={<Building2 className="w-4 h-4" />} title="Audit Profile" subtitle="Assessment identity and scope" />
            <div className="p-6 grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">
              <ProfileField icon={<Building2 className="w-4 h-4" />} label="Organisation"   value={company?.name} />
              <ProfileField icon={<Package    className="w-4 h-4" />} label="Industry"       value={company?.industry} />
              <ProfileField icon={<ShieldCheck className="w-4 h-4" />} label="Audit ID"     value={assessment.auditId} />
              <ProfileField icon={<FileText   className="w-4 h-4" />} label="Scope"         value={assessment.scope} />
              <ProfileField icon={<Calendar   className="w-4 h-4" />} label="Audit Date"    value={dateLabel} />
              <ProfileField icon={<Target     className="w-4 h-4" />} label="Status"        value={assessment.status === "completed" ? "Completed" : "In Progress"} />
            </div>
          </div>

          {/* 4-Section Area Scores */}
          <div className={card}>
            <SectionHeader num={2} icon={<BarChart3 className="w-4 h-4" />} title="4 Compliance Areas" subtitle="GMP performance by assessment domain" />
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {sectionMetrics.map(({ section, avg, pct, answered, total }) => {
                const clr = SECTION_ACCENT[section.id] ?? SECTION_ACCENT.leadership;
                const bandForSection = getBand(pct);
                const lowestItems = section.items
                  .map(i => ({ item: i, score: responses[i.id]?.score ?? null }))
                  .filter(x => x.score != null)
                  .sort((a, b) => (a.score ?? 0) - (b.score ?? 0))
                  .slice(0, 2);
                return (
                  <div key={section.id} className={`rounded-2xl border p-5 ${clr.bg} ${clr.border}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${clr.dot} shrink-0`} />
                        <span className={`font-bold text-sm ${clr.text}`}>{section.title}</span>
                      </div>
                      <span className={`text-2xl font-bold ${clr.text}`}>{avg > 0 ? avg.toFixed(1) : "—"}</span>
                    </div>
                    <div className="w-full bg-black/10 rounded-full h-2 mb-2">
                      <div className={`h-2 rounded-full transition-all ${clr.dot}`} style={{ width: `${pct}%`, opacity: 0.7 }} />
                    </div>
                    <div className="flex items-center justify-between text-xs opacity-70 mb-3">
                      <span>{answered}/{total} items · {pct}%</span>
                      <span>{bandForSection.title}</span>
                    </div>
                    <div className="space-y-1">
                      {lowestItems.map(({ item, score }) => (
                        <div key={item.id} className="flex items-center justify-between text-xs bg-black/5 rounded-lg px-3 py-1.5">
                          <span className="font-medium truncate mr-2">{item.id} · {item.label}</span>
                          <span className={`font-bold shrink-0 px-1.5 py-0.5 rounded text-[10px] ${SCORE_COLORS[score!] ?? ""}`}>{score}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Strengths & Gaps */}
          <div className={card}>
            <SectionHeader num={3} icon={<Target className="w-4 h-4" />} title="Strengths & Priority Gaps" subtitle="Items scoring ≥ 4 (strengths) and ≤ 2 (priority improvements)" />
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-green-600 mb-3">Top Performing Items</p>
                {strengths.length === 0
                  ? <p className="text-xs text-muted-foreground italic">No items scored 4 or 5 yet.</p>
                  : <div className="space-y-2">
                      {strengths.slice(0, 5).map(({ item, response, section }) => (
                        <div key={item.id} className="flex items-center gap-3 bg-green-50 border border-green-100 rounded-xl px-4 py-2.5">
                          <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${response!.score === 5 ? "bg-green-500 text-white" : "bg-green-200 text-green-800"}`}>
                            {response!.score}
                          </span>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-foreground truncate">{item.label}</p>
                            <p className="text-[10px] text-muted-foreground">{item.id} · {section.title}</p>
                          </div>
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0 ml-auto" />
                        </div>
                      ))}
                    </div>
                }
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-red-500 mb-3">Priority Improvement Areas</p>
                {gaps.length === 0
                  ? <p className="text-xs text-muted-foreground italic">No items scored 1 or 2.</p>
                  : <div className="space-y-2">
                      {gaps.slice(0, 5).map(({ item, response, section }) => (
                        <div key={item.id} className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">
                          <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${response!.score === 1 ? "bg-red-500 text-white" : "bg-orange-200 text-orange-800"}`}>
                            {response!.score}
                          </span>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-foreground truncate">{item.label}</p>
                            <p className="text-[10px] text-muted-foreground">{item.id} · {section.title}</p>
                          </div>
                          <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0 ml-auto" />
                        </div>
                      ))}
                    </div>
                }
              </div>
            </div>
          </div>

          {/* Full Item Scorecard */}
          <div className={card}>
            <SectionHeader num={4} icon={<FileText className="w-4 h-4" />} title="Item Scorecard" subtitle="All GMP items with scores, notes and evidence" />
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/20">
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground w-14">ID</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Item</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground hidden md:table-cell">Area</th>
                    <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-muted-foreground w-20">Score</th>
                    <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-muted-foreground w-16 hidden lg:table-cell">Docs</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {allItems.map(({ item, section, response }) => {
                    const score = response?.score ?? null;
                    const na    = response?.na ?? false;
                    const docs  = response?.attachments?.length ?? 0;
                    const clr   = SECTION_ACCENT[section.id] ?? SECTION_ACCENT.leadership;
                    return (
                      <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3">
                          <span className="text-xs font-bold font-mono bg-muted text-muted-foreground px-2 py-0.5 rounded">{item.id}</span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-foreground text-sm">{item.label}</p>
                          {response?.notes && (
                            <p className="text-[10px] text-muted-foreground mt-0.5 truncate max-w-[24rem]">{response.notes}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${clr.bg} ${clr.text} border ${clr.border}`}>
                            {section.title}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {na
                            ? <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-slate-100 text-slate-500">N/A</span>
                            : score != null
                              ? <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${SCORE_COLORS[score] ?? "bg-muted text-muted-foreground"}`}>
                                  {score} <span className="hidden lg:inline font-normal opacity-70">— {SCORE_LABELS[score]}</span>
                                </span>
                              : <span className="text-[10px] text-muted-foreground italic">—</span>
                          }
                        </td>
                        <td className="px-4 py-3 text-center hidden lg:table-cell">
                          {docs > 0
                            ? <span className="flex items-center justify-center gap-1 text-xs font-medium text-primary">
                                <Paperclip className="w-3 h-3" />{docs}
                              </span>
                            : <span className="text-muted-foreground/30 text-xs">—</span>
                          }
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>{/* end LEFT */}

        {/* ── RIGHT 1/3 ── */}
        <div className="space-y-6">

          {/* Compliance Emblem */}
          <div className={card}>
            <div className="px-5 py-3 border-b border-border bg-green-50/60">
              <h2 className="font-bold text-sm flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-green-600" /> Compliance Emblem</h2>
              <p className="text-xs text-muted-foreground">GMP maturity rating</p>
            </div>
            <div className="p-5 flex flex-col items-center text-center">
              <div className={`w-24 h-24 rounded-full flex flex-col items-center justify-center mb-3 border-4 ${band.border} ${band.bg}`}>
                <span className={`text-3xl font-bold ${band.color}`}>{band.band}</span>
                <span className={`text-[10px] font-bold uppercase tracking-wide ${band.color} opacity-70`}>Band</span>
              </div>
              <p className={`font-bold text-lg ${band.color}`}>{band.title}</p>
              <p className="text-xs text-muted-foreground mb-4">{overallScore}% overall compliance</p>
              <div className="w-full space-y-1.5 text-xs">
                {COMPLIANCE_BANDS.map(b => (
                  <div key={b.band} className={`flex items-center justify-between px-3 py-1.5 rounded-lg ${b.band === band.band ? `${b.bg} ${b.border} border font-bold` : ""}`}>
                    <span className={b.band === band.band ? b.color : "text-muted-foreground"}>Band {b.band} — {b.title}</span>
                    <span className="text-muted-foreground">{b.min === 0 ? "0" : b.min}–{b.min === 90 ? "100" : COMPLIANCE_BANDS[COMPLIANCE_BANDS.findIndex(bb => bb.band === b.band) - 1]?.min ?? 100}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Score Distribution */}
          <div className={card}>
            <div className="px-5 py-3 border-b border-border bg-muted/20">
              <h2 className="font-bold text-sm flex items-center gap-2"><BarChart3 className="w-4 h-4 text-muted-foreground/60" /> Score Distribution</h2>
              <p className="text-xs text-muted-foreground">Across {allItems.length} GMP items</p>
            </div>
            <div className="p-5 space-y-2.5">
              {scoreDist.map(({ score, count }) => {
                const pct = allItems.length > 0 ? (count / allItems.length) * 100 : 0;
                return (
                  <div key={score} className="flex items-center gap-2 text-xs">
                    <span className={`w-16 text-right font-bold shrink-0 px-1.5 py-0.5 rounded text-[10px] ${SCORE_COLORS[score]}`}>{score} — {SCORE_LABELS[score]}</span>
                    <div className="flex-1 bg-muted rounded-full h-2">
                      <div className={`${SCORE_BARS[score]} h-2 rounded-full transition-all`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-5 text-right font-bold text-foreground">{count}</span>
                  </div>
                );
              })}
              {scoredItems.length === 0 && <p className="text-xs text-muted-foreground italic text-center py-2">No scored items yet</p>}
            </div>
          </div>

          {/* Findings Breakdown */}
          <div className={card}>
            <div className="px-5 py-3 border-b border-border bg-orange-50/60">
              <h2 className="font-bold text-sm flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-orange-500" /> Findings Breakdown</h2>
              <p className="text-xs text-muted-foreground">Audit findings by severity</p>
            </div>
            <div className="p-5">
              {findings.length === 0
                ? <p className="text-xs text-green-600 font-medium flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> No findings raised</p>
                : <div className="space-y-3">
                    {(["critical", "major", "minor"] as const).map(sev => {
                      const sevFindings = findings.filter(f => f.severity === sev);
                      if (sevFindings.length === 0) return null;
                      const sevColors = {
                        critical: { dot: "bg-red-500",    text: "text-red-600",    badge: "bg-red-50 text-red-700 border-red-200" },
                        major:    { dot: "bg-orange-400", text: "text-orange-600", badge: "bg-orange-50 text-orange-700 border-orange-200" },
                        minor:    { dot: "bg-blue-400",   text: "text-blue-600",   badge: "bg-blue-50 text-blue-700 border-blue-200" },
                      }[sev];
                      return (
                        <div key={sev}>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className={`flex items-center gap-1.5 text-xs font-bold capitalize ${sevColors.text}`}>
                              <span className={`w-2 h-2 rounded-full ${sevColors.dot}`} />{sev}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${sevColors.badge}`}>{sevFindings.length}</span>
                          </div>
                          {sevFindings.slice(0, 2).map(f => (
                            <div key={f.id} className="text-[10px] text-muted-foreground bg-muted/30 rounded-lg px-2 py-1 mb-1 truncate">
                              {f.itemId}: {f.description}
                            </div>
                          ))}
                        </div>
                      );
                    })}
                    <div className="pt-2 border-t border-border text-xs flex justify-between">
                      <span className="text-muted-foreground">{openFindings} open</span>
                      <span className="text-green-600 font-medium">{findings.length - openFindings} closed</span>
                    </div>
                  </div>
              }
            </div>
          </div>

          {/* Area Compliance */}
          <div className={card}>
            <div className="px-5 py-3 border-b border-border bg-muted/20">
              <h2 className="font-bold text-sm flex items-center gap-2"><TrendingUp className="w-4 h-4 text-muted-foreground/60" /> Area Compliance</h2>
            </div>
            <div className="p-5 space-y-3">
              {sectionMetrics.map(({ section, pct, avg }) => {
                const clr = SECTION_ACCENT[section.id] ?? SECTION_ACCENT.leadership;
                return (
                  <div key={section.id}>
                    <div className="flex justify-between items-center text-xs mb-1">
                      <span className={`font-semibold ${clr.text}`}>{section.title}</span>
                      <span className="font-bold text-foreground">{pct}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${clr.dot}`} style={{ width: `${pct}%`, opacity: 0.75 }} />
                    </div>
                    <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5">
                      <span>Avg score {avg > 0 ? avg.toFixed(1) : "—"} / 5</span>
                      {pct >= 80
                        ? <span className="text-green-600 font-medium flex items-center gap-0.5"><TrendingUp className="w-2.5 h-2.5" /> Compliant</span>
                        : <span className="text-orange-500 font-medium flex items-center gap-0.5"><TrendingDown className="w-2.5 h-2.5" /> Needs work</span>
                      }
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>{/* end RIGHT */}
      </div>{/* end two-column */}

      {/* ══════════════════════════════════════════════════════════════
          FULL-WIDTH — FINDINGS TABLE
      ══════════════════════════════════════════════════════════════ */}
      {findings.length > 0 && (
        <div className={`${card} mb-6`}>
          <SectionHeader num={5} icon={<AlertTriangle className="w-4 h-4" />} title="Findings & CAPA Log" subtitle="All audit findings with current status" />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/20">
                  {["Item", "Description", "Type", "Severity", "Status"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {findings.map(f => {
                  const sevBadge = {
                    critical: "bg-red-50 text-red-700 border-red-200",
                    major:    "bg-orange-50 text-orange-700 border-orange-200",
                    minor:    "bg-blue-50 text-blue-700 border-blue-200",
                  }[f.severity] ?? "bg-muted text-muted-foreground";
                  const statusBadge = f.status === "open"
                    ? "bg-amber-50 text-amber-700 border-amber-200"
                    : "bg-green-50 text-green-700 border-green-200";
                  return (
                    <tr key={f.id} className="hover:bg-muted/20">
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{f.itemId}</td>
                      <td className="px-4 py-3 text-sm text-foreground max-w-xs truncate">{f.description}</td>
                      <td className="px-4 py-3 text-xs capitalize text-muted-foreground">{f.type.replace("_", " ")}</td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize ${sevBadge}`}>{f.severity}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize ${statusBadge}`}>{f.status}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          APPENDIX — EVIDENCE INDEX
      ══════════════════════════════════════════════════════════════ */}
      {totalAttachments > 0 && (
        <div className={`${card} mb-6`}>
          <SectionHeader num={findings.length > 0 ? 6 : 5} icon={<Paperclip className="w-4 h-4" />} title="Evidence Index" subtitle="Attached documents referenced during this audit" />
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {allItems.flatMap(({ item, section, response }) =>
                (response?.attachments ?? []).map((att: GmpAttachment, idx: number) => {
                  const clr = SECTION_ACCENT[section.id] ?? SECTION_ACCENT.leadership;
                  return (
                    <a
                      key={`${item.id}-${idx}`}
                      href={`${BASE}/api/storage${att.path}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-muted/30 hover:bg-muted/60 hover:border-primary/30 transition-all group"
                    >
                      <FileText className="w-5 h-5 text-muted-foreground group-hover:text-primary shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">{att.name}</p>
                        <p className={`text-[10px] font-semibold ${clr.text}`}>{item.id} · {section.title}</p>
                      </div>
                    </a>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-8 pt-6 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
        <span>GMP Audit Report · {assessment.auditId}</span>
        <span>Generated by Nexus Platform · {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</span>
      </div>
    </AppLayout>
  );
}
