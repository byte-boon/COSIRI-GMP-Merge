import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Paperclip, Upload, Sparkles, Trash2, RefreshCw,
  FileText, CheckCircle2, AlertCircle, File, Info,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

/* ── Per-dimension evidence guidance ── */
const EVIDENCE_HINTS: Record<string, { title: string; examples: string[] }> = {
  D1:  { title: "Strategy & Target Setting",   examples: ["Sustainability strategy document",  "Board-approved SBT commitments", "Annual sustainability targets report", "Corporate ESG roadmap"] },
  D2:  { title: "ESG Integration",             examples: ["Integrated annual report",           "TCFD disclosure",                 "Board ESG committee terms of reference", "ESG KPI dashboard"] },
  D3:  { title: "Green Business Modelling",    examples: ["Business model canvas (sustainability)", "Green revenue breakdown", "Product sustainability assessment", "New green-service launch plan"] },
  D4:  { title: "Capital Allocation",          examples: ["Green finance framework",             "Capex allocation showing sustainability criteria", "Investment policy document", "Sustainability-linked loan terms"] },
  D5:  { title: "Physical Climate Risk",       examples: ["TCFD physical risk assessment",       "Flood / heat stress scenario analysis", "Climate risk register", "Site-level resilience plan"] },
  D6:  { title: "Transition Risk",             examples: ["Carbon price sensitivity analysis",   "Energy transition roadmap",       "Stranded-asset assessment", "Regulatory compliance plan"] },
  D7:  { title: "Compliance Risk",             examples: ["Environmental compliance certificate","Regulatory filing records",       "Legal & compliance risk register", "Environmental permit"] },
  D8:  { title: "Reputation Risk",             examples: ["Stakeholder engagement report",       "ESG rating agency scorecard",     "Media / social monitoring summary", "Customer sustainability survey"] },
  D9:  { title: "GHG Emissions",               examples: ["GHG inventory (Scope 1/2/3)",         "Third-party verification report", "CDP submission",                     "Science-based targets letter"] },
  D10: { title: "Resources",                   examples: ["Energy consumption report",           "Water usage data",                "ISO 50001 certificate",              "Utility meter / billing data"] },
  D11: { title: "Material Waste",              examples: ["Waste management records",            "Waste diversion / recycling rates","ISO 14001 certificate",             "Landfill diversion data"] },
  D12: { title: "Pollution",                   examples: ["Air / water quality monitoring data", "Effluent discharge records",      "Environmental permit approval",       "Spill incident log"] },
  D13: { title: "Supplier Assessment",         examples: ["Supplier sustainability questionnaire","Supplier audit report",          "EcoVadis or similar scorecard",      "Supplier code of conduct"] },
  D14: { title: "Sustainable Procurement",     examples: ["Procurement policy with ESG criteria","Approved green-supplier list",   "Sustainable spend analysis",          "Tender evaluation scorecard"] },
  D15: { title: "Transportation",              examples: ["Logistics emissions report",          "Fleet electrification plan",      "Freight carbon footprint data",       "Last-mile delivery policy"] },
  D16: { title: "Supply-Chain Planning",       examples: ["Supply-chain sustainability map",     "Demand forecast with ESG factors","Inventory optimisation report",       "Network resilience study"] },
  D17: { title: "Product Design",              examples: ["Life Cycle Assessment (LCA) report",  "Eco-design guidelines",           "Material safety data sheets",         "Design-for-disassembly specs"] },
  D18: { title: "Circular Process",            examples: ["Take-back / returns scheme records",  "Recycling rate report",           "Circular design policy",             "End-of-life management data"] },
  D19: { title: "Technology Adoption",         examples: ["Clean-tech investment plan",          "Renewable energy contract (PPA)", "IoT monitoring system records",       "Digital decarbonisation roadmap"] },
  D20: { title: "Transparency",                examples: ["ESG data platform screenshots",       "Sustainability dashboard export",  "Data governance policy",             "Supply-chain traceability records"] },
  D21: { title: "Workforce Development",       examples: ["Sustainability training records",     "Competency framework document",   "L&D spend on ESG topics",            "Employee certification certificates"] },
  D22: { title: "Leadership Involvement",      examples: ["Board minutes with ESG agenda items","Executive ESG KPI scorecards",   "CEO/Chair sustainability statement",  "Sustainability committee charter"] },
  D23: { title: "External Communication",      examples: ["Published sustainability report",     "GRI / SASB content index",        "Press releases on ESG initiatives",  "Stakeholder feedback summary"] },
  D24: { title: "Governance Structure",        examples: ["Sustainability governance charter",   "Committee terms of reference",    "Policy & accountability matrix",      "ESG policy register"] },
};

interface EvidenceItem {
  id: number;
  dimensionId: string;
  fileName: string;
  fileType: string | null;
  fileSize: number | null;
  objectPath: string;
  aiSummary: string | null;
  summaryStatus: string;
  createdAt: string;
}

interface EvidenceBoxProps {
  assessmentId: number;
  dimensionId: string;
  dimensionName: string;
}

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

function formatSize(bytes: number | null) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(type: string | null) {
  if (!type) return <File className="w-4 h-4" />;
  if (type.includes("pdf")) return <FileText className="w-4 h-4 text-red-500" />;
  if (type.includes("word") || type.includes("document")) return <FileText className="w-4 h-4 text-blue-500" />;
  if (type.includes("sheet") || type.includes("excel") || type.includes("csv")) return <FileText className="w-4 h-4 text-green-600" />;
  if (type.includes("image")) return <File className="w-4 h-4 text-purple-500" />;
  return <FileText className="w-4 h-4 text-muted-foreground" />;
}

export function EvidenceBox({ assessmentId, dimensionId, dimensionName }: EvidenceBoxProps) {
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const evidenceKey = ["evidence", assessmentId, dimensionId];

  const { data: evidence = [] } = useQuery<EvidenceItem[]>({
    queryKey: evidenceKey,
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/cosiri/assessments/${assessmentId}/evidence?dimensionId=${dimensionId}`);
      if (!res.ok) throw new Error("Failed to load evidence");
      return res.json();
    },
    enabled: !!assessmentId && expanded,
    refetchInterval: (query) => {
      const items: EvidenceItem[] = (query.state.data as EvidenceItem[]) ?? [];
      return items.some(e => e.summaryStatus === "processing") ? 3000 : false;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await fetch(`${BASE}/api/cosiri/evidence/${id}`, { method: "DELETE" });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: evidenceKey }),
  });

  const analyzeMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`${BASE}/api/cosiri/evidence/${id}/analyze`, { method: "POST" });
      if (!res.ok) throw new Error("Analysis failed");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: evidenceKey }),
  });

  const uploadFile = async (file: File) => {
    setUploading(true);
    setUploadError(null);
    try {
      const urlRes = await fetch(`${BASE}/api/storage/uploads/request-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type }),
      });
      if (!urlRes.ok) throw new Error("Could not get upload URL");
      const { uploadURL, objectPath } = await urlRes.json();

      const putRes = await fetch(uploadURL, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!putRes.ok) throw new Error("Upload to storage failed");

      const saveRes = await fetch(`${BASE}/api/cosiri/assessments/${assessmentId}/evidence`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dimensionId,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          objectPath,
        }),
      });
      if (!saveRes.ok) throw new Error("Could not save evidence record");

      qc.invalidateQueries({ queryKey: evidenceKey });
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    Array.from(files).forEach(uploadFile);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const hasEvidence = evidence.length > 0;
  const analyzedCount = evidence.filter(e => e.summaryStatus === "completed").length;

  const hint = EVIDENCE_HINTS[dimensionId];

  return (
    <div className="mt-4 border-t border-border/60 pt-4">
      <button
        type="button"
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between text-left group"
      >
        <div className="flex items-center gap-2">
          <Paperclip className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
            Evidence Attachments
          </span>
          {hint && (
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span
                    onClick={e => e.stopPropagation()}
                    className="inline-flex items-center"
                  >
                    <Info className="w-3.5 h-3.5 text-primary/50 hover:text-primary transition-colors cursor-default" />
                  </span>
                </TooltipTrigger>
                <TooltipContent
                  side="right"
                  sideOffset={10}
                  className="bg-card border border-border shadow-xl rounded-xl p-4 max-w-[280px] z-50"
                >
                  <p className="text-[10px] font-bold uppercase tracking-wider text-primary mb-2">
                    Suggested evidence for {hint.title}
                  </p>
                  <ul className="space-y-1.5">
                    {hint.examples.map((ex) => (
                      <li key={ex} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                        <span className="text-primary mt-0.5 shrink-0">·</span>
                        {ex}
                      </li>
                    ))}
                  </ul>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {hasEvidence && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">
              {evidence.length} file{evidence.length !== 1 ? "s" : ""}
              {analyzedCount > 0 && <CheckCircle2 className="w-3 h-3" />}
            </span>
          )}
        </div>
        <span className="text-xs text-muted-foreground">{expanded ? "▲ collapse" : "▼ expand"}</span>
      </button>

      {expanded && (
        <div className="mt-3 space-y-3">
          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
              isDragging
                ? "border-primary bg-primary/5 scale-[1.01]"
                : "border-border hover:border-primary/50 hover:bg-muted/30"
            } ${uploading ? "pointer-events-none opacity-60" : ""}`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              accept=".pdf,.doc,.docx,.txt,.csv,.xlsx,.xls,.png,.jpg,.jpeg"
              onChange={e => handleFiles(e.target.files)}
            />
            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                <RefreshCw className="w-6 h-6 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Uploading…</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="w-6 h-6 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  Drag files here or <span className="text-primary font-medium">browse</span>
                </p>
                <p className="text-xs text-muted-foreground/60">PDF, Word, Excel, CSV, images</p>
                {hint && (
                  <div className="mt-1 px-3 py-2 rounded-lg bg-primary/5 border border-primary/10 text-left w-full">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-primary/70 mb-1">
                      Suggested for {hint.title}
                    </p>
                    <p className="text-[11px] text-muted-foreground/70 leading-relaxed">
                      {hint.examples.slice(0, 2).join(" · ")}
                      {hint.examples.length > 2 && (
                        <span className="text-primary/60"> +{hint.examples.length - 2} more</span>
                      )}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {uploadError && (
            <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {uploadError}
            </div>
          )}

          {/* Attached files */}
          {evidence.length > 0 && (
            <div className="space-y-2">
              {evidence.map(item => (
                <div key={item.id} className="bg-muted/30 border border-border rounded-xl overflow-hidden">
                  {/* File header */}
                  <div className="flex items-center gap-3 px-4 py-3">
                    {getFileIcon(item.fileType)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{item.fileName}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatSize(item.fileSize)}
                        {item.summaryStatus === "completed" && (
                          <span className="ml-2 text-green-600 font-medium">· AI Analysed</span>
                        )}
                        {item.summaryStatus === "processing" && (
                          <span className="ml-2 text-purple-600 font-medium animate-pulse">· Analysing…</span>
                        )}
                        {item.summaryStatus === "failed" && (
                          <span className="ml-2 text-red-500 font-medium">· Analysis failed</span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {(item.summaryStatus === "idle" || item.summaryStatus === "failed") && (
                        <button
                          type="button"
                          onClick={() => analyzeMutation.mutate(item.id)}
                          disabled={analyzeMutation.isPending}
                          title="Analyse with AI"
                          className="p-1.5 rounded-lg hover:bg-primary/10 text-purple-600 hover:text-purple-700 transition-colors disabled:opacity-40"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {item.summaryStatus === "processing" && (
                        <span className="p-1.5">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-500" />
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => deleteMutation.mutate(item.id)}
                        title="Remove file"
                        className="p-1.5 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* AI summary */}
                  {item.aiSummary && item.summaryStatus === "completed" && (
                    <div className="px-4 pb-4 border-t border-border/50">
                      <div className="mt-3 bg-purple-50 border border-purple-100 rounded-lg p-3">
                        <div className="flex items-center gap-1.5 mb-2">
                          <Sparkles className="w-3 h-3 text-purple-500" />
                          <p className="text-[10px] font-bold uppercase tracking-wider text-purple-600">AI Evidence Summary</p>
                        </div>
                        <p className="text-xs text-foreground leading-relaxed">{item.aiSummary}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
