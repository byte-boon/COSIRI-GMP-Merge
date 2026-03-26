import { useState } from "react";
import { AlertTriangle, Plus, Search, Filter } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useListGmpFindings } from "@workspace/api-client-react";

export default function GmpFindings() {
  const { data: findings, isLoading } = useListGmpFindings();
  const [filter, setFilter] = useState("all");

  const filteredFindings = findings?.filter(f => filter === "all" || f.status === filter) || [];

  return (
    <AppLayout>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
            Findings & CAPA
          </h1>
          <p className="text-muted-foreground mt-1">Track and resolve compliance issues</p>
        </div>
        <div className="flex gap-2">
          <select 
            value={filter} 
            onChange={e => setFilter(e.target.value)}
            className="px-4 py-2.5 rounded-lg border border-border bg-card text-sm font-medium outline-none focus:border-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="open">Open</option>
            <option value="in-progress">In Progress</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full py-10 text-center text-muted-foreground">Loading findings...</div>
        ) : filteredFindings.length === 0 ? (
          <div className="col-span-full py-10 text-center bg-card border border-dashed border-border rounded-xl">
            <AlertTriangle className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-muted-foreground font-medium">No findings recorded yet.</p>
          </div>
        ) : filteredFindings.map(finding => (
          <div key={finding.id} className="bg-card rounded-2xl border border-border shadow-sm p-6 flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <span className="px-2 py-1 rounded bg-muted text-xs font-bold font-mono text-muted-foreground">
                Item: {finding.itemId}
              </span>
              <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                finding.severity === 'critical' ? 'bg-red-100 text-red-700' :
                finding.severity === 'major' ? 'bg-orange-100 text-orange-700' :
                'bg-blue-100 text-blue-700'
              }`}>
                {finding.severity}
              </span>
            </div>
            
            <p className="text-foreground font-medium mb-6 flex-1">
              {finding.description}
            </p>

            <div className="pt-4 border-t border-border flex justify-between items-center mt-auto">
              <span className={`flex items-center text-xs font-bold uppercase tracking-wider ${
                finding.status === 'open' ? 'text-red-500' :
                finding.status === 'in-progress' ? 'text-amber-500' :
                'text-green-500'
              }`}>
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  finding.status === 'open' ? 'bg-red-500' :
                  finding.status === 'in-progress' ? 'bg-amber-500' :
                  'bg-green-500'
                }`} />
                {finding.status}
              </span>
              <button className="text-sm font-medium text-blue-600 hover:underline">Update</button>
            </div>
          </div>
        ))}
      </div>
    </AppLayout>
  );
}
