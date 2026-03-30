import { useState } from "react";
import { useRoute, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, Sparkles, RefreshCw, Users, DollarSign, Cpu, Target, TrendingUp, Clock, ChevronDown, ChevronUp, MapPin, Printer } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface ResourcesObj {
  budget: string;
  people: string;
  technology: string;
}

interface PlanAction {
  title: string;
  description: string;
  dimensionIds: string[];
  owner: string;
  timeline: string;
  resources: ResourcesObj;
  kpi: string;
  expectedBandImprovement: string;
}

interface PlanPhase {
  phase: number;
  name: string;
  period: string;
  objective: string;
  priority: "high" | "medium" | "low";
  dimensionIds: string[];
  actions: PlanAction[];
}

interface ImprovementPlan {
  overallObjective: string;
  currentBand: number;
  targetBand: number;
  timelineMonths: number;
  executiveSummary: string;
  phases: PlanPhase[];
}

interface PlanRecord {
  id: number;
  assessmentId: number;
  companyName: string;
  industry: string;
  overallScore: number;
  targetBand: number;
  planJson: string | null;
  status: string;
  createdAt: string;
}

const PRIORITY_STYLES: Record<string, string> = {
  high: "bg-red-50 text-red-700 border-red-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  low: "bg-green-50 text-green-700 border-green-200",
};

const PHASE_COLORS = [
  "border-blue-400 bg-blue-500",
  "border-indigo-400 bg-indigo-500",
  "border-violet-400 bg-violet-500",
  "border-purple-400 bg-purple-500",
];

const PHASE_RING = [
  "ring-blue-200",
  "ring-indigo-200",
  "ring-violet-200",
  "ring-purple-200",
];

const PHASE_BG = [
  "bg-blue-50 border-blue-200",
  "bg-indigo-50 border-indigo-200",
  "bg-violet-50 border-violet-200",
  "bg-purple-50 border-purple-200",
];

function ActionCard({ action, phaseIdx }: { action: PlanAction; phaseIdx: number }) {
  const [expanded, setExpanded] = useState(false);
  const borderColors = ["border-l-blue-400", "border-l-indigo-400", "border-l-violet-400", "border-l-purple-400"];

  return (
    <div className={`bg-white rounded-xl border border-border border-l-4 ${borderColors[phaseIdx] || "border-l-primary"} shadow-sm`}>
      <button
        className="w-full text-left p-4 flex items-start justify-between gap-3"
        onClick={() => setExpanded(v => !v)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h4 className="font-semibold text-sm text-foreground">{action.title}</h4>
            {action.dimensionIds?.map(d => (
              <span key={d} className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary">{d}</span>
            ))}
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{action.timeline}</span>
            <span className="flex items-center gap-1"><Users className="w-3 h-3" />{action.owner}</span>
          </div>
        </div>
        <span className="print:hidden shrink-0 mt-0.5">
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </span>
      </button>

      <div className={`px-4 pb-4 space-y-4 border-t border-border/60 pt-4 ${expanded ? "block" : "hidden"} print:!block`}>
          <p className="text-sm text-muted-foreground leading-relaxed">{action.description}</p>

          {/* Resources */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/40 border border-border/60">
              <DollarSign className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-0.5">Budget</p>
                <p className="text-xs font-medium text-foreground">{action.resources?.budget || "TBD"}</p>
              </div>
            </div>
            <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/40 border border-border/60">
              <Users className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-0.5">People</p>
                <p className="text-xs font-medium text-foreground">{action.resources?.people || "TBD"}</p>
              </div>
            </div>
            <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/40 border border-border/60">
              <Cpu className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-0.5">Technology</p>
                <p className="text-xs font-medium text-foreground">{action.resources?.technology || "TBD"}</p>
              </div>
            </div>
          </div>

          {/* KPI + Band Improvement */}
          <div className="flex flex-col sm:flex-row gap-2">
            {action.kpi && (
              <div className="flex-1 flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
                <Target className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wide mb-0.5">Success KPI</p>
                  <p className="text-xs text-amber-800">{action.kpi}</p>
                </div>
              </div>
            )}
            {action.expectedBandImprovement && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-50 border border-green-200 shrink-0">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-xs font-semibold text-green-700">{action.expectedBandImprovement}</span>
              </div>
            )}
          </div>
        </div>
    </div>
  );
}

export default function CosiriRoadmap() {
  const [, params] = useRoute("/cosiri/roadmap/:id");
  const assessmentId = params?.id ? parseInt(params.id) : 0;
  const queryClient = useQueryClient();

  const { data: record, isLoading, error } = useQuery<PlanRecord>({
    queryKey: ["improvement-plan", assessmentId],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/cosiri/assessments/${assessmentId}/improvement-plan`);
      if (res.status === 404) return null as unknown as PlanRecord;
      if (!res.ok) throw new Error("Failed to fetch improvement plan");
      return res.json();
    },
    enabled: !!assessmentId,
    refetchInterval: (data) => {
      if ((data as unknown as PlanRecord)?.status === "generating") return 3000;
      return false;
    },
  });

  const { mutate: generate, isPending: isGenerating } = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${BASE}/api/cosiri/assessments/${assessmentId}/improvement-plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Generation failed");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["improvement-plan", assessmentId] });
    },
  });

  const plan: ImprovementPlan | null = (() => {
    if (!record?.planJson) return null;
    try { return JSON.parse(record.planJson); } catch { return null; }
  })();

  const isGeneratingState = record?.status === "generating" || isGenerating;

  const handlePrint = () => {
    const prev = document.title;
    if (record) document.title = `COSIRI Improvement Roadmap — ${record.companyName}`;
    window.print();
    document.title = prev;
  };

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">

        {/* Print-only document header */}
        <div className="hidden print:block mb-4">
          <h1 className="text-2xl font-bold">COSIRI Improvement Roadmap</h1>
          {record && (
            <p className="text-gray-600 mt-1 text-sm">
              {record.companyName} · {record.industry} · Generated {new Date().toLocaleDateString()}
            </p>
          )}
          <hr className="mt-3 border-gray-300" />
        </div>

        {/* Header (hidden when printing) */}
        <div className="flex items-start justify-between gap-4 flex-wrap print:hidden">
          <div>
            <Link href={`/cosiri/results/${assessmentId}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3 transition-colors">
              <ChevronLeft className="w-4 h-4" />
              Back to Results
            </Link>
            <h1 className="text-3xl font-display font-bold">Improvement Roadmap</h1>
            {record && (
              <p className="text-muted-foreground mt-1">
                {record.companyName} · {record.industry}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            {plan && (
              <button
                type="button"
                onClick={handlePrint}
                title="Print / Save as PDF"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-background hover:bg-muted/50 font-medium text-sm transition-all"
              >
                <Printer className="w-4 h-4" />
                Export PDF
              </button>
            )}
            <button
              onClick={() => generate()}
              disabled={isGeneratingState}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold shadow-sm hover:shadow-md hover:-translate-y-0.5 disabled:opacity-50 transition-all text-sm"
            >
              {isGeneratingState ? (
                <><RefreshCw className="w-4 h-4 animate-spin" /> Generating…</>
              ) : plan ? (
                <><RefreshCw className="w-4 h-4" /> Regenerate</>
              ) : (
                <><Sparkles className="w-4 h-4" /> Generate with AI</>
              )}
            </button>
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center h-64">
            <div className="text-center space-y-3">
              <RefreshCw className="w-8 h-8 animate-spin text-primary mx-auto" />
              <p className="text-muted-foreground">Loading roadmap…</p>
            </div>
          </div>
        )}

        {/* Generating state */}
        {!isLoading && isGeneratingState && (
          <div className="bg-card border border-border rounded-2xl p-12 flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-primary animate-pulse" />
            </div>
            <div className="text-center">
              <h3 className="font-bold text-lg mb-1">AI is building your roadmap…</h3>
              <p className="text-muted-foreground text-sm max-w-md">
                Analysing your 24 dimension scores, identifying critical gaps, and generating a phased transformation plan with resource estimates. This takes 15–30 seconds.
              </p>
            </div>
            <div className="flex gap-1 mt-2">
              {[0,1,2].map(i => (
                <div key={i} className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: `${i * 0.2}s` }} />
              ))}
            </div>
          </div>
        )}

        {/* No plan yet */}
        {!isLoading && !isGeneratingState && !plan && (
          <div className="bg-card border border-border rounded-2xl p-12 flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <MapPin className="w-8 h-8 text-primary" />
            </div>
            <div className="text-center">
              <h3 className="font-bold text-lg mb-1">No roadmap generated yet</h3>
              <p className="text-muted-foreground text-sm max-w-md">
                Click "Generate with AI" to create a personalised transformation roadmap based on your COSIRI assessment scores, with phased timelines, resource estimates, and KPIs.
              </p>
            </div>
          </div>
        )}

        {/* Roadmap content */}
        {plan && !isGeneratingState && (
          <div className="space-y-8">
            {/* Overall objective card */}
            <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
              <div className="flex items-start gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Transformation Objective</p>
                  <h2 className="text-xl font-bold text-foreground leading-snug">{plan.overallObjective}</h2>
                  {plan.executiveSummary && (
                    <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{plan.executiveSummary}</p>
                  )}
                </div>
                <div className="flex gap-4 shrink-0">
                  <div className="text-center">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Current Band</p>
                    <div className="w-14 h-14 rounded-full border-2 border-amber-300 bg-amber-50 flex items-center justify-center">
                      <span className="text-2xl font-bold text-amber-700">{plan.currentBand}</span>
                    </div>
                  </div>
                  <div className="flex items-center text-muted-foreground mt-4">→</div>
                  <div className="text-center">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Target Band</p>
                    <div className="w-14 h-14 rounded-full border-2 border-green-300 bg-green-50 flex items-center justify-center">
                      <span className="text-2xl font-bold text-green-700">{plan.targetBand}</span>
                    </div>
                  </div>
                  <div className="text-center ml-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Timeline</p>
                    <div className="w-14 h-14 rounded-full border-2 border-blue-300 bg-blue-50 flex items-center justify-center flex-col">
                      <span className="text-lg font-bold text-blue-700 leading-none">{plan.timelineMonths}</span>
                      <span className="text-[10px] text-blue-600">mo</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Phase timeline strip */}
              {plan.phases?.length > 0 && (
                <div className="mt-4 flex gap-1 rounded-xl overflow-hidden">
                  {plan.phases.map((phase, i) => (
                    <div
                      key={phase.phase}
                      className={`flex-1 py-2 px-3 text-center text-white text-xs font-semibold ${PHASE_COLORS[i] || "bg-primary"}`}
                    >
                      <div className="font-bold">{phase.name}</div>
                      <div className="opacity-80 text-[10px]">{phase.period}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Phase sections */}
            {plan.phases?.map((phase, i) => (
              <div key={phase.phase} className={`rounded-2xl border ${PHASE_BG[i] || "bg-card border-border"} p-6 space-y-4`}>
                {/* Phase header */}
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg ring-4 ${PHASE_COLORS[i] || "bg-primary"} ${PHASE_RING[i] || "ring-primary/20"}`}>
                      {phase.phase}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-foreground">Phase {phase.phase}: {phase.name}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {phase.period}
                        </span>
                        <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border ${PRIORITY_STYLES[phase.priority] || PRIORITY_STYLES.medium}`}>
                          {phase.priority} priority
                        </span>
                      </div>
                    </div>
                  </div>
                  {phase.dimensionIds?.length > 0 && (
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className="text-xs text-muted-foreground mr-1">Dimensions:</span>
                      {phase.dimensionIds.map(d => (
                        <span key={d} className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-white border border-border text-primary">{d}</span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Phase objective */}
                <p className="text-sm text-muted-foreground italic pl-13 border-l-2 border-current ml-1 pl-4">{phase.objective}</p>

                {/* Actions */}
                <div className="space-y-3">
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Actions</p>
                  {phase.actions?.map((action, j) => (
                    <ActionCard key={j} action={action} phaseIdx={i} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
