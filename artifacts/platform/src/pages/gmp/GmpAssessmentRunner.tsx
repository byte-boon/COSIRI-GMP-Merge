import { useState, useEffect } from "react";
import { useRoute, Link } from "wouter";
import { ChevronLeft, AlertTriangle, CheckCircle, Save } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { GMP_SECTIONS } from "@/lib/gmp-data";
import { useGetGmpAssessment, useSaveGmpResponses, useCreateGmpFinding } from "@workspace/api-client-react";

export default function GmpAssessmentRunner() {
  const [, params] = useRoute("/gmp/assessments/:id");
  const id = params?.id ? parseInt(params.id) : 0;

  const { data: assessment, isLoading } = useGetGmpAssessment(id, { query: { enabled: !!id } });
  const { mutateAsync: saveResponses, isPending: isSaving } = useSaveGmpResponses();
  const { mutateAsync: createFinding } = useCreateGmpFinding();

  const [responses, setResponses] = useState<Record<string, string>>({});
  const [activeSectionId, setActiveSectionId] = useState(GMP_SECTIONS[0].id);

  // Sync initial data
  useEffect(() => {
    if (assessment?.responses) {
      setResponses(assessment.responses as Record<string, string>);
    }
  }, [assessment]);

  if (isLoading) return <AppLayout><div className="p-20 text-center">Loading...</div></AppLayout>;
  if (!assessment) return <AppLayout><div className="p-20 text-center">Not found</div></AppLayout>;

  const activeSection = GMP_SECTIONS.find(s => s.id === activeSectionId)!;

  const handleResponse = (itemId: string, value: string) => {
    const newResponses = { ...responses, [itemId]: value };
    setResponses(newResponses);

    // Auto-create finding if noncompliant
    if (value === "noncompliant") {
      const desc = prompt("Enter finding description for CAPA:");
      if (desc) {
        createFinding({
          data: {
            assessmentId: id,
            itemId,
            type: "audit_finding",
            severity: "major",
            description: desc,
            status: "open"
          }
        });
      }
    }
  };

  const handleSave = async () => {
    try {
      await saveResponses({ id, data: responses });
      alert("Progress saved!");
    } catch (error) {
      console.error(error);
    }
  };

  const calculateScore = () => {
    const keys = Object.keys(responses);
    if (keys.length === 0) return 0;
    const compliant = keys.filter(k => responses[k] === "compliant").length;
    return Math.round((compliant / keys.length) * 100);
  };

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <Link href="/gmp/assessments" className="text-sm text-muted-foreground hover:text-blue-600 flex items-center transition-colors">
          <ChevronLeft className="w-4 h-4 mr-1" /> Back
        </Link>
        <button onClick={handleSave} disabled={isSaving} className="flex items-center text-sm font-medium bg-blue-50 text-blue-700 px-3 py-1.5 rounded-md hover:bg-blue-100 transition-colors">
          <Save className="w-4 h-4 mr-2" /> {isSaving ? "Saving..." : "Save Progress"}
        </button>
      </div>

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-3xl font-display font-bold">{assessment.scope}</h1>
          <span className="px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-muted text-muted-foreground border">{assessment.auditId}</span>
        </div>
        <p className="text-muted-foreground font-medium">Current Score: {calculateScore()}%</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Navigation Sidebar */}
        <div className="w-full lg:w-64 shrink-0 space-y-2">
          {GMP_SECTIONS.map(section => {
            const isActive = activeSectionId === section.id;
            const itemsAns = section.items.filter(i => responses[i.id]).length;
            const isComplete = itemsAns === section.items.length;

            return (
              <button
                key={section.id}
                onClick={() => setActiveSectionId(section.id)}
                className={`w-full text-left p-4 rounded-xl border transition-all ${isActive ? 'bg-blue-50 border-blue-500 shadow-sm' : 'bg-card border-border hover:bg-muted/50'}`}
              >
                <div className="flex items-start justify-between">
                  <span className={`font-semibold text-sm ${isActive ? 'text-blue-700' : 'text-foreground'}`}>{section.title}</span>
                  {isComplete && <CheckCircle className="w-4 h-4 text-green-500" />}
                </div>
                <div className="text-xs text-muted-foreground mt-1">{itemsAns}/{section.items.length} items</div>
              </button>
            )
          })}
        </div>

        {/* Checklist */}
        <div className="flex-1 space-y-6">
          <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
            <h2 className="text-xl font-bold mb-6">{activeSection.title}</h2>
            
            <div className="space-y-6">
              {activeSection.items.map(item => (
                <div key={item.id} className="pb-6 border-b border-border last:border-0 last:pb-0">
                  <div className="flex justify-between mb-3">
                    <div>
                      <span className="text-xs font-bold font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded mb-2 inline-block">{item.id}</span>
                      <h4 className="font-semibold text-foreground">{item.label}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {["compliant", "partial", "noncompliant", "na"].map(opt => {
                      const isSelected = responses[item.id] === opt;
                      const getColors = () => {
                        if (!isSelected) return "bg-background border-border text-foreground hover:border-muted-foreground";
                        if (opt === "compliant") return "bg-green-100 border-green-500 text-green-800 ring-2 ring-green-500/20";
                        if (opt === "noncompliant") return "bg-red-100 border-red-500 text-red-800 ring-2 ring-red-500/20";
                        if (opt === "partial") return "bg-amber-100 border-amber-500 text-amber-800 ring-2 ring-amber-500/20";
                        return "bg-slate-200 border-slate-400 text-slate-800";
                      };

                      return (
                        <button
                          key={opt}
                          onClick={() => handleResponse(item.id, opt)}
                          className={`px-4 py-2 rounded-lg border text-sm font-semibold capitalize transition-all ${getColors()}`}
                        >
                          {opt}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
