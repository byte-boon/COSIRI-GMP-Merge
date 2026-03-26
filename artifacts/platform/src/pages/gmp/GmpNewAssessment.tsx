import { useState } from "react";
import { useLocation, Link } from "wouter";
import { ChevronLeft, Save } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useCreateGmpAssessment } from "@workspace/api-client-react";
import { useCompany } from "@/contexts/CompanyContext";

export default function GmpNewAssessment() {
  const [, setLocation] = useLocation();
  const { company } = useCompany();
  const { mutateAsync: createAssessment, isPending } = useCreateGmpAssessment();
  const [scope, setScope] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company || !scope) return;
    try {
      const assessment = await createAssessment({
        data: {
          companyId: company.id,
          scope,
          status: "in-progress",
          overallScore: 0,
          startDate: new Date().toISOString()
        }
      });
      setLocation(`/gmp/assessments/${assessment.id}`);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <AppLayout>
      <Link href="/gmp/assessments" className="text-sm text-muted-foreground hover:text-primary flex items-center mb-6 w-fit">
        <ChevronLeft className="w-4 h-4 mr-1" /> Back to Audits
      </Link>
      
      <div className="max-w-xl">
        <h1 className="text-3xl font-display font-bold mb-2">New Audit Setup</h1>
        <p className="text-muted-foreground mb-8">Define the scope and parameters for the new GMP assessment.</p>

        <form onSubmit={handleSubmit} className="bg-card p-6 rounded-2xl border border-border shadow-sm space-y-6">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Audit Scope / Facility</label>
            <input 
              value={scope}
              onChange={e => setScope(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
              placeholder="e.g. Building A - Q3 Internal Audit"
            />
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={isPending || !scope}
              className="w-full py-3 rounded-xl font-bold bg-blue-600 text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" />
              {isPending ? "Initializing..." : "Start Audit"}
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
