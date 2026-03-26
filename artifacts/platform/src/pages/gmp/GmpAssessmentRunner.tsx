import { useState, useEffect, useRef, useCallback } from "react";
import { useRoute, Link } from "wouter";
import {
  ChevronLeft, Save, CheckCircle, CheckCircle2, AlertCircle, MinusCircle,
  Paperclip, Upload, X, FileText, Info, ChevronDown, ChevronUp,
  Loader2, DownloadCloud
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { GMP_SECTIONS, calculateGmpScore, type GmpResponse, type GmpAttachment } from "@/lib/gmp-data";
import { useGetGmpAssessment, useSaveGmpResponses } from "@workspace/api-client-react";
import { useCompany } from "@/contexts/CompanyContext";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

// ── Score colour scheme ──────────────────────────────────────────────────────
const SCORE_CONFIG = [
  { score: 1, label: "1", longLabel: "Not Present",  bg: "bg-red-50",     border: "border-red-400",     text: "text-red-700",     ring: "ring-red-300",     dot: "bg-red-400",    hover: "hover:bg-red-50 hover:border-red-400 hover:text-red-700"    },
  { score: 2, label: "2", longLabel: "Initial",       bg: "bg-orange-50",  border: "border-orange-400",  text: "text-orange-700",  ring: "ring-orange-300",  dot: "bg-orange-400", hover: "hover:bg-orange-50 hover:border-orange-400 hover:text-orange-700" },
  { score: 3, label: "3", longLabel: "Developing",    bg: "bg-yellow-50",  border: "border-yellow-400",  text: "text-yellow-700",  ring: "ring-yellow-300",  dot: "bg-yellow-400", hover: "hover:bg-yellow-50 hover:border-yellow-400 hover:text-yellow-700" },
  { score: 4, label: "4", longLabel: "Managed",       bg: "bg-blue-50",    border: "border-blue-500",    text: "text-blue-700",    ring: "ring-blue-300",    dot: "bg-blue-500",   hover: "hover:bg-blue-50 hover:border-blue-500 hover:text-blue-700"   },
  { score: 5, label: "5", longLabel: "Optimised",     bg: "bg-green-50",   border: "border-green-500",   text: "text-green-700",   ring: "ring-green-300",   dot: "bg-green-500",  hover: "hover:bg-green-50 hover:border-green-500 hover:text-green-700"  },
];

const NA_CONFIG = { label: "N/A", bg: "bg-slate-50", border: "border-slate-300", text: "text-slate-500", ring: "ring-slate-200", dot: "bg-slate-300" };

// ── Section colour map ───────────────────────────────────────────────────────
const SECTION_COLORS: Record<string, { bg: string; border: string; text: string; activeBg: string; activeBorder: string; activeText: string }> = {
  leadership: { bg: "bg-blue-50",   border: "border-blue-200",   text: "text-blue-600",   activeBg: "bg-blue-50",   activeBorder: "border-blue-500",   activeText: "text-blue-700"   },
  workforce:  { bg: "bg-green-50",  border: "border-green-200",  text: "text-green-600",  activeBg: "bg-green-50",  activeBorder: "border-green-500",  activeText: "text-green-700"  },
  operations: { bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-600", activeBg: "bg-orange-50", activeBorder: "border-orange-500", activeText: "text-orange-700" },
  infosec:    { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-600", activeBg: "bg-purple-50", activeBorder: "border-purple-500", activeText: "text-purple-700" },
};

// ── Tooltip component ────────────────────────────────────────────────────────
function ScoreTooltip({ text, longLabel, score }: { text: string; longLabel: string; score: number }) {
  const cfg = SCORE_CONFIG.find(c => c.score === score)!;
  return (
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-72 pointer-events-none">
      <div className={`rounded-xl border ${cfg.border} ${cfg.bg} p-3 shadow-xl`}>
        <div className={`flex items-center gap-1.5 mb-1.5`}>
          <span className={`w-4 h-4 rounded-full ${cfg.dot} shrink-0`} />
          <p className={`text-xs font-bold uppercase tracking-wide ${cfg.text}`}>
            Score {score} — {longLabel}
          </p>
        </div>
        <p className="text-xs text-foreground leading-relaxed">{text}</p>
      </div>
      <div className={`absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent ${cfg.border.replace("border-", "border-t-")}`} />
    </div>
  );
}

// ── File attachment upload ───────────────────────────────────────────────────
function AttachmentUploader({
  itemId, attachments, onAttachmentsChange, sessionToken
}: {
  itemId: string;
  attachments: GmpAttachment[];
  onAttachmentsChange: (itemId: string, attachments: GmpAttachment[]) => void;
  sessionToken: string | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileSelect = useCallback(async (file: File) => {
    if (uploading) return;
    setUploading(true);
    setUploadError(null);
    try {
      // Step 1: Get presigned URL
      const urlRes = await fetch(`${BASE}/api/storage/uploads/request-url`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(sessionToken ? { "x-session-token": sessionToken } : {}),
        },
        body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type }),
      });
      if (!urlRes.ok) throw new Error("Failed to get upload URL");
      const { uploadURL, objectPath } = await urlRes.json();

      // Step 2: Upload directly to GCS
      const uploadRes = await fetch(uploadURL, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!uploadRes.ok) throw new Error("Upload to storage failed");

      const newAttachment: GmpAttachment = {
        name: file.name,
        path: objectPath,
        size: file.size,
        uploadedAt: new Date().toISOString(),
      };
      onAttachmentsChange(itemId, [...attachments, newAttachment]);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }, [uploading, attachments, itemId, onAttachmentsChange, sessionToken]);

  const handleRemove = (path: string) => {
    onAttachmentsChange(itemId, attachments.filter(a => a.path !== path));
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="mt-3">
      {attachments.length > 0 && (
        <div className="mb-2 space-y-1.5">
          {attachments.map(att => (
            <div key={att.path} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 border border-border">
              <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <a
                href={`${BASE}/api/storage${att.path}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-medium text-primary hover:underline truncate flex-1"
              >
                {att.name}
              </a>
              {att.size && <span className="text-[10px] text-muted-foreground shrink-0">{formatSize(att.size)}</span>}
              <button
                onClick={() => handleRemove(att.path)}
                className="w-4 h-4 rounded flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors shrink-0"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.csv,.txt"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }}
      />

      <button
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-dashed border-border text-xs font-medium text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5 transition-all disabled:opacity-50"
      >
        {uploading
          ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading…</>
          : <><Upload className="w-3.5 h-3.5" /> Attach evidence document</>
        }
      </button>
      {uploadError && <p className="text-destructive text-xs mt-1">{uploadError}</p>}
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function GmpAssessmentRunner() {
  const [, params] = useRoute("/gmp/assessments/:id");
  const id = params?.id ? parseInt(params.id) : 0;
  const { sessionToken } = useCompany();

  const { data: assessment, isLoading } = useGetGmpAssessment(id, { query: { enabled: !!id } });
  const { mutateAsync: saveResponses, isPending: isSaving } = useSaveGmpResponses();

  const [responses, setResponses] = useState<Record<string, GmpResponse>>({});
  const [activeSectionId, setActiveSectionId] = useState(GMP_SECTIONS[0].id);
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());
  const [hoveredScore, setHoveredScore] = useState<{ itemId: string; score: number } | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Migrate / load existing responses
  useEffect(() => {
    if (assessment?.responses) {
      const raw = assessment.responses as Record<string, unknown>;
      const migrated: Record<string, GmpResponse> = {};
      for (const [k, v] of Object.entries(raw)) {
        if (typeof v === "string") {
          // Legacy format migration
          const scoreMap: Record<string, number | null> = {
            compliant: 5, partial: 3, noncompliant: 1, na: null
          };
          migrated[k] = {
            score: scoreMap[v] ?? null,
            na: v === "na",
            notes: "",
            attachments: [],
          };
        } else if (v && typeof v === "object") {
          const obj = v as Partial<GmpResponse>;
          migrated[k] = {
            score: obj.score ?? null,
            na: obj.na ?? false,
            notes: obj.notes ?? "",
            attachments: obj.attachments ?? [],
          };
        }
      }
      setResponses(migrated);
    }
  }, [assessment]);

  if (isLoading) return <AppLayout><div className="p-20 text-center text-muted-foreground">Loading assessment…</div></AppLayout>;
  if (!assessment) return <AppLayout><div className="p-20 text-center text-muted-foreground">Assessment not found.</div></AppLayout>;

  const activeSection = GMP_SECTIONS.find(s => s.id === activeSectionId)!;
  const overallScore = calculateGmpScore(responses);
  const totalItems = GMP_SECTIONS.reduce((s, sec) => s + sec.items.length, 0);
  const answeredItems = Object.values(responses).filter(r => r.na || r.score !== null).length;

  const setScore = (itemId: string, score: number | null, na = false) => {
    setResponses(prev => ({
      ...prev,
      [itemId]: {
        ...(prev[itemId] ?? { notes: "", attachments: [] }),
        score: na ? null : score,
        na,
      },
    }));
  };

  const setNotes = (itemId: string, notes: string) => {
    setResponses(prev => ({
      ...prev,
      [itemId]: { ...(prev[itemId] ?? { score: null, na: false, attachments: [] }), notes },
    }));
  };

  const setAttachments = (itemId: string, attachments: GmpAttachment[]) => {
    setResponses(prev => ({
      ...prev,
      [itemId]: { ...(prev[itemId] ?? { score: null, na: false, notes: "" }), attachments },
    }));
  };

  const toggleNotes = (itemId: string) => {
    setExpandedNotes(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId); else next.add(itemId);
      return next;
    });
  };

  const handleSave = async () => {
    try {
      await saveResponses({ id, data: responses as unknown as Record<string, string> });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error(err);
    }
  };

  const getSectionProgress = (section: typeof GMP_SECTIONS[0]) => {
    const answered = section.items.filter(i => {
      const r = responses[i.id];
      return r && (r.na || r.score !== null);
    }).length;
    return { answered, total: section.items.length, pct: (answered / section.items.length) * 100 };
  };

  const getScoreForItem = (itemId: string) => responses[itemId]?.score ?? null;
  const isNa = (itemId: string) => responses[itemId]?.na ?? false;

  return (
    <AppLayout>
      {/* Header bar */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <Link href="/gmp/assessments" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1 pt-1 transition-colors shrink-0">
          <ChevronLeft className="w-4 h-4" /> Back
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-display font-bold truncate">{assessment.scope}</h1>
            <span className="px-2.5 py-0.5 rounded text-xs font-bold font-mono uppercase tracking-wider bg-muted text-muted-foreground border shrink-0">{assessment.auditId}</span>
          </div>
          <div className="flex items-center gap-4 mt-2">
            <div className="flex-1 max-w-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">{answeredItems} / {totalItems} items answered</span>
                <span className="text-xs font-bold text-foreground">{overallScore}%</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${overallScore}%`,
                    background: overallScore >= 70 ? "oklch(var(--su))" : overallScore >= 40 ? "#f59e0b" : "#ef4444"
                  }}
                />
              </div>
            </div>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className={`flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl transition-all shrink-0 ${
            saveSuccess
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
          }`}
        >
          {isSaving
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
            : saveSuccess
              ? <><CheckCircle2 className="w-4 h-4" /> Saved!</>
              : <><Save className="w-4 h-4" /> Save Progress</>
          }
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Section navigation */}
        <div className="w-full lg:w-60 xl:w-64 shrink-0 space-y-2">
          {GMP_SECTIONS.map(section => {
            const isActive = activeSectionId === section.id;
            const { answered, total, pct } = getSectionProgress(section);
            const complete = answered === total;
            const clr = SECTION_COLORS[section.id] ?? SECTION_COLORS.leadership;

            return (
              <button
                key={section.id}
                onClick={() => setActiveSectionId(section.id)}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  isActive
                    ? `${clr.activeBg} ${clr.activeBorder} shadow-sm`
                    : `bg-card border-border hover:bg-muted/30`
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className={`font-semibold text-sm leading-snug ${isActive ? clr.activeText : "text-foreground"}`}>
                    {section.title}
                  </span>
                  {complete
                    ? <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${clr.text}`} />
                    : <span className="text-[10px] text-muted-foreground shrink-0 mt-0.5">{answered}/{total}</span>
                  }
                </div>
                <div className="h-1 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${complete ? clr.text.replace("text-", "bg-") : clr.text.replace("text-", "bg-")}`}
                    style={{ width: `${pct}%`, opacity: 0.7 }}
                  />
                </div>
              </button>
            );
          })}

          {/* Scoring legend */}
          <div className="mt-4 bg-card border border-border rounded-xl p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">Score Key</p>
            <div className="space-y-1.5">
              {SCORE_CONFIG.map(cfg => (
                <div key={cfg.score} className="flex items-center gap-2">
                  <span className={`w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center border ${cfg.bg} ${cfg.border} ${cfg.text} shrink-0`}>
                    {cfg.score}
                  </span>
                  <span className="text-xs text-muted-foreground">{cfg.longLabel}</span>
                </div>
              ))}
              <div className="flex items-center gap-2">
                <span className={`w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center border ${NA_CONFIG.bg} ${NA_CONFIG.border} ${NA_CONFIG.text} shrink-0`}>
                  N/A
                </span>
                <span className="text-xs text-muted-foreground">Not Applicable</span>
              </div>
            </div>
          </div>
        </div>

        {/* Checklist items */}
        <div className="flex-1 min-w-0">
          {/* Section header */}
          <div className={`rounded-2xl border p-5 mb-4 ${SECTION_COLORS[activeSection.id]?.bg ?? "bg-muted/20"} ${SECTION_COLORS[activeSection.id]?.border ?? "border-border"}`}>
            <h2 className={`text-lg font-bold mb-1 ${SECTION_COLORS[activeSection.id]?.activeText ?? "text-foreground"}`}>{activeSection.title}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{activeSection.description}</p>
          </div>

          <div className="space-y-4">
            {activeSection.items.map(item => {
              const currentScore = getScoreForItem(item.id);
              const currentNa = isNa(item.id);
              const hasAnswer = currentNa || currentScore !== null;
              const notesExpanded = expandedNotes.has(item.id);
              const itemAttachments = responses[item.id]?.attachments ?? [];
              const currentScoreCfg = currentScore ? SCORE_CONFIG.find(c => c.score === currentScore) : null;

              return (
                <div
                  key={item.id}
                  className={`bg-card rounded-2xl border transition-all ${
                    hasAnswer ? "border-border shadow-sm" : "border-border"
                  }`}
                >
                  {/* Item header */}
                  <div className="p-5 pb-4">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="shrink-0 mt-0.5">
                        {hasAnswer
                          ? currentNa
                            ? <MinusCircle className="w-5 h-5 text-slate-400" />
                            : currentScore && currentScore >= 4
                              ? <CheckCircle2 className={`w-5 h-5 ${SCORE_CONFIG.find(c => c.score === currentScore)?.text ?? "text-foreground"}`} />
                              : <AlertCircle className={`w-5 h-5 ${SCORE_CONFIG.find(c => c.score === currentScore)?.text ?? "text-foreground"}`} />
                          : <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-xs font-bold font-mono bg-muted text-muted-foreground px-2 py-0.5 rounded">{item.id}</span>
                          <h3 className="font-semibold text-foreground">{item.label}</h3>
                          {currentScoreCfg && !currentNa && (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${currentScoreCfg.bg} ${currentScoreCfg.border} ${currentScoreCfg.text}`}>
                              {currentScoreCfg.longLabel}
                            </span>
                          )}
                          {currentNa && (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${NA_CONFIG.bg} ${NA_CONFIG.border} ${NA_CONFIG.text}`}>
                              Not Applicable
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                    </div>

                    {/* Score selector */}
                    <div className="flex flex-wrap gap-2">
                      {SCORE_CONFIG.map(cfg => {
                        const isSelected = !currentNa && currentScore === cfg.score;
                        const levelReq = item.scoreLevels.find(l => l.score === cfg.score)?.requirement ?? "";
                        return (
                          <div key={cfg.score} className="relative" onMouseLeave={() => setHoveredScore(null)}>
                            <button
                              onClick={() => setScore(item.id, cfg.score)}
                              onMouseEnter={() => setHoveredScore({ itemId: item.id, score: cfg.score })}
                              className={`w-10 h-10 rounded-xl border-2 font-bold text-sm transition-all select-none ${
                                isSelected
                                  ? `${cfg.bg} ${cfg.border} ${cfg.text} ring-2 ${cfg.ring} shadow-sm scale-105`
                                  : `bg-background border-border text-muted-foreground ${cfg.hover}`
                              }`}
                            >
                              {cfg.score}
                            </button>
                            {hoveredScore?.itemId === item.id && hoveredScore.score === cfg.score && (
                              <ScoreTooltip text={levelReq} longLabel={cfg.longLabel} score={cfg.score} />
                            )}
                          </div>
                        );
                      })}
                      {/* N/A */}
                      <button
                        onClick={() => setScore(item.id, null, true)}
                        className={`px-3 h-10 rounded-xl border-2 font-semibold text-xs transition-all ${
                          currentNa
                            ? `${NA_CONFIG.bg} ${NA_CONFIG.border} ${NA_CONFIG.text} ring-2 ${NA_CONFIG.ring}`
                            : "bg-background border-border text-muted-foreground hover:bg-slate-50 hover:border-slate-300 hover:text-slate-500"
                        }`}
                      >
                        N/A
                      </button>

                      {/* Tooltip info hint */}
                      <div className="flex items-center gap-1 ml-1 text-muted-foreground/60 text-xs">
                        <Info className="w-3.5 h-3.5" />
                        <span>Hover a score to see requirements</span>
                      </div>
                    </div>
                  </div>

                  {/* Evidence & notes footer */}
                  <div className="border-t border-border px-5 py-3 bg-muted/20 rounded-b-2xl space-y-3">
                    {/* Evidence attachments */}
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <Paperclip className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-xs font-semibold text-muted-foreground">
                          Evidence Documents
                          {itemAttachments.length > 0 && (
                            <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">{itemAttachments.length}</span>
                          )}
                        </span>
                      </div>
                      <AttachmentUploader
                        itemId={item.id}
                        attachments={itemAttachments}
                        onAttachmentsChange={setAttachments}
                        sessionToken={sessionToken}
                      />
                    </div>

                    {/* Notes */}
                    <div>
                      <button
                        onClick={() => toggleNotes(item.id)}
                        className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {notesExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        {responses[item.id]?.notes ? "Audit notes" : "Add audit notes"}
                        {responses[item.id]?.notes && !notesExpanded && (
                          <span className="ml-1 px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">✓</span>
                        )}
                      </button>
                      {notesExpanded && (
                        <textarea
                          value={responses[item.id]?.notes ?? ""}
                          onChange={e => setNotes(item.id, e.target.value)}
                          rows={3}
                          placeholder="Record observations, findings, or auditor notes…"
                          className="mt-2 w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 resize-none transition-all"
                        />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Section navigation footer */}
          <div className="mt-6 flex justify-between">
            {(() => {
              const currentIdx = GMP_SECTIONS.findIndex(s => s.id === activeSectionId);
              const prev = GMP_SECTIONS[currentIdx - 1];
              const next = GMP_SECTIONS[currentIdx + 1];
              return (
                <>
                  <div>
                    {prev && (
                      <button
                        onClick={() => setActiveSectionId(prev.id)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-card text-sm font-medium hover:bg-muted/50 transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4" /> {prev.title}
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Save
                    </button>
                    {next && (
                      <button
                        onClick={() => setActiveSectionId(next.id)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-card text-sm font-medium hover:bg-muted/50 transition-colors"
                      >
                        {next.title} <ChevronLeft className="w-4 h-4 rotate-180" />
                      </button>
                    )}
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
