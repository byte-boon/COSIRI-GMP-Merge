import { Link } from "wouter";
import { Plus, ShieldCheck, Search } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useListGmpAssessments } from "@workspace/api-client-react";

export default function GmpAssessmentList() {
  const { data: assessments, isLoading } = useListGmpAssessments();

  return (
    <AppLayout>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Audit Master List</h1>
          <p className="text-muted-foreground mt-1">Manage all GMP assessments</p>
        </div>
        <Link 
          href="/gmp/assessments/new"
          className="px-5 py-2.5 rounded-lg font-medium bg-blue-600 text-white shadow-sm hover:shadow-md transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> New Audit
        </Link>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border flex items-center bg-muted/10">
          <div className="relative w-full max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search audits..." 
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-background border border-border focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            />
          </div>
        </div>
        
        <table className="w-full text-left">
          <thead className="bg-muted/30 border-b border-border">
            <tr>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">ID</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Scope</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Date</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">Loading...</td></tr>
            ) : assessments?.map(a => (
              <tr key={a.id} className="hover:bg-muted/10 transition-colors">
                <td className="px-6 py-4 font-mono text-sm text-muted-foreground">{a.auditId}</td>
                <td className="px-6 py-4 font-medium">{a.scope}</td>
                <td className="px-6 py-4 text-sm">{new Date(a.startDate).toLocaleDateString()}</td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold capitalize ${a.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                    {a.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <Link href={`/gmp/assessments/${a.id}`} className="text-sm text-blue-600 font-medium hover:underline">
                    {a.status === 'completed' ? 'View Details' : 'Continue'}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppLayout>
  );
}
