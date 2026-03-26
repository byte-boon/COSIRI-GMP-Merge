import { useState, useEffect } from "react";
import { useRoute, Link } from "wouter";
import ReactMarkdown from "react-markdown";
import { ChevronLeft, Sparkles, RefreshCw, FileText, CheckCircle2, Clock } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useGenerateCosiriInsight, useGetLatestCosiriInsights } from "@workspace/api-client-react";

type InsightType = "executive_summary" | "gap_analysis" | "roadmap";

const TABS: { key: InsightType; label: string }[] = [
  { key: "executive_summary", label: "Executive Summary" },
  { key: "gap_analysis", label: "Gap Analysis" },
  { key: "roadmap", label: "Strategic Roadmap" },
];

export default function CosiriReport() {
  const [, params] = useRoute("/cosiri/report/:id");
  const id = params?.id ? parseInt(params.id) : 0;

  const [activeTab, setActiveTab] = useState<InsightType>("executive_summary");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  const { data: insights, refetch, isLoading: loadingInsights } = useGetLatestCosiriInsights(id, {
    query: { enabled: !!id },
  });
  const { mutateAsync: generateInsight, isPending } = useGenerateCosiriInsight();

  // Auto-save indicator: show "Saved" when a tab already has content
  useEffect(() => {
    if (insights?.[activeTab]?.content) {
      setSaveStatus("saved");
      setLastSavedAt(new Date());
    } else {
      setSaveStatus("idle");
    }
  }, [activeTab, insights]);

  const handleGenerate = async () => {
    setSaveStatus("saving");
    try {
      await generateInsight({ id, data: { type: activeTab } });
      await refetch();
      setSaveStatus("saved");
      setLastSavedAt(new Date());
    } catch (error) {
      console.error(error);
      setSaveStatus("idle");
    }
  };

  // Auto-generate all tabs sequentially on first visit if none generated yet
  const hasAnyContent = TABS.some(t => insights?.[t.key]?.content);
  const allGenerated = TABS.every(t => insights?.[t.key]?.content);

  const currentContent = insights?.[activeTab]?.content;
  const currentInsight = insights?.[activeTab];

  const formatTime = (date: Date) =>
    date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

  return (
    <AppLayout>
      {/* Header */}
      <div className="mb-6">
        <Link href={`/cosiri/results/${id}`} className="text-sm text-muted-foreground hover:text-primary flex items-center mb-4 transition-colors w-fit">
          <ChevronLeft className="w-4 h-4 mr-1" /> Back to Results
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold">AI Report Builder</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Generate and auto-save AI-powered insights for this assessment
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Auto-save status */}
            <div className="flex items-center gap-1.5 text-xs">
              {saveStatus === "saving" && (
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <RefreshCw className="w-3 h-3 animate-spin" /> Saving…
                </span>
              )}
              {saveStatus === "saved" && lastSavedAt && (
                <span className="flex items-center gap-1.5 text-green-600 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Auto-saved {formatTime(lastSavedAt)}
                </span>
              )}
              {saveStatus === "idle" && (
                <span className="flex items-center gap-1.5 text-muted-foreground/50">
                  <Clock className="w-3 h-3" /> Not generated yet
                </span>
              )}
            </div>

            <button
              onClick={handleGenerate}
              disabled={isPending}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium shadow-md shadow-purple-500/20 flex items-center gap-2 hover:bg-purple-700 transition-colors disabled:opacity-50 text-sm"
            >
              {isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {currentContent ? "Regenerate" : "Generate"}
            </button>
          </div>
        </div>
      </div>

      {/* Progress chips */}
      <div className="flex flex-wrap gap-2 mb-6">
        {TABS.map(({ key, label }) => {
          const generated = !!insights?.[key]?.content;
          return (
            <span key={key} className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
              generated
                ? "bg-green-50 text-green-700 border-green-200"
                : "bg-muted text-muted-foreground border-border"
            }`}>
              <CheckCircle2 className={`w-3 h-3 ${generated ? "text-green-600" : "opacity-30"}`} />
              {label}
            </span>
          );
        })}
        {allGenerated && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
            <CheckCircle2 className="w-3 h-3" /> All sections saved
          </span>
        )}
      </div>

      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden min-h-[500px] flex flex-col">
        {/* Tabs */}
        <div className="flex border-b border-border bg-muted/20">
          {TABS.map(({ key, label }) => {
            const generated = !!insights?.[key]?.content;
            return (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`px-6 py-4 text-sm font-bold tracking-wide transition-colors border-b-2 flex items-center gap-2 ${
                  activeTab === key
                    ? "border-primary text-primary bg-background"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}
                {generated && <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="p-8 flex-1">
          {loadingInsights ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-4 py-20">
              <RefreshCw className="w-8 h-8 animate-spin text-primary/50" />
              <p>Loading insights…</p>
            </div>
          ) : isPending ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-4 py-20">
              <RefreshCw className="w-8 h-8 animate-spin text-purple-500" />
              <p className="font-medium text-purple-600">Generating and auto-saving…</p>
              <p className="text-xs opacity-60">This may take a few seconds</p>
            </div>
          ) : currentContent ? (
            <div>
              {/* Last saved metadata */}
              {currentInsight && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-6 pb-4 border-b border-border">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                  <span>
                    Auto-saved · Version {currentInsight.version} ·{" "}
                    {new Date(currentInsight.createdAt).toLocaleString("en-GB", {
                      day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
                    })}
                  </span>
                </div>
              )}
              <div className="prose max-w-none dark:prose-invert prose-headings:font-display prose-h1:text-2xl prose-a:text-primary">
                <ReactMarkdown>{currentContent}</ReactMarkdown>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-4 py-20 bg-muted/10 rounded-xl border border-dashed border-border m-4">
              <FileText className="w-12 h-12 text-muted-foreground/30" />
              <p className="text-lg font-medium">No content generated yet</p>
              <p className="text-sm opacity-60">Click Generate — it saves automatically once done</p>
              <button
                onClick={handleGenerate}
                disabled={isPending}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-purple-600 text-white font-medium text-sm hover:bg-purple-700 transition-colors mt-2"
              >
                <Sparkles className="w-4 h-4" /> Generate & Auto-Save
              </button>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
