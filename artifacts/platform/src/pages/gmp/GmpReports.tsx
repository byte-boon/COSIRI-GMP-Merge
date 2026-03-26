import { Link } from "wouter";
import { BarChart3, Clock, ChevronRight, CheckCircle2, AlertCircle, Plus, ShieldCheck } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useListGmpAssessments, useListGmpFindings } from "@workspace/api-client-react";

export default function GmpReports() {
  const { data: assessments, isLoading } = useListGmpAssessments();
  const { data: findings } = useListGmpFindings();

  const completed = assessments?.filter(a => a.status === "completed") ?? [];

  const findingsForAssessment = (id: number) =>
    findings?.filter(f => f.assessmentId === id) ?? [];

  const severityColor = (s: string) =>
    s === "critical" ? "text-red-600" : s === "major" ? "text-orange-500" : "text-blue-500";

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-blue-600" />
            GMP Reports
          </h1>
          <p className="text-muted-foreground mt-1">Completed audit summaries with findings and compliance scores</p>
        </div>
        <Link
          href="/gmp/assessments/new"
          className="px-4 py-2.5 rounded-lg font-medium bg-blue-600 text-white shadow-sm hover:shadow-md transition-all flex items-center gap-2 text-sm"
        >
          <Plus className="w-4 h-4" /> New Audit
        </Link>
      </div>

      {/* Summary row */}
      {assessments && assessments.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Audits", value: assessments.length, icon: BarChart3, color: "text-blue-600" },
            { label: "Completed", value: completed.length, icon: CheckCircle2, color: "text-green-600" },
            { label: "In Progress", value: assessments.filter(a => a.status !== "completed").length, icon: AlertCircle, color: "text-amber-500" },
            { label: "Total Findings", value: findings?.length ?? 0, icon: ShieldCheck, color: "text-red-500" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-card border border-border rounded-xl p-4">
              <div className={`${color} mb-2`}><Icon className="w-5 h-5" /></div>
              <div className="text-2xl font-bold text-foreground">{value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map(i => <div key={i} className="h-36 rounded-2xl bg-muted/30 animate-pulse" />)}
        </div>
      ) : completed.length === 0 ? (
        <div className="text-center py-20 bg-card border border-dashed border-border rounded-2xl">
          <BarChart3 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-lg font-medium text-muted-foreground">No completed audits yet</p>
          <p className="text-sm text-muted-foreground/60 mt-1 mb-6">Complete a GMP audit to see its report here</p>
          <Link href="/gmp/assessments" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 text-white font-medium text-sm hover:opacity-90 transition-opacity">
            <Plus className="w-4 h-4" /> Start Audit
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {completed.map((audit) => {
            const auditFindings = findingsForAssessment(audit.id);
            const criticalCount = auditFindings.filter(f => f.severity === "critical").length;
            const majorCount = auditFindings.filter(f => f.severity === "major").length;
            const minorCount = auditFindings.filter(f => f.severity === "minor").length;
            const complianceScore = audit.overallScore ?? 0;

            return (
              <div key={audit.id} className="bg-card border border-border rounded-2xl shadow-sm p-6">
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-mono text-sm text-muted-foreground">{audit.auditId}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-green-100 text-green-700">
                        Completed
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-1">{audit.scope}</h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {audit.startDate ? new Date(audit.startDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className={`text-3xl font-bold ${complianceScore >= 80 ? "text-green-600" : complianceScore >= 60 ? "text-amber-500" : "text-red-500"}`}>
                      {complianceScore}%
                    </div>
                    <div className="text-xs text-muted-foreground">compliance</div>
                  </div>
                </div>

                {/* Compliance bar */}
                <div className="h-2 rounded-full bg-muted mb-5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${complianceScore >= 80 ? "bg-green-500" : complianceScore >= 60 ? "bg-amber-400" : "bg-red-500"}`}
                    style={{ width: `${complianceScore}%` }}
                  />
                </div>

                {/* Findings breakdown */}
                {auditFindings.length > 0 ? (
                  <div className="flex gap-4 mb-5">
                    {criticalCount > 0 && (
                      <span className="flex items-center gap-1.5 text-xs font-medium text-red-600">
                        <div className="w-2 h-2 rounded-full bg-red-500" />
                        {criticalCount} Critical
                      </span>
                    )}
                    {majorCount > 0 && (
                      <span className="flex items-center gap-1.5 text-xs font-medium text-orange-500">
                        <div className="w-2 h-2 rounded-full bg-orange-400" />
                        {majorCount} Major
                      </span>
                    )}
                    {minorCount > 0 && (
                      <span className="flex items-center gap-1.5 text-xs font-medium text-blue-500">
                        <div className="w-2 h-2 rounded-full bg-blue-400" />
                        {minorCount} Minor
                      </span>
                    )}
                    {auditFindings.length === 0 && (
                      <span className="text-xs text-green-600 font-medium">No findings recorded</span>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-green-600 font-medium mb-5 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> No findings recorded
                  </p>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <p className="text-xs text-muted-foreground">
                    Report auto-saved · {auditFindings.length} finding{auditFindings.length !== 1 ? "s" : ""} total
                  </p>
                  <Link
                    href={`/gmp/report/${audit.id}`}
                    className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:underline"
                  >
                    View Full Report <ChevronRight className="w-4 h-4" />
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
