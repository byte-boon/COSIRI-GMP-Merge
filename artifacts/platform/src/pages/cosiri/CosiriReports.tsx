import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { FileText, ChevronRight, Clock, CheckCircle2, AlertCircle, Plus } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useCompany } from "@/contexts/CompanyContext";

interface Assessment {
  id: number;
  companyName: string;
  industry: string;
  status: string;
  overallScore: number;
  createdAt: string;
}

interface Insight {
  id: number;
  type: string;
  status: string;
  createdAt: string;
}

interface AssessmentWithInsights extends Assessment {
  insights: Insight[];
}

const INSIGHT_TYPES = [
  { key: "executive_summary", label: "Executive Summary" },
  { key: "gap_analysis", label: "Gap Analysis" },
  { key: "roadmap", label: "Roadmap" },
];

export default function CosiriReports() {
  const { company } = useCompany();
  const baseUrl = import.meta.env.BASE_URL.replace(/\/$/, "");

  const { data: assessments, isLoading } = useQuery<Assessment[]>({
    queryKey: ["cosiri-assessments", company?.id],
    queryFn: async () => {
      const url = company?.id
        ? `${baseUrl}/api/cosiri/assessments?companyId=${company.id}`
        : `${baseUrl}/api/cosiri/assessments`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch assessments");
      return res.json();
    },
    enabled: true,
  });

  const { data: insightsMap } = useQuery<Record<number, Insight[]>>({
    queryKey: ["cosiri-all-insights", assessments?.map(a => a.id)],
    queryFn: async () => {
      if (!assessments || assessments.length === 0) return {};
      const results: Record<number, Insight[]> = {};
      await Promise.all(
        assessments.map(async (a) => {
          try {
            const res = await fetch(`${baseUrl}/api/cosiri/assessments/${a.id}/ai/insights/latest`);
            if (res.ok) {
              const data = await res.json();
              results[a.id] = Object.values(data).filter(Boolean) as Insight[];
            }
          } catch {
            results[a.id] = [];
          }
        })
      );
      return results;
    },
    enabled: !!assessments && assessments.length > 0,
  });

  const scoreToFloat = (score: number) => (score / 10).toFixed(1);

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
            <FileText className="w-8 h-8 text-primary" />
            COSIRI Reports
          </h1>
          <p className="text-muted-foreground mt-1">AI-generated insights across all assessments</p>
        </div>
        <Link
          href="/cosiri/assessment"
          className="px-4 py-2.5 rounded-lg font-medium bg-primary text-primary-foreground shadow-sm hover:shadow-md transition-all flex items-center gap-2 text-sm"
        >
          <Plus className="w-4 h-4" /> New Assessment
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 rounded-2xl bg-muted/30 animate-pulse" />
          ))}
        </div>
      ) : !assessments?.length ? (
        <div className="text-center py-20 bg-card border border-dashed border-border rounded-2xl">
          <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-lg font-medium text-muted-foreground">No assessments yet</p>
          <p className="text-sm text-muted-foreground/60 mt-1 mb-6">Run an assessment first to generate reports</p>
          <Link href="/cosiri/assessment" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity">
            <Plus className="w-4 h-4" /> Start Assessment
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {assessments.map((assessment) => {
            const insights = insightsMap?.[assessment.id] ?? [];
            const completedTypes = insights.map(i => i.type);
            const allGenerated = INSIGHT_TYPES.every(t => completedTypes.includes(t.key));

            return (
              <div key={assessment.id} className="bg-card border border-border rounded-2xl shadow-sm p-6">
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-semibold text-foreground">{assessment.companyName}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        assessment.status === "completed" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                      }`}>
                        {assessment.status}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground flex items-center gap-3">
                      <span>{assessment.industry}</span>
                      <span className="text-muted-foreground/30">·</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(assessment.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">{scoreToFloat(assessment.overallScore)}</div>
                    <div className="text-xs text-muted-foreground">/5.0 index</div>
                  </div>
                </div>

                {/* Report type status chips */}
                <div className="flex flex-wrap gap-2 mb-5">
                  {INSIGHT_TYPES.map(({ key, label }) => {
                    const generated = completedTypes.includes(key);
                    return (
                      <span key={key} className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                        generated ? "bg-green-50 text-green-700 border border-green-200" : "bg-muted text-muted-foreground border border-border"
                      }`}>
                        {generated
                          ? <CheckCircle2 className="w-3 h-3" />
                          : <AlertCircle className="w-3 h-3 opacity-50" />}
                        {label}
                      </span>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <p className="text-xs text-muted-foreground">
                    {allGenerated
                      ? "All 3 report sections generated and auto-saved"
                      : `${completedTypes.length} of ${INSIGHT_TYPES.length} sections generated`}
                  </p>
                  <Link
                    href={`/cosiri/report/${assessment.id}`}
                    className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                  >
                    {completedTypes.length > 0 ? "View Report" : "Generate Report"}
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AppLayout>
  );
}
