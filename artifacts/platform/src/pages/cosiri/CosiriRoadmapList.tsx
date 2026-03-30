import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  MapPin, ChevronRight, Clock, Plus, Sparkles,
  CheckCircle2, RefreshCw, ArrowRight, Target,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useCompany } from "@/contexts/CompanyContext";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface Assessment {
  id: number;
  companyName: string;
  industry: string;
  status: string;
  overallScore: number;
  createdAt: string;
}

interface PlanRecord {
  id: number;
  assessmentId: number;
  status: string;
  planJson: string | null;
  targetBand: number;
  createdAt: string;
}

function toBand(score: number) {
  const s = score / 10;
  if (s <= 0) return 0;
  if (s < 1) return 0;
  if (s < 2) return 1;
  if (s < 3) return 2;
  if (s < 4) return 3;
  if (s < 5) return 4;
  return 5;
}

const BAND_COLORS: Record<number, string> = {
  0: "bg-slate-100 text-slate-600 border-slate-200",
  1: "bg-red-50 text-red-700 border-red-200",
  2: "bg-orange-50 text-orange-700 border-orange-200",
  3: "bg-amber-50 text-amber-700 border-amber-200",
  4: "bg-blue-50 text-blue-700 border-blue-200",
  5: "bg-green-50 text-green-700 border-green-200",
};

export default function CosiriRoadmapList() {
  const { company } = useCompany();

  const { data: assessments = [], isLoading } = useQuery<Assessment[]>({
    queryKey: ["cosiri-assessments", company?.id],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/cosiri/assessments`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch assessments");
      return res.json();
    },
  });

  const completed = assessments.filter(a => a.status === "completed");

  const { data: plansMap = {} } = useQuery<Record<number, PlanRecord | null>>({
    queryKey: ["all-improvement-plans", completed.map(a => a.id)],
    queryFn: async () => {
      const results: Record<number, PlanRecord | null> = {};
      await Promise.all(
        completed.map(async (a) => {
          try {
            const res = await fetch(`${BASE}/api/cosiri/assessments/${a.id}/improvement-plan`, {
              credentials: "include",
            });
            results[a.id] = res.ok ? await res.json() : null;
          } catch {
            results[a.id] = null;
          }
        })
      );
      return results;
    },
    enabled: completed.length > 0,
  });

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
              <MapPin className="w-8 h-8 text-primary" />
              Improvement Roadmaps
            </h1>
            <p className="text-muted-foreground mt-1">
              AI-generated transformation plans with phased timelines, resource estimates, and KPIs
            </p>
          </div>
          <Link
            href="/cosiri/assessment"
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium shadow-sm hover:shadow-md transition-all"
          >
            <Plus className="w-4 h-4" /> New Assessment
          </Link>
        </div>

        {/* What the roadmap covers */}
        <div className="bg-gradient-to-r from-primary/5 to-emerald-500/5 border border-primary/15 rounded-2xl p-5 mb-8">
          <p className="text-xs font-bold uppercase tracking-wider text-primary mb-3">What the AI roadmap delivers</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: "🎯", label: "Gap analysis across 24 dimensions" },
              { icon: "📅", label: "Phased timeline (months)" },
              { icon: "💰", label: "Budget & resource estimates" },
              { icon: "📊", label: "KPIs & expected Band improvement" },
            ].map(item => (
              <div key={item.label} className="flex items-start gap-2 text-xs text-muted-foreground">
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center h-48">
            <RefreshCw className="w-6 h-6 animate-spin text-primary" />
          </div>
        )}

        {/* No assessments */}
        {!isLoading && assessments.length === 0 && (
          <div className="text-center py-20 bg-card border border-dashed border-border rounded-2xl">
            <MapPin className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-lg font-medium text-muted-foreground">No assessments yet</p>
            <p className="text-sm text-muted-foreground/60 mt-1 mb-6">
              Complete a COSIRI assessment first to generate a roadmap
            </p>
            <Link
              href="/cosiri/assessment"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4" /> Start Assessment
            </Link>
          </div>
        )}

        {/* In-progress assessments notice */}
        {!isLoading && assessments.length > 0 && completed.length === 0 && (
          <div className="text-center py-16 bg-card border border-dashed border-border rounded-2xl">
            <RefreshCw className="w-10 h-10 text-amber-400 mx-auto mb-3" />
            <p className="text-lg font-medium text-muted-foreground">No completed assessments yet</p>
            <p className="text-sm text-muted-foreground/60 mt-1 mb-6">
              Roadmaps are generated from completed assessments. Finish your assessment to unlock this feature.
            </p>
            <Link
              href="/cosiri/assessment"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity"
            >
              Continue Assessment <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* Assessment cards */}
        {!isLoading && completed.length > 0 && (
          <div className="space-y-4">
            {completed.map(assessment => {
              const plan = plansMap[assessment.id];
              const hasPlan = plan && plan.planJson;
              const isGenerating = plan?.status === "generating";
              const band = toBand(assessment.overallScore);
              const scoreDisplay = (assessment.overallScore / 10).toFixed(1);

              return (
                <div key={assessment.id} className="bg-card border border-border rounded-2xl shadow-sm p-6">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1 flex-wrap">
                        <h3 className="text-lg font-semibold text-foreground">{assessment.companyName}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${BAND_COLORS[band]}`}>
                          Band {band}
                        </span>
                        {hasPlan && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" /> Roadmap ready
                          </span>
                        )}
                        {isGenerating && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 animate-pulse">
                            <RefreshCw className="w-3 h-3 animate-spin" /> Generating…
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground flex items-center gap-3">
                        <span>{assessment.industry}</span>
                        <span className="text-muted-foreground/30">·</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(assessment.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                      </p>

                      {hasPlan && plan.targetBand != null && (
                        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                          <Target className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span>Target: Band {plan.targetBand}</span>
                          <span className="text-muted-foreground/30">·</span>
                          <span>Generated {new Date(plan.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
                        </div>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-2xl font-bold text-primary">{scoreDisplay}</div>
                      <div className="text-xs text-muted-foreground">/5.0 index</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 mt-4 border-t border-border">
                    <p className="text-xs text-muted-foreground">
                      {hasPlan
                        ? "AI roadmap with phased timeline and actions"
                        : "No roadmap generated yet — click to create one"}
                    </p>
                    <Link
                      href={`/cosiri/roadmap/${assessment.id}`}
                      className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                    >
                      {hasPlan ? (
                        <><Sparkles className="w-4 h-4" /> View Roadmap</>
                      ) : (
                        <><Sparkles className="w-4 h-4" /> Generate Roadmap</>
                      )}
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
