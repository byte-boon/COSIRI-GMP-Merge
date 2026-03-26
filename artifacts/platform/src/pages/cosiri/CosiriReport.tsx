import { useState } from "react";
import { useRoute, Link } from "wouter";
import ReactMarkdown from "react-markdown";
import { ChevronLeft, Sparkles, AlertCircle, RefreshCw, FileText } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useGenerateCosiriInsight, useGetLatestCosiriInsights } from "@workspace/api-client-react";

export default function CosiriReport() {
  const [, params] = useRoute("/cosiri/report/:id");
  const id = params?.id ? parseInt(params.id) : 0;
  
  const [activeTab, setActiveTab] = useState<"executive_summary" | "gap_analysis" | "roadmap">("executive_summary");

  const { data: insights, refetch, isLoading: loadingInsights } = useGetLatestCosiriInsights(id, { query: { enabled: !!id } });
  const { mutateAsync: generateInsight, isPending } = useGenerateCosiriInsight();

  const handleGenerate = async () => {
    try {
      await generateInsight({ id, data: { type: activeTab } });
      refetch();
    } catch (error) {
      console.error(error);
    }
  };

  const currentContent = insights?.[activeTab]?.content;

  return (
    <AppLayout>
      <div className="mb-6">
        <Link href={`/cosiri/results/${id}`} className="text-sm text-muted-foreground hover:text-primary flex items-center mb-4 transition-colors w-fit">
          <ChevronLeft className="w-4 h-4 mr-1" /> Back to Results
        </Link>
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-display font-bold">AI Report Builder</h1>
          <button 
            onClick={handleGenerate}
            disabled={isPending}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium shadow-md shadow-purple-500/20 flex items-center gap-2 hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            {isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Generate {activeTab.replace('_', ' ')}
          </button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden min-h-[500px] flex flex-col">
        {/* Tabs */}
        <div className="flex border-b border-border bg-muted/20">
          <button 
            onClick={() => setActiveTab("executive_summary")}
            className={`px-6 py-4 text-sm font-bold capitalize tracking-wider transition-colors border-b-2 ${activeTab === "executive_summary" ? "border-primary text-primary bg-background" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            Executive Summary
          </button>
          <button 
            onClick={() => setActiveTab("gap_analysis")}
            className={`px-6 py-4 text-sm font-bold capitalize tracking-wider transition-colors border-b-2 ${activeTab === "gap_analysis" ? "border-primary text-primary bg-background" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            Gap Analysis
          </button>
          <button 
            onClick={() => setActiveTab("roadmap")}
            className={`px-6 py-4 text-sm font-bold capitalize tracking-wider transition-colors border-b-2 ${activeTab === "roadmap" ? "border-primary text-primary bg-background" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            Strategic Roadmap
          </button>
        </div>

        {/* Content */}
        <div className="p-8 flex-1">
          {loadingInsights ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-4 py-20">
              <RefreshCw className="w-8 h-8 animate-spin text-primary/50" />
              <p>Loading insights...</p>
            </div>
          ) : currentContent ? (
            <div className="prose max-w-none dark:prose-invert prose-headings:font-display prose-h1:text-2xl prose-a:text-primary">
              <ReactMarkdown>{currentContent}</ReactMarkdown>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-4 py-20 bg-muted/10 rounded-xl border border-dashed border-border m-4">
              <FileText className="w-12 h-12 text-muted-foreground/30" />
              <p className="text-lg">No content generated yet.</p>
              <button onClick={handleGenerate} className="text-primary font-medium flex items-center hover:underline">
                <Sparkles className="w-4 h-4 mr-2" /> Generate now
              </button>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
