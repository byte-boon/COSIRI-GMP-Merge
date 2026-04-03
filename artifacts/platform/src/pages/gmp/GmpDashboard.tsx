import { Link } from "wouter";
import { ShieldCheck, Plus, AlertTriangle, FileText, CheckCircle2 } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useListGmpAssessments, useListGmpFindings } from "@workspace/api-client-react";

export default function GmpDashboard() {
  const { data: assessments } = useListGmpAssessments();
  const { data: findings } = useListGmpFindings();

  const totalAudits = assessments?.length || 0;
  const avgScore = assessments?.length ? Math.round(assessments.reduce((acc, curr) => acc + (curr.overallScore || 0), 0) / totalAudits) : 0;
  const openFindings = findings?.filter(f => f.status === "open")?.length || 0;

  return (
    <AppLayout>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-blue-600" /> GMP Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">Good Manufacturing Practices compliance tracking</p>
        </div>
        <Link 
          href="/gmp/assessments/new"
          className="px-5 py-2.5 rounded-lg font-medium bg-blue-600 text-white shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:bg-blue-700 transition-all flex items-center gap-2 w-fit"
        >
          <Plus className="w-4 h-4" /> Start Audit
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-card p-6 rounded-2xl border border-border shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div>
            <div className="text-4xl font-display font-bold">{totalAudits}</div>
            <p className="text-sm font-medium text-muted-foreground mt-1 uppercase tracking-wider">Total Audits</p>
          </div>
        </div>

        <div className="bg-card p-6 rounded-2xl border border-border shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div>
            <div className="text-4xl font-display font-bold">{avgScore}%</div>
            <p className="text-sm font-medium text-muted-foreground mt-1 uppercase tracking-wider">Avg Compliance</p>
          </div>
        </div>

        <div className="bg-card p-6 rounded-2xl border border-red-200 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="absolute right-0 top-0 w-32 h-32 bg-red-50 rounded-bl-full -mr-10 -mt-10" />
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <div className="relative z-10">
            <div className="text-4xl font-display font-bold text-red-600">{openFindings}</div>
            <p className="text-sm font-medium text-red-600/70 mt-1 uppercase tracking-wider">Open CAPA Findings</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Recent Audits</h2>
            <Link href="/gmp/assessments" className="text-sm text-blue-600 hover:underline font-medium">View All</Link>
          </div>
          <div className="bg-card border border-border rounded-xl shadow-sm divide-y divide-border">
            {assessments?.slice(0,4).map(a => (
              <div key={a.id} className="p-4 flex items-center justify-between hover:bg-muted/20 transition-colors">
                <div>
                  <p className="font-semibold">{a.scope}</p>
                  <p className="text-xs text-muted-foreground">{new Date(a.startDate ?? Date.now()).toLocaleDateString()}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold capitalize ${a.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                  {a.status}
                </span>
              </div>
            ))}
            {(!assessments || assessments.length === 0) && (
               <div className="p-6 text-center text-muted-foreground text-sm">No audits found</div>
            )}
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Critical Findings</h2>
            <Link href="/gmp/findings" className="text-sm text-blue-600 hover:underline font-medium">Manage CAPA</Link>
          </div>
          <div className="bg-card border border-border rounded-xl shadow-sm divide-y divide-border">
            {findings?.filter(f => f.severity === 'critical').slice(0,4).map(f => (
              <div key={f.id} className="p-4 hover:bg-muted/20 transition-colors">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                  <p className="font-semibold text-sm">Item: {f.itemId}</p>
                  <span className="ml-auto text-[10px] uppercase font-bold text-muted-foreground px-2 py-0.5 bg-muted rounded">{f.status}</span>
                </div>
                <p className="text-sm text-muted-foreground truncate">{f.description}</p>
              </div>
            ))}
            {(!findings || findings.filter(f => f.severity === 'critical').length === 0) && (
               <div className="p-6 text-center text-muted-foreground text-sm">No critical findings</div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

