import { Link } from "wouter";
import { Plus, BarChart2, Activity, TrendingUp } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";

export default function CosiriHome() {
  return (
    <AppLayout>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">COSIRI Dashboard</h1>
          <p className="text-muted-foreground mt-1">Sustainability maturity assessment overview</p>
        </div>
        <Link 
          href="/cosiri/assessment"
          className="px-5 py-2.5 rounded-lg font-medium bg-primary text-primary-foreground shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center gap-2 w-fit"
        >
          <Plus className="w-4 h-4" /> New Assessment
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
          <div className="flex items-center gap-3 mb-2 text-muted-foreground">
            <Activity className="w-5 h-5 text-primary" />
            <span className="font-medium text-sm uppercase tracking-wider">Latest Score</span>
          </div>
          <div className="text-4xl font-display font-bold">2.4<span className="text-xl text-muted-foreground">/5</span></div>
          <p className="text-sm text-green-600 mt-2 flex items-center gap-1 font-medium"><TrendingUp className="w-4 h-4"/> +0.3 from last year</p>
        </div>
        
        <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
          <div className="flex items-center gap-3 mb-2 text-muted-foreground">
            <BarChart2 className="w-5 h-5 text-blue-500" />
            <span className="font-medium text-sm uppercase tracking-wider">Assessments Run</span>
          </div>
          <div className="text-4xl font-display font-bold">3</div>
          <p className="text-sm text-muted-foreground mt-2">Last run on Oct 12, 2024</p>
        </div>

        <div className="bg-gradient-to-br from-primary to-primary/80 p-6 rounded-2xl border border-primary-border shadow-lg text-primary-foreground relative overflow-hidden">
          <div className="absolute right-0 top-0 opacity-10 scale-150 transform translate-x-4 -translate-y-4">
            <BarChart2 className="w-32 h-32" />
          </div>
          <div className="relative z-10">
            <h3 className="font-bold text-lg mb-1">Generate AI Reports</h3>
            <p className="text-primary-foreground/80 text-sm mb-4">Get executive summaries and action roadmaps instantly.</p>
            <Link href="/cosiri/results/1" className="text-sm font-semibold bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg inline-block transition-colors">
              View Latest Results
            </Link>
          </div>
        </div>
      </div>

      {/* Simulated History Table */}
      <h2 className="text-xl font-bold mb-4">Assessment History</h2>
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="px-6 py-4 text-sm font-medium text-muted-foreground">Date</th>
              <th className="px-6 py-4 text-sm font-medium text-muted-foreground">Score</th>
              <th className="px-6 py-4 text-sm font-medium text-muted-foreground">Status</th>
              <th className="px-6 py-4 text-sm font-medium text-muted-foreground text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            <tr className="hover:bg-muted/20 transition-colors">
              <td className="px-6 py-4 font-medium">Oct 12, 2024</td>
              <td className="px-6 py-4">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">Band 2.4</span>
              </td>
              <td className="px-6 py-4">
                <span className="inline-flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-green-500"></div> Completed</span>
              </td>
              <td className="px-6 py-4 text-right">
                <Link href="/cosiri/results/1" className="text-sm text-primary hover:underline font-medium">View Report</Link>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </AppLayout>
  );
}
