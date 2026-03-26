import { useState } from "react";
import { useLocation } from "wouter";
import { CheckCircle2, ChevronRight, Save, Activity } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { COSIRI_DATA, BUILDING_BLOCKS } from "@/lib/cosiri-data";
import { useCompany } from "@/contexts/CompanyContext";
import { useCreateCosiriAssessment, useSaveCosiriAnswers } from "@workspace/api-client-react";

export default function CosiriAssessment() {
  const [, setLocation] = useLocation();
  const { company } = useCompany();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [activeBlock, setActiveBlock] = useState<string>(BUILDING_BLOCKS[0]);

  const { mutateAsync: createAssessment, isPending: isCreating } = useCreateCosiriAssessment();
  const { mutateAsync: saveAnswers, isPending: isSaving } = useSaveCosiriAnswers();

  const handleAnswer = (dimensionId: string, score: number) => {
    setAnswers(prev => ({ ...prev, [dimensionId]: score }));
  };

  const dimensionsInBlock = COSIRI_DATA.filter(d => d.block === activeBlock);
  const totalAnswered = Object.keys(answers).length;
  const progress = Math.round((totalAnswered / COSIRI_DATA.length) * 100);

  const handleSubmit = async () => {
    if (!company) return;
    try {
      const overallScore = Object.values(answers).reduce((a,b)=>a+b, 0) / COSIRI_DATA.length;
      
      const assessment = await createAssessment({
        data: {
          companyId: company.id,
          companyName: company.name,
          industry: company.industry,
          status: "completed",
          overallScore: Math.round(overallScore)
        }
      });

      const answerPayload = Object.entries(answers).map(([dimensionId, score]) => ({
        assessmentId: assessment.id,
        dimensionId,
        score,
        notes: ""
      }));

      await saveAnswers({ id: assessment.id, data: answerPayload });
      setLocation(`/cosiri/results/${assessment.id}`);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <AppLayout>
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold mb-2">Run Assessment</h1>
          <p className="text-muted-foreground">Select the maturity band for each dimension.</p>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-sm font-medium mb-1">{progress}% Complete</span>
          <div className="w-48 h-2 bg-secondary rounded-full overflow-hidden">
            <div className="h-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Navigation Sidebar */}
        <div className="w-full lg:w-64 shrink-0 space-y-2">
          {BUILDING_BLOCKS.map(block => {
            const blockDims = COSIRI_DATA.filter(d => d.block === block);
            const answeredInBlock = blockDims.filter(d => answers[d.id] !== undefined).length;
            const isComplete = answeredInBlock === blockDims.length;
            const isActive = activeBlock === block;

            return (
              <button
                key={block}
                onClick={() => setActiveBlock(block)}
                className={`w-full text-left p-4 rounded-xl border transition-all flex flex-col gap-2 ${isActive ? 'bg-card border-primary shadow-sm ring-1 ring-primary/20' : 'bg-transparent border-transparent hover:bg-muted/50'}`}
              >
                <div className="flex items-start justify-between w-full">
                  <span className={`font-semibold text-sm ${isActive ? 'text-primary' : 'text-foreground'}`}>{block}</span>
                  {isComplete && <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />}
                </div>
                <span className="text-xs text-muted-foreground font-mono">{answeredInBlock} / {blockDims.length} answered</span>
              </button>
            )
          })}
        </div>

        {/* Content Area */}
        <div className="flex-1 space-y-8">
          {dimensionsInBlock.map(dim => (
            <div key={dim.id} className="bg-card rounded-2xl border border-border shadow-sm p-6">
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary">{dim.pillar}</span>
                  <span className="text-xs font-mono text-muted-foreground">{dim.id}</span>
                </div>
                <h3 className="text-xl font-bold">{dim.name}</h3>
                <p className="text-muted-foreground mt-1">{dim.question}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {dim.options.map(opt => {
                  const isSelected = answers[dim.id] === opt.score;
                  return (
                    <button
                      key={opt.score}
                      onClick={() => handleAnswer(dim.id, opt.score)}
                      className={`text-left p-4 rounded-xl border transition-all ${isSelected ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border bg-background hover:border-primary/40'}`}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className={`font-bold ${isSelected ? 'text-primary' : 'text-foreground'}`}>{opt.label}</span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-primary" />}
                      </div>
                      <p className="text-sm text-muted-foreground leading-snug">{opt.description}</p>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}

          <div className="pt-6 border-t border-border flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={progress !== 100 || isCreating || isSaving}
              className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20 hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 transition-all flex items-center gap-2"
            >
              <Save className="w-5 h-5" />
              {isCreating ? "Saving..." : "Submit Assessment"}
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
